import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { createOneGlobalOrder } from '@/lib/1global';
import { resolveAttribution, saveOrderAttribution } from '@/lib/referral';
import { processOrderAttribution, voidCommission, voidReferralReward } from '@/lib/commission';
import { runFraudChecks } from '@/lib/fraud';
import type { AttributionCookies } from '@/lib/referral';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
        // Create 1GLOBAL order
        const oneGlobalResponse = await createOneGlobalOrder({
          sku: order.plans.supplier_sku,
          email: order.users.email,
          reference: orderId,
        });

        // Update order with 1GLOBAL details and set status to provisioning
        await supabase
          .from('orders')
          .update({
            status: 'provisioning',
            connect_order_id: oneGlobalResponse.orderId,
            qr_url: oneGlobalResponse.qrCode || null,
            smdp: oneGlobalResponse.smdpAddress || null,
            activation_code: oneGlobalResponse.activationCode || null,
          })
          .eq('id', orderId);

        console.log('1GLOBAL order created:', oneGlobalResponse.orderId);

        // If we have immediate activation details, mark as completed
        if (oneGlobalResponse.smdpAddress && oneGlobalResponse.activationCode) {
          await supabase
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', orderId);
        }
      } catch (error) {
        console.error('Failed to create 1GLOBAL order:', error);
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
