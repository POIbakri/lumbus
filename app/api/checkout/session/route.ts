import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { ensureUserProfile } from '@/lib/referral';
import { getCurrencyForCheckout, convertToStripeAmount, formatPrice, detectCountryFromRequest } from '@/lib/currency';
import { z } from 'zod';

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

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  email: z.string().email().optional(),
  isTopUp: z.boolean().optional(),
  existingOrderId: z.string().uuid().optional(),
  iccid: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, email, isTopUp, existingOrderId, iccid } = checkoutSchema.parse(body);

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

    // Get or create user (for top-ups, get from existing order)
    let user;
    if (isTopUp && existingOrderId) {
      // For top-ups, get user from existing order
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('user_id, users(*)')
        .eq('id', existingOrderId)
        .single();

      if (!existingOrder) {
        return NextResponse.json({ error: 'Existing order not found' }, { status: 404 });
      }

      user = Array.isArray(existingOrder.users) ? existingOrder.users[0] : existingOrder.users;
    } else {
      // Regular flow: Get or create user by email
      if (!email) {
        return NextResponse.json({ error: 'Email is required for new orders' }, { status: 400 });
      }

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
    }

    // Check if user was referred and is eligible for 10% discount (first order only)
    // Top-ups never get discounts
    let applyDiscount = false;
    let discountPercent = 0;

    if (!isTopUp) {
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
      applyDiscount = isFirstOrder && hasReferral;
      discountPercent = applyDiscount ? 10 : 0;
    }

    // Detect user's currency based on their location
    const detectedCountry = detectCountryFromRequest(req.headers);
    const userCurrency = getCurrencyForCheckout(req.headers);

    // Calculate price with discount if applicable (in USD)
    const basePriceUSD = plan.retail_price;
    const finalPriceUSD = applyDiscount ? basePriceUSD * 0.9 : basePriceUSD; // 10% off

    // Convert to user's currency for Stripe
    const stripeAmount = convertToStripeAmount(finalPriceUSD, userCurrency);

    console.log(`Checkout: Country=${detectedCountry}, Currency=${userCurrency}, USD=${finalPriceUSD}, Converted=${stripeAmount}`);

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

    // Create Stripe Checkout Session with user's local currency
    const orderType = isTopUp ? 'Top-up' : 'New eSIM';
    const lineItems = [
      {
        price_data: {
          currency: userCurrency.toLowerCase(),
          product_data: {
            name: isTopUp ? `${plan.name} (Top-up)` : plan.name,
            description: `${orderType}: ${plan.data_gb}GB eSIM - Valid for ${plan.validity_days} days${applyDiscount ? ' (10% Referral Discount Applied)' : ''}`,
          },
          unit_amount: stripeAmount, // Already converted to smallest currency unit
        },
        quantity: 1,
      },
    ];

    const successUrl = isTopUp
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup=success&order=${order.id}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}?session_id={CHECKOUT_SESSION_ID}`;

    const session = await getStripeClient().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: isTopUp
        ? `${process.env.NEXT_PUBLIC_APP_URL}/topup/${existingOrderId}?canceled=true`
        : `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
      customer_email: user.email,
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
        isTopUp: isTopUp ? 'true' : 'false',
        existingOrderId: existingOrderId || '',
        iccid: iccid || '',
        detectedCountry: detectedCountry,
        currency: userCurrency,
        originalPriceUSD: finalPriceUSD.toString(),
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          isTopUp: isTopUp ? 'true' : 'false',
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
