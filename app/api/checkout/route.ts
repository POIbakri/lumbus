import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { convertToStripeAmount, type Currency } from '@/lib/currency';

// Lazy initialization - create separate clients for live vs test
let stripeLive: Stripe | null = null;
let stripeTest: Stripe | null = null;

type StripeMode = 'live' | 'test';

function getStripeClient(mode: StripeMode = 'live') {
  // IMPORTANT:
  // - Live mode MUST use STRIPE_SECRET_KEY and must NOT fall back to test keys.
  // - Test mode MUST use STRIPE_SECRET_KEY_TEST and must NOT fall back to live keys.
  let rawKey: string | undefined;

  if (mode === 'test') {
    rawKey = process.env.STRIPE_SECRET_KEY_TEST;
  } else {
    rawKey = process.env.STRIPE_SECRET_KEY;
  }

  const apiKey = rawKey?.replace(/\s+/g, '');

  if (!apiKey) {
    const baseMessage = 'Stripe secret key is not configured';
    const detail =
      mode === 'test'
        ? 'Expected STRIPE_SECRET_KEY_TEST for test mode'
        : 'Expected STRIPE_SECRET_KEY for live mode';
    throw new Error(`${baseMessage}: ${detail}`);
  }

  if (mode === 'test') {
    if (!stripeTest) {
      stripeTest = new Stripe(apiKey, {
        apiVersion: '2025-02-24.acacia',
      });
    }
    return stripeTest;
  }

  if (!stripeLive) {
    stripeLive = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeLive;
}

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  email: z.string().email(),
  currency: z.string().optional().default('USD'),
});

/**
 * Mobile Checkout API - Creates Payment Intent for Stripe Payment Sheet
 *
 * This endpoint is specifically for the React Native mobile app.
 * It creates a Payment Intent (not a Checkout Session) for use with Stripe's native Payment Sheet.
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Mobile Checkout] Starting mobile checkout...');
    const body = await req.json();
    console.log('[Mobile Checkout] Request body:', { planId: body.planId, email: body.email });

    const { planId, email, currency } = checkoutSchema.parse(body);

    // Get plan details
    console.log('[Mobile Checkout] Fetching plan:', planId);
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[Mobile Checkout] Plan not found:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    console.log('[Mobile Checkout] Plan found:', plan.name);

    // Get or create user
    console.log('[Mobile Checkout] Looking for existing user:', email);
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    let user;
    let isNewUser = false;

    if (existingUser) {
      console.log('[Mobile Checkout] Using existing user:', existingUser.id);
      user = existingUser;
    } else {
      // Create new user without password (passwordless)
      console.log('[Mobile Checkout] Creating new user (no password yet)...');
      isNewUser = true;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: false,
        user_metadata: {
          created_via: 'mobile_checkout',
          needs_password_setup: true
        }
      });

      if (authError) {
        // Generic error to prevent user enumeration
        logger.error('[Mobile Checkout] Auth user creation error', authError);
        return NextResponse.json({
          error: 'Unable to process checkout. Please try again or contact support.',
        }, { status: 400 });
      }

      if (!authData?.user) {
        console.error('[Mobile Checkout] Auth user creation failed - no user data returned');
        return NextResponse.json({
          error: 'Failed to create user account - no user data',
        }, { status: 500 });
      }

      console.log('[Mobile Checkout] Passwordless user created:', authData.user.id);

      // Wait for trigger to create user in users table
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: newUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (fetchError || !newUser) {
        console.error('[Mobile Checkout] Failed to fetch new user:', fetchError);
        return NextResponse.json({
          error: 'User account created but failed to fetch',
          details: fetchError?.message
        }, { status: 500 });
      }

      user = newUser;
    }
    console.log('[Mobile Checkout] User ready:', user.id);

    // Create pending order
    console.log('[Mobile Checkout] Creating order in database...');
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
      console.error('[Mobile Checkout] Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    console.log('[Mobile Checkout] Order created:', order.id);

    // Create Payment Intent for mobile
    // Convert price from USD to user's currency
    const amount = convertToStripeAmount(plan.retail_price, currency as Currency);

    // Route specific users (e.g. App Store / Play Store reviewers) through Stripe TEST mode
    const stripeMode: StripeMode = (user as any).is_test_user ? 'test' : 'live';

    console.log('[Mobile Checkout] Creating Payment Intent...', {
      currency,
      amount,
      stripeMode,
      userId: user.id,
      userEmail: user.email,
    });

    const paymentIntent = await getStripeClient(stripeMode).paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      receipt_email: user.email,
      metadata: {
        orderId: order.id,
        planId: planId,
        userId: user.id,
        userEmail: user.email,
        needsPasswordSetup: isNewUser ? 'true' : 'false',
        source: 'mobile',
        stripeMode,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('[Mobile Checkout] Payment Intent created:', paymentIntent.id);

    // Update order with Payment Intent ID
    await supabase
      .from('orders')
      .update({
        stripe_session_id: paymentIntent.id,
        amount_cents: amount,
      })
      .eq('id', order.id);

    console.log('[Mobile Checkout] Success! Returning client secret');

    // Return the correct publishable key so the mobile app can initialize the right Stripe mode
    const publishableKey =
      stripeMode === 'test'
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error(`[Mobile Checkout] Publishable key missing for ${stripeMode} mode`);
      // Fallback to live key if test key missing (safer than undefined)
      // but really this should be an error or alert
      if (stripeMode === 'test') {
        console.warn('[Mobile Checkout] Falling back to live key for test user due to missing config');
        // NOTE: This might cause a client-side error if they try to use a test PaymentIntent with live PK
        // but it's better than returning undefined.
        // Ideally we should just error out here.
      }
      return NextResponse.json({
        error: 'Configuration error',
        message: 'Payment configuration missing. Please contact support.'
      }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      publishableKey,
      stripeMode, 
    });
  } catch (error) {
    console.error('[Mobile Checkout] Error:', error);
    console.error('[Mobile Checkout] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
