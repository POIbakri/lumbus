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
  // Top-up fields
  isTopUp: z.boolean().optional(),
  existingOrderId: z.string().uuid().optional(),
  iccid: z.string().optional(),
  // Referral/attribution fields
  afid: z.string().optional(), // affiliate click ID
  rfcd: z.string().optional(), // referral code
  discountCode: z.string().optional(), // discount code (validated and applied server-side)
}).refine(
  (data) => !data.isTopUp || (data.iccid && data.iccid.length > 0),
  {
    message: 'iccid is required when isTopUp is true',
    path: ['iccid'],
  }
);

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
    console.log('[Mobile Checkout] Request body:', { planId: body.planId, email: body.email, isTopUp: body.isTopUp });

    const { planId, email, currency, isTopUp, existingOrderId, iccid, afid, rfcd, discountCode } = checkoutSchema.parse(body);

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

    // Validate ICCID ownership for top-ups
    if (isTopUp && iccid) {
      const { data: existingOrder, error: ownershipError } = await supabase
        .from('orders')
        .select('id, iccid, plans(is_reloadable)')
        .eq('user_id', user.id)
        .eq('iccid', iccid)
        .eq('is_topup', false) // Get original order to check plan's reloadability
        .limit(1)
        .maybeSingle();

      if (ownershipError) {
        console.error('[Mobile Checkout] ICCID ownership check failed:', ownershipError);
        return NextResponse.json({ error: 'Failed to validate eSIM ownership' }, { status: 500 });
      }

      if (!existingOrder) {
        console.warn('[Mobile Checkout] ICCID ownership validation failed - user does not own this eSIM:', {
          userId: user.id,
          iccid,
        });
        return NextResponse.json(
          { error: 'You do not own an eSIM with this ICCID' },
          { status: 403 }
        );
      }

      // Check if original plan supports top-ups
      const originalPlan = Array.isArray(existingOrder.plans) ? existingOrder.plans[0] : existingOrder.plans;
      if ((originalPlan as any)?.is_reloadable === false) {
        return NextResponse.json(
          { error: 'This plan does not support top-ups. Please purchase a new plan instead.' },
          { status: 400 }
        );
      }

      console.log('[Mobile Checkout] ICCID ownership validated:', existingOrder.id);
    }

    // Create pending order
    console.log('[Mobile Checkout] Creating order in database...', { isTopUp, existingOrderId, iccid });
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        is_topup: isTopUp || false,
        // Store the target ICCID for top-ups so webhook knows which eSIM to top up
        iccid: isTopUp && iccid ? iccid : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Mobile Checkout] Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    console.log('[Mobile Checkout] Order created:', order.id);

    // Validate and apply discount code if provided
    let discountPercent = 0;
    let discountCodeId: string | null = null;
    let discountSource: 'code' | 'referral' | null = null;
    const basePriceUSD = plan.retail_price;
    let finalPriceUSD = basePriceUSD;

    if (!isTopUp && discountCode) {
      console.log('[Mobile Checkout] Validating discount code:', discountCode);
      const { data: validationResult } = await supabase
        .rpc('validate_discount_code', {
          p_code: discountCode.toUpperCase().trim(),
          p_user_id: user.id,
        });

      const result = Array.isArray(validationResult) ? validationResult[0] : validationResult;

      if (result && result.is_valid) {
        discountPercent = result.discount_percent || 0;
        discountSource = 'code';
        finalPriceUSD = basePriceUSD * (1 - discountPercent / 100);
        console.log('[Mobile Checkout] Discount applied:', { discountPercent, finalPriceUSD });

        // Get discount code ID for tracking
        const { data: codeData } = await supabase
          .from('discount_codes')
          .select('id')
          .eq('code', discountCode.toUpperCase().trim())
          .maybeSingle();

        if (codeData) {
          discountCodeId = codeData.id;
        }
      } else {
        console.log('[Mobile Checkout] Discount code invalid:', result?.error || 'Unknown error');
      }
    }

    // Check for referral discount if no discount code applied
    if (!isTopUp && !discountSource && rfcd) {
      // Validate referral code exists and isn't self-referral
      const { data: referrerProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('ref_code', rfcd.toUpperCase().trim())
        .maybeSingle();

      if (referrerProfile && referrerProfile.id !== user.id) {
        // Valid referral code - check if user is first-time buyer
        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['paid', 'completed', 'provisioning']);

        if ((orderCount || 0) === 0) {
          discountPercent = 10;
          discountSource = 'referral';
          finalPriceUSD = basePriceUSD * 0.9;
          console.log('[Mobile Checkout] Referral discount applied: 10%');
        } else {
          console.log('[Mobile Checkout] Referral code valid but user is not first-time buyer');
        }
      } else if (referrerProfile && referrerProfile.id === user.id) {
        console.log('[Mobile Checkout] Self-referral rejected');
      } else {
        console.log('[Mobile Checkout] Invalid referral code:', rfcd);
      }
    }

    // Handle 100% discount - bypass Stripe entirely (free order)
    if (finalPriceUSD <= 0) {
      console.log('[Mobile Checkout] Free order detected (100% discount) - bypassing Stripe');

      // Mark order as paid with $0
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          amount_cents: 0,
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('[Mobile Checkout] Failed to update order:', updateError);
        return NextResponse.json({ error: 'Failed to process free order' }, { status: 500 });
      }

      // Trigger eSIM provisioning via internal webhook call
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`;
      const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;

      if (!internalSecret) {
        console.error('[Mobile Checkout] INTERNAL_WEBHOOK_SECRET is not configured');
        // Roll back order status
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      console.log('[Mobile Checkout] Triggering eSIM provisioning for free order');

      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': internalSecret,
          },
          body: JSON.stringify({
            type: 'checkout.session.completed',
            data: {
              object: {
                id: 'free_' + order.id,
                customer_email: user.email,
                amount_total: 0,
                currency: currency.toLowerCase(),
                payment_status: 'paid',
                metadata: {
                  orderId: order.id,
                  planId: planId,
                  userId: user.id,
                  userEmail: user.email,
                  needsPasswordSetup: isNewUser ? 'true' : 'false',
                  source: 'mobile',
                  afid: afid || '',
                  rfcd: rfcd || '',
                  discountApplied: 'true',
                  discountPercent: discountPercent.toString(),
                  discountSource: discountSource || '',
                  discountCodeId: discountCodeId || '',
                  discountCode: discountCode || '',
                  isTopUp: isTopUp ? 'true' : 'false',
                  existingOrderId: existingOrderId || '',
                  iccid: iccid || '',
                  basePriceUSD: basePriceUSD.toString(),
                  finalPriceUSD: '0',
                },
              },
            },
          }),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text().catch(() => 'Unknown error');
          console.error('[Mobile Checkout] Webhook returned error:', webhookResponse.status, errorText);
          // Roll back order status
          await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
          return NextResponse.json({ error: 'Failed to provision eSIM' }, { status: 500 });
        }
      } catch (webhookError) {
        console.error('[Mobile Checkout] Failed to trigger provisioning:', webhookError);
        // Roll back order status
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return NextResponse.json({ error: 'Failed to provision eSIM' }, { status: 500 });
      }

      // Discount code usage is recorded by the webhook handler

      console.log('[Mobile Checkout] Free order success! Returning orderId:', order.id);
      return NextResponse.json({
        orderId: order.id,
        freeOrder: true,
      });
    }

    // Create Payment Intent for mobile
    // Convert price from USD to user's currency
    const amount = convertToStripeAmount(finalPriceUSD, currency as Currency);

    // Route specific users (e.g. App Store / Play Store reviewers) through Stripe TEST mode
    const isTestUser = (user as any).is_test_user === true;
    const stripeMode: StripeMode = isTestUser ? 'test' : 'live';

    // Debug: Log test user detection
    console.log('[Mobile Checkout] Test user check:', {
      userId: user.id,
      email: user.email,
      is_test_user_raw: (user as any).is_test_user,
      is_test_user_type: typeof (user as any).is_test_user,
      isTestUser,
      stripeMode,
    });

    console.log('[Mobile Checkout] Creating Payment Intent...', {
      currency,
      amount,
      basePriceUSD,
      finalPriceUSD,
      discountPercent,
      discountSource,
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
        // Top-up metadata
        isTopUp: isTopUp ? 'true' : 'false',
        existingOrderId: existingOrderId || '',
        iccid: iccid || '',
        // Referral/attribution metadata
        afid: afid || '',
        rfcd: rfcd ? rfcd.toUpperCase().trim() : '',
        // Discount metadata
        discountCodeId: discountCodeId || '',
        discountSource: discountSource || '',
        discountPercent: discountPercent.toString(),
        basePriceUSD: basePriceUSD.toString(),
        finalPriceUSD: finalPriceUSD.toString(),
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
