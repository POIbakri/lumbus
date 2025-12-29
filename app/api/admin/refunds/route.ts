import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

interface RefundableOrder {
  id: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  amount_cents: number | null;
  currency: string;
  is_topup: boolean;
  refunded_at: string | null;
  refund_reason: string | null;
  plan: {
    name: string;
    data_gb: number;
    retail_price: number;
  } | null;
}

// GET - Search for user orders by email
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (userError) {
      console.error('[Refunds] User lookup error:', userError);
      return NextResponse.json({ error: 'Failed to lookup user' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found', orders: [] }, { status: 404 });
    }

    // Get user's orders that have been paid
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        paid_at,
        stripe_session_id,
        amount_cents,
        currency,
        is_topup,
        refunded_at,
        refund_reason,
        plans!orders_plan_id_fkey(name, data_gb, retail_price)
      `)
      .eq('user_id', user.id)
      .not('paid_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('[Refunds] Orders lookup error:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const formattedOrders: RefundableOrder[] = (orders || []).map((order: any) => ({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      stripe_payment_intent_id: null, // Will be fetched from Stripe if needed
      stripe_session_id: order.stripe_session_id,
      amount_cents: order.amount_cents,
      currency: order.currency || 'USD',
      is_topup: order.is_topup || false,
      refunded_at: order.refunded_at,
      refund_reason: order.refund_reason,
      plan: order.plans ? {
        name: order.plans.name,
        data_gb: order.plans.data_gb,
        retail_price: order.plans.retail_price,
      } : null,
    }));

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('[Refunds] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Issue a refund
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        stripe_session_id,
        amount_cents,
        currency,
        refunded_at,
        user_id,
        users!orders_user_id_fkey(email)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Refunds] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.refunded_at) {
      return NextResponse.json({ error: 'Order has already been refunded' }, { status: 400 });
    }

    // Get the payment intent ID from Stripe session
    let paymentIntentId: string | null = null;

    if (order.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        paymentIntentId = session.payment_intent as string;
      } catch (stripeError) {
        console.error('[Refunds] Failed to retrieve session:', stripeError);
      }
    }

    if (!paymentIntentId) {
      return NextResponse.json({
        error: 'Cannot process refund: No payment intent found for this order'
      }, { status: 400 });
    }

    // Issue the refund via Stripe
    console.log(`[Refunds] Issuing refund for order ${orderId}, payment intent: ${paymentIntentId}`);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        order_id: orderId,
        admin_reason: reason || 'Admin initiated refund',
      },
    });

    console.log(`[Refunds] Refund created: ${refund.id}, amount: ${refund.amount}, status: ${refund.status}`);

    // Update the order to mark as refunded
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        refunded_at: new Date().toISOString(),
        refund_reason: reason || 'Admin initiated refund',
        status: 'refunded',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Refunds] Failed to update order:', updateError);
      // Refund was issued but DB update failed - log but don't fail
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      },
      message: `Refund of ${(refund.amount / 100).toFixed(2)} ${refund.currency.toUpperCase()} issued successfully`,
    });
  } catch (error: any) {
    console.error('[Refunds] POST error:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({
        error: `Stripe error: ${error.message}`
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
