import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { assignEsim, topUpEsim } from '@/lib/esimaccess';
import { resolveAttribution, saveOrderAttribution } from '@/lib/referral';
import { processOrderAttribution, voidCommission, voidReferralReward } from '@/lib/commission';
import { runFraudChecks } from '@/lib/fraud';
import { sendReferralRewardEmail, sendTopUpConfirmationEmail } from '@/lib/email';
import type { AttributionCookies } from '@/lib/referral';

// Lazy initialization - only create instance when needed
let stripe: Stripe | null = null;

function getStripeClient() {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY?.replace(/\s+/g, '');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripe;
}

// Support both live and test webhook signing secrets so mobile app reviewers
// can use Stripe TEST mode without affecting production users.
const webhookSecrets: string[] = [
  (process.env.STRIPE_WEBHOOK_SECRET || '').replace(/\s+/g, ''),
  (process.env.STRIPE_WEBHOOK_SECRET_TEST || '').replace(/\s+/g, ''),
].filter((value) => Boolean(value));

if (webhookSecrets.length === 0) {
  console.error('No Stripe webhook secrets configured');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const internalSecret = req.headers.get('x-internal-secret');

    let event: Stripe.Event;

    // Check for internal free order (100% discount bypass)
    const isInternalCall = internalSecret === process.env.INTERNAL_WEBHOOK_SECRET;

    if (isInternalCall && !signature) {
      // Free order from internal checkout - verify secret instead of signature
      try {
        const parsedEvent = JSON.parse(body);
        // Generate a unique ID for free orders using timestamp and order ID
        const orderId = parsedEvent.data?.object?.metadata?.orderId || 'unknown';
        parsedEvent.id = `free_${orderId}_${Date.now()}`;
        event = parsedEvent;
      } catch (parseError) {
        return NextResponse.json({ error: 'Invalid free order body' }, { status: 400 });
      }
    } else {
      // Normal Stripe webhook - verify signature
      if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
      }

      if (webhookSecrets.length === 0) {
        return NextResponse.json({ error: 'Webhook secrets not configured' }, { status: 500 });
      }

      // Try all configured webhook secrets (live + test) before failing
      let constructedEvent: Stripe.Event | null = null;
      let lastError: unknown;

      for (const secret of webhookSecrets) {
        try {
          constructedEvent = getStripeClient().webhooks.constructEvent(body, signature, secret);
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!constructedEvent) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }

      event = constructedEvent;
    }

    // Idempotency check using atomic insert to prevent race conditions
    // If two webhooks arrive simultaneously, only one will succeed inserting
    const idempotencyKey = event.id;
    const { error: idempotencyError } = await supabase
      .from('webhook_idempotency')
      .insert({
        idempotency_key: idempotencyKey,
        webhook_type: event.type,
        response_data: { event_id: event.id },
      });

    // If insert failed due to unique constraint violation, webhook was already processed
    if (idempotencyError) {
      if (idempotencyError.code === '23505') {
        // PostgreSQL unique violation code
        return NextResponse.json({ received: true, cached: true });
      }
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const afid = session.metadata?.afid; // affiliate click ID
      const rfcd = session.metadata?.rfcd; // referral code
      const sessionId = session.metadata?.sessionId;
      const ipAddress = session.metadata?.ipAddress;
      const userAgent = session.metadata?.userAgent;
      const isTopUp = session.metadata?.isTopUp === 'true';
      const iccid = session.metadata?.iccid;
      const needsPasswordSetup = session.metadata?.needsPasswordSetup === 'true';
      const userEmail = session.metadata?.userEmail;
      const discountCodeId = session.metadata?.discountCodeId;
      const discountSource = session.metadata?.discountSource;
      const discountPercent = parseInt(session.metadata?.discountPercent || '0', 10);
      const basePriceUSD = parseFloat(session.metadata?.basePriceUSD || '0');
      const finalPriceUSD = parseFloat(session.metadata?.finalPriceUSD || '0');
      // Note: We no longer use data credits as payment discounts - they're actual data now

      if (!orderId) {
        return NextResponse.json({ error: 'No orderId' }, { status: 400 });
      }

      // Get order details first
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*, plans(*), users(*)')
        .eq('id', orderId)
        .single();

      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Calculate amount_cents from plan price
      const amountCents = Math.round((existingOrder.plans?.retail_price || 0) * 100);

      // Update order status to paid with amount and paid_at
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          amount_cents: amountCents,
          currency: existingOrder.plans?.currency || 'USD',
          paid_at: new Date().toISOString(),
          payment_method: 'stripe',
        })
        .eq('id', orderId)
        .select('*, plans(*), users(*)')
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
      }


      // Send password setup email for new users
      if (needsPasswordSetup && userEmail) {
        try {
          await supabase.auth.resetPasswordForEmail(userEmail, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          });
        } catch (error) {
          // Don't fail the webhook
        }
      }

      // Track discount code usage (skip if already recorded by checkout route)
      if (discountCodeId && discountSource === 'code' && discountPercent > 0) {
        try {
          // Check if already recorded (for free orders, checkout route records it)
          const { data: existingUsage } = await supabase
            .from('discount_code_usage')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();

          if (!existingUsage) {
            const discountAmountUSD = basePriceUSD - finalPriceUSD;

            await supabase
              .from('discount_code_usage')
              .insert({
                discount_code_id: discountCodeId,
                order_id: orderId,
                user_id: order.user_id,
                discount_percent: discountPercent,
                original_price_usd: basePriceUSD,
                discount_amount_usd: discountAmountUSD,
                final_price_usd: finalPriceUSD,
              });
          }
        } catch (error) {
          // Don't fail the webhook
        }
      }

      // Resolve attribution
      const cookies: AttributionCookies = {
        afid: afid || undefined,
        rfcd: rfcd || undefined,
      };

      const attribution = await resolveAttribution(cookies, order.user_id);
      const savedAttribution = await saveOrderAttribution(order.id, attribution);

      if (savedAttribution) {
        // Process commissions/rewards
        // IMPORTANT: If a discount code was used, we don't create free data rewards
        // Only referral codes get the 1GB free data for both users
        const skipRewards = discountSource === 'code';
        const result = await processOrderAttribution(order, savedAttribution, skipRewards);

        if (result.reward) {
          // Send email notification to referrer about their reward
          try {
            // Get referrer profile (for referral code) and user (for email)
            const { data: referrerProfile } = await supabase
              .from('user_profiles')
              .select('ref_code')
              .eq('id', savedAttribution.referrer_user_id)
              .maybeSingle();

            const { data: referrerUser } = await supabase
              .from('users')
              .select('email')
              .eq('id', savedAttribution.referrer_user_id)
              .maybeSingle();

            // Get referred user email
            const referredUserEmail =
              order.users?.email || (Array.isArray(order.users) ? order.users[0]?.email : null);

            if (referrerUser && referrerUser.email && referredUserEmail) {
              const rewardMB = result.reward.reward_value;
              const rewardGB = (rewardMB / 1024).toFixed(1);

              await sendReferralRewardEmail({
                to: referrerUser.email,
                referredUserEmail: referredUserEmail,
                rewardAmount: `${rewardGB} GB`,
                referralCode: referrerProfile?.ref_code || '',
              });
            }
          } catch (emailError) {
            // Don't throw - webhook should still succeed even if email fails
          }
        }

        // Run fraud checks
        await runFraudChecks({
          orderId: order.id,
          userId: order.user_id,
          affiliateId: savedAttribution.affiliate_id || undefined,
          referrerUserId: savedAttribution.referrer_user_id || undefined,
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
          countryCode: order.plans?.region_code || undefined,
        });
      }

      try {
        // Get plan and user data (handle Supabase join format)
        const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
        const user = Array.isArray(order.users) ? order.users[0] : order.users;

        if (!plan || !user) {
          throw new Error('Plan or user data missing from order');
        }

        if (isTopUp && iccid) {
          // Top-up existing eSIM
          // Get existing order to check for esimTranNo and current data values (for test mode simulation)
          const { data: existingOrderForTopUp } = await supabase
            .from('orders')
            .select('esim_tran_no, iccid, total_bytes, data_usage_bytes, data_remaining_bytes, expires_at, plans(data_gb)')
            .eq('user_id', user.id)
            .eq('iccid', iccid)
            .eq('is_topup', false) // Get the original order for accurate data
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const esimTranNo = existingOrderForTopUp?.esim_tran_no;

          // Generate unique transaction ID
          const transactionId = `topup_${orderId}_${Date.now()}`;

          // Check if user is a test user (for mocking eSIM provision)
          const isTestUser = (user as any).is_test_user === true;

          // Calculate existing data bytes with proper fallbacks
          // Priority: total_bytes > (remaining + usage) > plan data > 0
          const existingPlan = Array.isArray(existingOrderForTopUp?.plans)
            ? existingOrderForTopUp.plans[0]
            : existingOrderForTopUp?.plans;
          const existingDataBytes = (existingOrderForTopUp?.total_bytes
            ?? ((existingOrderForTopUp?.data_remaining_bytes ?? 0) + (existingOrderForTopUp?.data_usage_bytes ?? 0)))
            || ((existingPlan?.data_gb ?? 0) * 1024 * 1024 * 1024);

          const topUpResponse = await topUpEsim({
            iccid: iccid, // Always pass ICCID (safe: topUpEsim prefers esimTranNo for real API, but needs iccid for mock return)
            esimTranNo: esimTranNo || undefined,
            packageCode: plan.supplier_sku,
            transactionId,
            amount: plan.retail_price.toString(),
            // Mock data for test users - simulates realistic top-up
            mockPlanDataGb: plan.data_gb,
            mockPlanValidityDays: plan.validity_days,
            mockExistingDataBytes: existingDataBytes,
            mockExistingUsageBytes: existingOrderForTopUp?.data_usage_bytes || 0,
            mockExistingExpiryTime: existingOrderForTopUp?.expires_at || undefined,
          }, isTestUser);

          if (topUpResponse.success) {
            // Update top-up order with details and cumulative data for consistency
            const { error: topUpOrderUpdateError } = await supabase
              .from('orders')
              .update({
                status: 'completed',
                iccid: topUpResponse.iccid,
                total_bytes: topUpResponse.totalVolume, // Include for consistency with original order
                data_remaining_bytes: topUpResponse.totalVolume - topUpResponse.orderUsage,
                data_usage_bytes: topUpResponse.orderUsage,
                expires_at: topUpResponse.expiredTime, // New expiry after top-up
                last_usage_update: new Date().toISOString(),
              })
              .eq('id', orderId);

            if (topUpOrderUpdateError) {
              console.error('[Webhook] Failed to update top-up order:', topUpOrderUpdateError);
              // Continue anyway - the eSIM provider has already processed the top-up
            }

            // ALSO update the ORIGINAL order's data so UI shows correct totals
            const { error: originalOrderUpdateError, count: originalOrderCount } = await supabase
              .from('orders')
              .update(
                {
                  data_remaining_bytes: topUpResponse.totalVolume - topUpResponse.orderUsage,
                  data_usage_bytes: topUpResponse.orderUsage,
                  total_bytes: topUpResponse.totalVolume,
                  expires_at: topUpResponse.expiredTime, // Update expiry on original order too
                  last_usage_update: new Date().toISOString(),
                },
                { count: 'exact' }
              )
              .eq('iccid', topUpResponse.iccid)
              .eq('is_topup', false);

            if (originalOrderUpdateError) {
              console.error('[Webhook] Failed to update original order:', originalOrderUpdateError);
              // Don't fail the webhook - top-up succeeded, but log for investigation
            } else if (originalOrderCount === 0) {
              console.warn('[Webhook] No original order found to update for ICCID:', topUpResponse.iccid);
            } else {
              console.log('[Webhook] Updated original order data after checkout.session top-up');
            }

            // Send top-up confirmation email
            try {
              await sendTopUpConfirmationEmail({
                to: user.email,
                planName: plan.name,
                dataAdded: plan.data_gb,
                validityDays: plan.validity_days,
                iccid: topUpResponse.iccid,
              });
            } catch (emailError) {
              // Don't throw - webhook should still succeed even if email fails
            }
          } else {
            throw new Error('Top-up failed');
          }
        } else {
        // Check if user is a test user (for mocking eSIM provision)
        const isTestUser = (user as any).is_test_user === true;

        // Assign new eSIM via eSIM Access API
        const esimResponse = await assignEsim({
          packageId: plan.supplier_sku,
          email: user.email,
          reference: orderId,
        }, isTestUser);

          // For test users, mock response includes activation details immediately
          // For real users, we get 'provisioning' status and wait for ORDER_STATUS webhook
          if (isTestUser) {
            // Test user: save mock activation details and mark as completed
            const mockDataBytes = plan.data_gb * 1024 * 1024 * 1024;
            await supabase
              .from('orders')
              .update({
                status: 'completed',
                connect_order_id: esimResponse.orderId,
                iccid: esimResponse.iccid || null,
                smdp: esimResponse.smdpAddress || null,
                activation_code: esimResponse.activationCode || null,
                qr_url: esimResponse.qrCode || null,
                total_bytes: mockDataBytes,
                data_remaining_bytes: mockDataBytes,
                data_usage_bytes: 0,
              })
              .eq('id', orderId);
          } else {
            // Real user: only save standard fields, wait for ORDER_STATUS webhook
            await supabase
              .from('orders')
              .update({
                status: 'provisioning',
                connect_order_id: esimResponse.orderId,
                iccid: esimResponse.iccid || null,
              })
              .eq('id', orderId);
          }

          // Note: For real orders, email will be sent by eSIM Access webhook handler when ORDER_STATUS arrives
          // For test orders, activation details are already available
        }
      } catch (error) {
        // Mark order as failed
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', orderId);
      }
    }

    // Handle payment_intent.succeeded (for mobile Payment Sheet)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      const needsPasswordSetup = paymentIntent.metadata?.needsPasswordSetup === 'true';
      const userEmail = paymentIntent.metadata?.userEmail;
      const source = paymentIntent.metadata?.source;
      const isTopUpMeta = paymentIntent.metadata?.isTopUp === 'true';
      const metadataIccid = paymentIntent.metadata?.iccid;

      if (!orderId) {
        return NextResponse.json({ error: 'No orderId' }, { status: 400 });
      }

      // Get order details first
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*, plans(*), users(*)')
        .eq('id', orderId)
        .single();

      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Determine top-up status from order (source of truth) or metadata
      const isTopUp = existingOrder.is_topup === true || isTopUpMeta;
      // Prefer ICCID from order (set at checkout), then metadata
      const existingOrderIccid = existingOrder.iccid || metadataIccid;

      // Update order status to paid
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: 'stripe',
        })
        .eq('id', orderId)
        .select('*, plans(*), users(*)')
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
      }

      // Send password setup email for new users
      if (needsPasswordSetup && userEmail) {
        try {
          await supabase.auth.resetPasswordForEmail(userEmail, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          });
        } catch (error) {
          // Don't fail the webhook
        }
      }

      try {
        // Get plan and user data
        const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
        const user = Array.isArray(order.users) ? order.users[0] : order.users;

        if (!plan || !user) {
          throw new Error('Plan or user data missing from order');
        }

        // Check if user is a test user (for mocking eSIM provision)
        const isTestUser = (user as any).is_test_user === true;

        if (isTopUp && existingOrderIccid) {
          // TOP-UP: Add data to existing eSIM
          console.log('[Webhook] Processing top-up for ICCID:', existingOrderIccid);

          // Get esimTranNo and current data values from existing order (for test mode simulation)
          const { data: existingOrderForTopUp } = await supabase
            .from('orders')
            .select('esim_tran_no, iccid, total_bytes, data_usage_bytes, data_remaining_bytes, expires_at, plans(data_gb)')
            .eq('user_id', user.id)
            .eq('iccid', existingOrderIccid)
            .eq('is_topup', false) // Get the original order for accurate data
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const esimTranNo = existingOrderForTopUp?.esim_tran_no;
          const transactionId = `topup_${orderId}_${Date.now()}`;

          // Calculate existing data bytes with proper fallbacks
          // Priority: total_bytes > (remaining + usage) > plan data > 0
          const existingPlan = Array.isArray(existingOrderForTopUp?.plans)
            ? existingOrderForTopUp.plans[0]
            : existingOrderForTopUp?.plans;
          const existingDataBytes = (existingOrderForTopUp?.total_bytes
            ?? ((existingOrderForTopUp?.data_remaining_bytes ?? 0) + (existingOrderForTopUp?.data_usage_bytes ?? 0)))
            || ((existingPlan?.data_gb ?? 0) * 1024 * 1024 * 1024);

          const topUpResponse = await topUpEsim({
            iccid: existingOrderIccid,
            esimTranNo: esimTranNo || undefined,
            packageCode: plan.supplier_sku,
            transactionId,
            amount: plan.retail_price.toString(),
            // Mock data for test users - simulates realistic top-up
            mockPlanDataGb: plan.data_gb,
            mockPlanValidityDays: plan.validity_days,
            mockExistingDataBytes: existingDataBytes,
            mockExistingUsageBytes: existingOrderForTopUp?.data_usage_bytes || 0,
            mockExistingExpiryTime: existingOrderForTopUp?.expires_at || undefined,
          }, isTestUser);

          if (topUpResponse.success) {
            // Update top-up order with details and cumulative data for consistency
            const { error: topUpOrderUpdateError } = await supabase
              .from('orders')
              .update({
                status: 'completed',
                iccid: topUpResponse.iccid,
                total_bytes: topUpResponse.totalVolume, // Include for consistency with original order
                data_remaining_bytes: topUpResponse.totalVolume - topUpResponse.orderUsage,
                data_usage_bytes: topUpResponse.orderUsage,
                expires_at: topUpResponse.expiredTime, // New expiry after top-up
                last_usage_update: new Date().toISOString(),
              })
              .eq('id', orderId);

            if (topUpOrderUpdateError) {
              console.error('[Webhook] Failed to update top-up order:', topUpOrderUpdateError);
              // Continue anyway - the eSIM provider has already processed the top-up
            }

            // ALSO update the ORIGINAL order's data so UI shows correct totals
            const { error: originalOrderUpdateError, count: originalOrderCount } = await supabase
              .from('orders')
              .update(
                {
                  data_remaining_bytes: topUpResponse.totalVolume - topUpResponse.orderUsage,
                  data_usage_bytes: topUpResponse.orderUsage,
                  total_bytes: topUpResponse.totalVolume,
                  expires_at: topUpResponse.expiredTime, // Update expiry on original order too
                  last_usage_update: new Date().toISOString(),
                },
                { count: 'exact' }
              )
              .eq('iccid', topUpResponse.iccid)
              .eq('is_topup', false);

            if (originalOrderUpdateError) {
              console.error('[Webhook] Failed to update original order:', originalOrderUpdateError);
              // Don't fail the webhook - top-up succeeded, but log for investigation
            } else if (originalOrderCount === 0) {
              console.warn('[Webhook] No original order found to update for ICCID:', topUpResponse.iccid);
            } else {
              console.log('[Webhook] Updated original order data after payment_intent top-up');
            }

            // Send top-up confirmation email
            try {
              await sendTopUpConfirmationEmail({
                to: user.email,
                planName: plan.name,
                dataAdded: plan.data_gb,
                validityDays: plan.validity_days,
                iccid: topUpResponse.iccid,
              });
            } catch (emailError) {
              // Don't fail webhook for email errors
            }
          } else {
            throw new Error('Top-up failed');
          }
        } else {
          // NEW eSIM: Assign new eSIM via eSIM Access API
          const esimResponse = await assignEsim({
            packageId: plan.supplier_sku,
            email: user.email,
            reference: orderId,
          }, isTestUser);

          // For test users, mock response includes activation details immediately
          // For real users, we get 'provisioning' status and wait for ORDER_STATUS webhook
          if (isTestUser) {
            // Test user: save mock activation details and mark as completed
            const mockDataBytes = plan.data_gb * 1024 * 1024 * 1024;
            await supabase
              .from('orders')
              .update({
                status: 'completed',
                connect_order_id: esimResponse.orderId,
                iccid: esimResponse.iccid || null,
                smdp: esimResponse.smdpAddress || null,
                activation_code: esimResponse.activationCode || null,
                qr_url: esimResponse.qrCode || null,
                total_bytes: mockDataBytes,
                data_remaining_bytes: mockDataBytes,
                data_usage_bytes: 0,
              })
              .eq('id', orderId);
          } else {
            // Real user: only save standard fields, wait for ORDER_STATUS webhook
            await supabase
              .from('orders')
              .update({
                status: 'provisioning',
                connect_order_id: esimResponse.orderId,
                iccid: esimResponse.iccid || null,
              })
              .eq('id', orderId);
          }
        }
      } catch (error) {
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', orderId);
      }
    }

    // Handle charge.refunded
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = charge.payment_intent as string;

      // Find order by payment intent
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', paymentIntent)
        .maybeSingle();

      if (order) {
        // Void commissions and rewards
        await voidCommission(order.id);
        await voidReferralReward(order.id);

        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', order.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
