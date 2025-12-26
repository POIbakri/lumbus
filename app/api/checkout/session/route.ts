import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { ensureUserProfile } from '@/lib/referral';
import { getCurrencyForCheckout, convertToStripeAmount, formatPrice, detectCountryFromRequest } from '@/lib/currency';
import { logger, redactEmail } from '@/lib/logger';
import { z } from 'zod';
import { generateOrderAccessToken } from '@/lib/order-token';
import { getSystemConfig } from '@/lib/commission';

// Lazy initialization - separate Stripe clients for live vs test mode
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

/**
 * Get or create a Stripe customer for the user.
 * Uses separate customer IDs for live vs test mode.
 */
async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  mode: StripeMode
): Promise<string> {
  // Check if user already has a Stripe customer ID for this mode
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_customer_id_test')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('[Checkout] Failed to fetch user for Stripe customer:', fetchError);
    throw new Error('Failed to fetch user data');
  }

  // Get the appropriate customer ID based on mode
  const existingCustomerId = mode === 'test'
    ? userData?.stripe_customer_id_test
    : userData?.stripe_customer_id;

  if (existingCustomerId) {
    // Verify the customer still exists in Stripe (handles edge case of deleted customers)
    try {
      const stripe = getStripeClient(mode);
      const customer = await stripe.customers.retrieve(existingCustomerId);

      // Check if customer was deleted
      if ((customer as any).deleted) {
        console.log(`[Checkout] Stripe customer ${existingCustomerId} was deleted, creating new one`);
      } else {
        console.log(`[Checkout] Using existing Stripe customer: ${existingCustomerId}`);
        return existingCustomerId;
      }
    } catch (stripeError: any) {
      // Customer doesn't exist, will create a new one
      console.log(`[Checkout] Stripe customer ${existingCustomerId} not found, creating new one`);
    }
  }

  // Create new Stripe customer
  console.log(`[Checkout] Creating new Stripe customer for user ${userId} (${mode} mode)`);
  const stripe = getStripeClient(mode);
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId,
      mode: mode,
    },
  });

  // Save the customer ID to the database
  const updateData = mode === 'test'
    ? { stripe_customer_id_test: customer.id }
    : { stripe_customer_id: customer.id };

  const { error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (updateError) {
    // Log but don't fail - the checkout can still proceed
    console.error('[Checkout] Failed to save Stripe customer ID:', updateError);
  }

  console.log(`[Checkout] Created Stripe customer: ${customer.id}`);
  return customer.id;
}

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  email: z.string().email().optional(),
  isTopUp: z.boolean().optional(),
  existingOrderId: z.string().uuid().optional(),
  iccid: z.string().optional(),
  discountCode: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    logger.info('[Checkout] Starting checkout session...');
    const body = await req.json();
    logger.info('[Checkout] Request body:', { planId: body.planId, email: body.email, isTopUp: body.isTopUp });

    const { planId, email, isTopUp, existingOrderId, iccid, discountCode, referralCode } = checkoutSchema.parse(body);

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
    console.log('[Checkout] Fetching plan:', planId);
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[Checkout] Plan not found:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    console.log('[Checkout] Plan found:', plan.name);

    // Get or create user (for top-ups, get from existing order)
    console.log('[Checkout] Getting/creating user...');
    let user;
    let isNewUser = false; // Track if this is a brand new user for password setup
    if (isTopUp && existingOrderId) {
      // For top-ups, get user from existing order
      console.log('[Checkout] Top-up flow - getting user from order');
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('user_id, users(*), iccid')
        .eq('id', existingOrderId)
        .single();

      if (!existingOrder) {
        return NextResponse.json({ error: 'Existing order not found' }, { status: 404 });
      }

      // Get the ORIGINAL order by ICCID to check is_reloadable (prevents bypass via top-up order ID)
      const targetIccid = iccid || existingOrder.iccid;
      if (!targetIccid) {
        return NextResponse.json({ error: 'No ICCID found for top-up' }, { status: 400 });
      }

      const { data: originalOrder } = await supabase
        .from('orders')
        .select('plans(is_reloadable)')
        .eq('iccid', targetIccid)
        .eq('is_topup', false)
        .limit(1)
        .maybeSingle();

      // Check if original plan supports top-ups
      const originalPlan = Array.isArray(originalOrder?.plans) ? originalOrder.plans[0] : originalOrder?.plans;
      if ((originalPlan as any)?.is_reloadable === false) {
        return NextResponse.json(
          { error: 'This plan does not support top-ups. Please purchase a new plan instead.' },
          { status: 400 }
        );
      }

      user = Array.isArray(existingOrder.users) ? existingOrder.users[0] : existingOrder.users;
    } else {
      // Regular flow: Get or create user by email
      if (!email) {
        return NextResponse.json({ error: 'Email is required for new orders' }, { status: 400 });
      }

      logger.info('[Checkout] Looking for existing user:', { email });
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim()) // Normalize email
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 results

      logger.info('[Checkout] Find user result:', {
        email: email,
        found: !!existingUser,
        userId: existingUser?.id,
        error: findError?.message
      });

      if (existingUser) {
        console.log('[Checkout] Using existing user:', existingUser.id);
        user = existingUser;
        isNewUser = false;

        // Ensure user profile exists (creates ref_code if existing user without profile)
        console.log('[Checkout] Ensuring user profile...');
        await ensureUserProfile(user.id);

        // Existing users cannot use referral codes
        // Clear any referral cookie if this is an existing user
        if (rfcd) {
          console.log('[Checkout] Existing user detected - referral codes not allowed');
        }
      } else {

        // For new users, create auth account WITHOUT password (passwordless)
        // They'll set password later via "setup account" email after payment
        console.log('[Checkout] Creating new user (no password yet)...');
        isNewUser = true;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: false, // They'll verify via password reset link after payment
          user_metadata: {
            created_via: 'checkout',
            needs_password_setup: true
          }
        });

        if (authError) {
          // Generic error to prevent user enumeration
          logger.error('[Checkout] Auth user creation error', authError);
          return NextResponse.json({
            error: 'Unable to process checkout. Please try again or contact support.',
          }, { status: 400 });
        }

        if (!authData?.user) {
          console.error('[Checkout] Auth user creation failed - no user data returned');
          return NextResponse.json({
            error: 'Failed to create user account - no user data',
          }, { status: 500 });
        }

        console.log('[Checkout] Passwordless user created:', authData.user.id);

        // Fetch the user from users table (created by trigger)
        // Wait a moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: newUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (fetchError || !newUser) {
          console.error('[Checkout] Failed to fetch new user:', fetchError);
          return NextResponse.json({
            error: 'User account created but failed to fetch',
            details: fetchError?.message
          }, { status: 500 });
        }

        user = newUser;

        // Create user profile
        console.log('[Checkout] Creating user profile...');
        await ensureUserProfile(user.id);

        // Link referral code if provided in body OR from cookie
        const referralToLink = referralCode || rfcd;
        if (referralToLink) {
          console.log('[Checkout] Linking referral code:', referralToLink);
          const { linkReferrer } = await import('@/lib/referral');
          const linked = await linkReferrer(user.id, referralToLink);
          if (linked) {
            console.log('[Checkout] Referral code linked successfully');
          } else {
            console.log('[Checkout] Invalid or already used referral code');
          }
        }
      }
    }
    console.log('[Checkout] User ready:', user.id);

    // Load referral configuration (discount %, monthly caps, etc.)
    const systemConfig = await getSystemConfig();
    const cfgReferralDiscount = systemConfig.REFERRAL_FRIEND_DISCOUNT_PCT as unknown;
    const referralDiscountPercent =
      typeof cfgReferralDiscount === 'number'
        ? cfgReferralDiscount
        : Number(cfgReferralDiscount as string) || 10;

    // Discount logic: Priority 1 = Promo code, Priority 2 = Referral
    // Top-ups never get discounts
    let applyDiscount = false;
    let discountPercent = 0;
    let discountCodeId: string | null = null;
    let discountSource: 'code' | 'referral' | null = null;

    if (!isTopUp) {
      // Priority 1: Check for discount code
      if (discountCode) {
        const { data: validationResult } = await supabase
          .rpc('validate_discount_code', {
            p_code: discountCode.toUpperCase().trim(),
            p_user_id: user.id,
          });

        const result = Array.isArray(validationResult) ? validationResult[0] : validationResult;

        if (result && result.is_valid) {
          applyDiscount = true;
          discountPercent = result.discount_percent;
          discountSource = 'code';

          // Get the discount code ID for tracking
          const { data: codeData } = await supabase
            .from('discount_codes')
            .select('id')
            .eq('code', discountCode.toUpperCase().trim())
            .maybeSingle();

          if (codeData) {
            discountCodeId = codeData.id;
          }
        }
      }

      // Priority 2: Check for referral discount (only for first-time users with referral codes)
      // Referrals give BOTH: 10% discount + 1GB free data rewards for both users
      // BUT: If a discount code is used, it overrides referral benefits entirely
      if (!applyDiscount && !isTopUp) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('referred_by_code')
          .eq('id', user.id)
          .maybeSingle();

        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['paid', 'completed', 'provisioning']);

        const isFirstOrder = (orderCount || 0) === 0;
        const hasReferral = userProfile?.referred_by_code !== null && userProfile?.referred_by_code !== undefined;

        // Only new users (first order) can use referral discounts
        if (isFirstOrder && hasReferral) {
          applyDiscount = true;
          discountPercent = referralDiscountPercent;
          discountSource = 'referral';
        }
      }
    }

    // Detect user's currency based on their location
    console.log('[Checkout] Detecting currency...');
    const detectedCountry = detectCountryFromRequest(req.headers);
    const userCurrency = getCurrencyForCheckout(req.headers);

    // Calculate price with discount if applicable (in USD)
    const basePriceUSD = plan.retail_price;
    const discountMultiplier = applyDiscount ? (100 - discountPercent) / 100 : 1;
    const finalPriceUSD = basePriceUSD * discountMultiplier;

    // Convert to user's currency for Stripe
    const stripeAmount = convertToStripeAmount(finalPriceUSD, userCurrency);

    console.log(`[Checkout] Pricing: Country=${detectedCountry}, Currency=${userCurrency}, USD=${finalPriceUSD}, Converted=${stripeAmount}`);

    // Create pending order
    console.log('[Checkout] Creating order in database...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        is_topup: isTopUp || false,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Checkout] Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    console.log('[Checkout] Order created:', order.id);

    // Handle 100% discount - bypass Stripe entirely
    if (finalPriceUSD === 0) {
      console.log('[Checkout] Free order detected (100% discount) - bypassing Stripe');

      // Mark order as paid with $0
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          amount_cents: 0,
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('[Checkout] Failed to update order:', updateError);
        console.error('[Checkout] Update error details:', JSON.stringify(updateError));
        return NextResponse.json({ error: 'Failed to process free order' }, { status: 500 });
      }

      // Trigger eSIM provisioning
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`;
      const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;

      if (!internalSecret) {
        console.error('[Checkout] INTERNAL_WEBHOOK_SECRET is not configured');
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      console.log('[Checkout] Triggering eSIM provisioning for free order');

      // Call webhook handler directly (simulating successful payment)
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
                currency: userCurrency.toLowerCase(),
                payment_status: 'paid',
                metadata: {
                  orderId: order.id,
                  planId: planId,
                  userId: user.id,
                  userEmail: user.email,
                  needsPasswordSetup: isNewUser ? 'true' : 'false',
                  afid: afid || '',
                  rfcd: rfcd || '',
                  sessionId: sid || '',
                  ipAddress: ipAddress || '',
                  userAgent: userAgent || '',
                  discountApplied: 'true',
                  discountPercent: '100',
                  discountSource: discountSource || '',
                  discountCodeId: discountCodeId || '',
                  discountCode: discountCode || '',
                  isTopUp: isTopUp ? 'true' : 'false',
                  existingOrderId: existingOrderId || '',
                  iccid: iccid || '',
                  detectedCountry: detectedCountry,
                  currency: userCurrency,
                  basePriceUSD: basePriceUSD.toString(),
                  finalPriceUSD: '0',
                },
              },
            },
          }),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text().catch(() => 'Unknown error');
          console.error('[Checkout] Webhook returned error:', webhookResponse.status, errorText);
          await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
          return NextResponse.json({ error: 'Failed to provision eSIM' }, { status: 500 });
        }
      } catch (webhookError) {
        console.error('[Checkout] Failed to trigger provisioning:', webhookError);
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return NextResponse.json({ error: 'Failed to provision eSIM' }, { status: 500 });
      }

      // Discount code usage is recorded by the webhook handler

      // Generate secure token for order access
      const accessToken = generateOrderAccessToken(order.id, user.id);

      // Return success URL directly (no Stripe session)
      const successUrl = isTopUp
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup=success&order=${order.id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}?token=${accessToken}`;

      console.log('[Checkout] Free order success! Redirecting to:', successUrl);
      return NextResponse.json({
        sessionId: 'free_' + order.id,
        url: successUrl,
        isFree: true,
      });
    }

    // Create Stripe Checkout Session with user's local currency
    console.log('[Checkout] Creating Stripe session...');
    const stripeMode: StripeMode = (user as any).is_test_user ? 'test' : 'live';
    const orderType = isTopUp ? 'Top-up' : 'New eSIM';

    // Get or create Stripe customer for this user
    // Falls back to customer_email if customer creation fails (defensive)
    let stripeCustomerId: string | null = null;
    try {
      stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email, stripeMode);
    } catch (customerError) {
      console.error('[Checkout] Failed to get/create Stripe customer, falling back to customer_email:', customerError);
    }

    // Build discount description
    let discountDescription = '';
    if (applyDiscount) {
      if (discountSource === 'code') {
        discountDescription = ` (${discountPercent}% Discount Code Applied)`;
      } else if (discountSource === 'referral') {
        discountDescription = ` (${discountPercent}% Referral Discount Applied)`;
      }
    }

    const lineItems = [
      {
        price_data: {
          currency: userCurrency.toLowerCase(),
          product_data: {
            name: isTopUp ? `${plan.name} (Top-up)` : plan.name,
            description: `${orderType}: ${plan.data_gb}GB eSIM - Valid for ${plan.validity_days} days${discountDescription}`,
          },
          unit_amount: stripeAmount, // Already converted to smallest currency unit
        },
        quantity: 1,
      },
    ];

    // Generate secure token for order access (for new users who aren't logged in yet)
    const accessToken = generateOrderAccessToken(order.id, user.id);

    const successUrl = isTopUp
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup=success&order=${order.id}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}?session_id={CHECKOUT_SESSION_ID}&token=${accessToken}`;

    console.log('[Checkout] Calling Stripe API...', {
      currency: userCurrency.toLowerCase(),
      amount: stripeAmount,
      stripeCustomerId: stripeCustomerId || '(using email fallback)',
      planName: plan.name,
      stripeMode,
      userId: user.id,
    });

    // Build customer options - prefer customer ID, fall back to email
    const customerOptions: { customer: string } | { customer_email: string } = stripeCustomerId
      ? { customer: stripeCustomerId }
      : { customer_email: user.email };

    const session = await getStripeClient(stripeMode).checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: isTopUp
        ? `${process.env.NEXT_PUBLIC_APP_URL}/topup/${existingOrderId}?canceled=true`
        : `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
      ...customerOptions,
      metadata: {
        orderId: order.id,
        planId: planId,
        userId: user.id,
        userEmail: email || user.email,
        needsPasswordSetup: isNewUser ? 'true' : 'false', // New users need to set password
        source: 'web', // Track payment source (web vs mobile)
        afid: afid || '',
        rfcd: rfcd || '',
        sessionId: sid || '',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        discountApplied: applyDiscount ? 'true' : 'false',
        discountPercent: discountPercent.toString(),
        discountSource: discountSource || '',
        discountCodeId: discountCodeId || '',
        discountCode: discountCode || '',
        isTopUp: isTopUp ? 'true' : 'false',
        existingOrderId: existingOrderId || '',
        iccid: iccid || '',
        detectedCountry: detectedCountry,
        currency: userCurrency,
        basePriceUSD: basePriceUSD.toString(),
        finalPriceUSD: finalPriceUSD.toString(),
        stripeMode,
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

    console.log('[Checkout] Stripe session created:', session.id);

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    console.log('[Checkout] Success! Redirecting to:', session.url);
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
