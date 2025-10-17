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
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripe;
}

const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').replace(/\s+/g, '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
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
        console.log(`Webhook ${idempotencyKey} already processed (duplicate detected)`);
        return NextResponse.json({ received: true, cached: true });
      }
      // Other database errors should be logged but not block processing
      console.error('Idempotency insert error:', idempotencyError);
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

      if (!orderId) {
        console.error('No orderId in session metadata');
        return NextResponse.json({ error: 'No orderId' }, { status: 400 });
      }

      // Get order details first
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*, plans(*), users(*)')
        .eq('id', orderId)
        .single();

      if (!existingOrder) {
        console.error('Order not found:', orderId);
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
        })
        .eq('id', orderId)
        .select('*, plans(*), users(*)')
        .single();

      if (orderError || !order) {
        console.error('Failed to update order:', orderError);
        return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
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
        const result = await processOrderAttribution(order, savedAttribution);

        if (result.commission) {
          console.log(`Created commission ${result.commission.id} for affiliate ${savedAttribution.affiliate_id}`);
        }

        if (result.reward) {
          console.log(`Created reward ${result.reward.id} for referrer ${savedAttribution.referrer_user_id}`);

          // Send email notification to referrer about their reward
          try {
            // Get referrer user details
            const { data: referrerUser } = await supabase
              .from('users')
              .select('email, referral_code')
              .eq('id', savedAttribution.referrer_user_id)
              .single();

            // Get referred user email
            const referredUserEmail = order.users?.email || (Array.isArray(order.users) ? order.users[0]?.email : null);

            if (referrerUser && referrerUser.email && referredUserEmail) {
              const rewardMB = result.reward.reward_value;
              const rewardGB = (rewardMB / 1024).toFixed(1);

              await sendReferralRewardEmail({
                to: referrerUser.email,
                referredUserEmail: referredUserEmail,
                rewardAmount: `${rewardGB} GB`,
                referralCode: referrerUser.referral_code || '',
              });

              console.log(`Referral reward email sent to ${referrerUser.email}`);
            }
          } catch (emailError) {
            console.error('Failed to send referral reward email:', emailError);
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
          console.log('Processing top-up for ICCID:', iccid);

          const topUpResponse = await topUpEsim(iccid, plan.supplier_sku);

          if (topUpResponse.success) {
            // Update order as completed for top-ups
            await supabase
              .from('orders')
              .update({
                status: 'completed',
                connect_order_id: topUpResponse.orderNo || null,
              })
              .eq('id', orderId);

            console.log('eSIM topped up successfully:', iccid);
            console.log('Top-up order ID:', topUpResponse.orderNo);

            // Send top-up confirmation email
            try {
              await sendTopUpConfirmationEmail({
                to: user.email,
                planName: plan.name,
                dataAdded: plan.data_gb,
                validityDays: plan.validity_days,
                iccid: iccid,
              });
              console.log('Top-up confirmation email sent to:', user.email);
            } catch (emailError) {
              console.error('Failed to send top-up confirmation email:', emailError);
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

          console.log('eSIM Access order created:', esimResponse.orderId);
          console.log('Waiting for ORDER_STATUS webhook with activation details...');

          // Note: Email will be sent by eSIM Access webhook handler when ORDER_STATUS arrives
        }
      } catch (error) {
        console.error(isTopUp ? 'Failed to top up eSIM:' : 'Failed to assign eSIM:', error);
        // Mark order as failed
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
        .single();

      if (order) {
        // Void commissions and rewards
        await voidCommission(order.id);
        await voidReferralReward(order.id);

        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', order.id);

        console.log(`Voided commissions/rewards for refunded order ${order.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
