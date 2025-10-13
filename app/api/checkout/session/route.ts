import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { ensureUserProfile } from '@/lib/referral';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, email } = checkoutSchema.parse(body);

    // Get cookies for attribution
    const cookies = req.cookies;
    const afid = cookies.get('afid')?.value;
    const rfcd = cookies.get('rfcd')?.value;
    const sid = cookies.get('sid')?.value;

    // Get IP and User Agent
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get or create user
    let user;
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      user = existingUser;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ email })
        .select()
        .single();

      if (userError || !newUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    }

    // Ensure user profile exists (creates ref_code if new user)
    await ensureUserProfile(user.id);

    // Check if user was referred and is eligible for 10% discount (first order only)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('referred_by_code')
      .eq('id', user.id)
      .single();

    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['paid', 'completed']);

    const isFirstOrder = (orderCount || 0) === 0;
    const hasReferral = userProfile?.referred_by_code !== null && userProfile?.referred_by_code !== undefined;
    const applyDiscount = isFirstOrder && hasReferral;

    // Calculate price with discount if applicable
    const basePrice = plan.retail_price;
    const discountPercent = applyDiscount ? 10 : 0;
    const finalPrice = applyDiscount ? basePrice * 0.9 : basePrice; // 10% off

    // Create pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create Stripe Checkout Session
    const lineItems = [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: plan.name,
            description: `${plan.data_gb}GB eSIM - Valid for ${plan.validity_days} days${applyDiscount ? ' (10% Referral Discount Applied)' : ''}`,
          },
          unit_amount: Math.round(finalPrice * 100), // Convert to cents
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
      customer_email: email,
      metadata: {
        orderId: order.id,
        planId: planId,
        userId: user.id,
        afid: afid || '',
        rfcd: rfcd || '',
        sessionId: sid || '',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        discountApplied: applyDiscount ? 'true' : 'false',
        discountPercent: discountPercent.toString(),
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
        },
      },
      // Enable Apple Pay / Google Pay via Payment Request Button
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
