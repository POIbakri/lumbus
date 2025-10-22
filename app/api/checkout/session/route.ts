import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/db';
import { ensureUserProfile } from '@/lib/referral';
import { getCurrencyForCheckout, convertToStripeAmount, formatPrice, detectCountryFromRequest } from '@/lib/currency';
import { logger, redactEmail } from '@/lib/logger';
import { z } from 'zod';
import { generateOrderAccessToken } from '@/lib/order-token';

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

        // Link referral code if provided
        if (referralCode) {
          console.log('[Checkout] Linking referral code:', referralCode);
          const { linkReferrer } = await import('@/lib/referral');
          const linked = await linkReferrer(user.id, referralCode);
          if (linked) {
            console.log('[Checkout] Referral code linked successfully');
          } else {
            console.log('[Checkout] Invalid or already used referral code');
          }
        }
      }
    }
    console.log('[Checkout] User ready:', user.id);

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

      // Priority 2: Check for referral discount (only if no discount code)
      if (!applyDiscount) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('referred_by_code')
          .eq('id', user.id)
          .maybeSingle();

        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['paid', 'completed']);

        const isFirstOrder = (orderCount || 0) === 0;
        const hasReferral = userProfile?.referred_by_code !== null && userProfile?.referred_by_code !== undefined;

        if (isFirstOrder && hasReferral) {
          applyDiscount = true;
          discountPercent = 10;
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
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Checkout] Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    console.log('[Checkout] Order created:', order.id);

    // Handle 100% discount - bypass Stripe entirely
    if (finalPriceUSD === 0 && applyDiscount && discountPercent === 100) {
      console.log('[Checkout] 100% discount detected - bypassing Stripe');

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

      // Record discount code usage
      if (discountCodeId && discountSource === 'code') {
        console.log('[Checkout] Recording 100% discount code usage');
        const { error: usageError } = await supabase
          .from('discount_code_usage')
          .insert({
            discount_code_id: discountCodeId,
            order_id: order.id,
            user_id: user.id,
            discount_percent: 100,
            original_price_usd: basePriceUSD,
            discount_amount_usd: basePriceUSD,
            final_price_usd: 0,
          });

        if (usageError) {
          console.error('[Checkout] Failed to record discount usage:', usageError);
        }
      }

      // Trigger eSIM provisioning
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`;
      console.log('[Checkout] Triggering eSIM provisioning for free order');

      // Call webhook handler directly (simulating successful payment)
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_WEBHOOK_SECRET || '', // Secure internal call
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
      } catch (webhookError) {
        console.error('[Checkout] Failed to trigger provisioning:', webhookError);
      }

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
    const orderType = isTopUp ? 'Top-up' : 'New eSIM';

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

    console.log('[Checkout] Calling Stripe API...');
    console.log('[Checkout] Stripe params:', {
      currency: userCurrency.toLowerCase(),
      amount: stripeAmount,
      customerEmail: user.email,
      planName: plan.name,
    });

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
        userEmail: email || user.email,
        needsPasswordSetup: isNewUser ? 'true' : 'false', // New users need to set password
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
