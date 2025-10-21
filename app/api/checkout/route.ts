import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { convertToStripeAmount, type Currency } from '@/lib/currency';

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

    console.log('[Mobile Checkout] Creating Payment Intent...', { currency, amount });
    const paymentIntent = await getStripeClient().paymentIntents.create({
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
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
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
