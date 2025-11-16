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

const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').replace(/\s+/g, '');

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

      try {
        event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
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
          // Get existing order to check for esimTranNo
          const { data: existingOrderForTopUp } = await supabase
            .from('orders')
            .select('esim_tran_no, iccid')
            .eq('user_id', user.id)
            .eq('iccid', iccid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const esimTranNo = existingOrderForTopUp?.esim_tran_no;

          // Generate unique transaction ID
          const transactionId = `topup_${orderId}_${Date.now()}`;

          const topUpResponse = await topUpEsim({
            iccid: esimTranNo ? undefined : iccid, // Use iccid only if no esimTranNo
            esimTranNo: esimTranNo || undefined,
            packageCode: plan.supplier_sku,
            transactionId,
            amount: plan.retail_price.toString(),
          });

          if (topUpResponse.success) {
            // Update order with top-up details and new expiry/volume from API response
            await supabase
              .from('orders')
              .update({
                status: 'completed',
                iccid: topUpResponse.iccid,
                // Note: We don't update data_usage_bytes here as it's the OLD usage before topup
                // The totalVolume is the NEW total after top-up
                data_remaining_bytes: topUpResponse.totalVolume - topUpResponse.orderUsage,
                data_usage_bytes: topUpResponse.orderUsage,
                last_usage_update: new Date().toISOString(),
              })
              .eq('id', orderId);

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
          // Assign new eSIM via eSIM Access API
          const esimResponse = await assignEsim({
            packageId: plan.supplier_sku,
            email: user.email,
            reference: orderId,
          });

          // Update order with initial eSIM details
          // Status is 'provisioning' until we get activation details from ORDER_STATUS webhook
          await supabase
            .from('orders')
            .update({
              status: 'provisioning',
              connect_order_id: esimResponse.orderId,
              iccid: esimResponse.iccid || null,
            })
            .eq('id', orderId);

          // Note: Email will be sent by eSIM Access webhook handler when ORDER_STATUS arrives
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

        // Assign new eSIM via eSIM Access API
        const esimResponse = await assignEsim({
          packageId: plan.supplier_sku,
          email: user.email,
          reference: orderId,
        });

        // Update order with initial eSIM details
        await supabase
          .from('orders')
          .update({
            status: 'provisioning',
            connect_order_id: esimResponse.orderId,
            iccid: esimResponse.iccid || null,
          })
          .eq('id', orderId);
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
