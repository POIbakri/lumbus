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
      apiVersion: '2025-09-30.clover',
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
    console.log('[Checkout] Starting checkout session...');
    const body = await req.json();
    console.log('[Checkout] Request body:', { planId: body.planId, email: body.email, isTopUp: body.isTopUp });

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

      console.log('[Checkout] Looking for existing user:', email);
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 results

      console.log('[Checkout] Find user result:', { found: !!existingUser, error: findError?.message });

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
          // If user already exists in auth but not in users table, fetch them
          if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
            console.log('[Checkout] Auth user already exists, fetching by email...');

            // Get user by email from auth
            const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();

            if (listError) {
              console.error('[Checkout] Failed to list users:', listError);
              return NextResponse.json({
                error: 'Failed to fetch user',
                details: listError.message
              }, { status: 500 });
            }

            const authUser = authUsers?.find(u => u.email === email);

            if (!authUser) {
              console.error('[Checkout] Auth user exists but not found in list');
              return NextResponse.json({
                error: 'User state inconsistent'
              }, { status: 500 });
            }

            console.log('[Checkout] Found existing auth user:', authUser.id);

            // Now fetch from users table
            const { data: existingDbUser, error: dbError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .maybeSingle();

            if (existingDbUser) {
              // User exists in both auth and database
              console.log('[Checkout] User found in database');
              user = existingDbUser;
              isNewUser = false;

              // Ensure user profile exists
              console.log('[Checkout] Ensuring user profile...');
              await ensureUserProfile(user.id);
            } else {
              // User exists in auth but not in database - create database entry
              console.log('[Checkout] User in auth but not in database, creating database entry...');

              const { data: createdUser, error: createError } = await supabase
                .from('users')
                .insert({
                  id: authUser.id,
                  email: authUser.email || email,
                })
                .select()
                .single();

              if (createError || !createdUser) {
                console.error('[Checkout] Failed to create user in database:', createError);
                return NextResponse.json({
                  error: 'Failed to create user record',
                  details: createError?.message
                }, { status: 500 });
              }

              console.log('[Checkout] User database entry created');
              user = createdUser;
              isNewUser = true; // Treat as new user for password setup

              // Create user profile
              console.log('[Checkout] Creating user profile...');
              await ensureUserProfile(user.id);
            }

            // Skip the rest of new user creation
          } else {
            console.error('[Checkout] Auth user creation error:', authError);
            return NextResponse.json({
              error: 'Failed to create user account',
              details: authError?.message
            }, { status: 500 });
          }
        } else if (authData?.user) {
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
        }
      }
    }
    console.log('[Checkout] User ready:', user.id);

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
    console.log('[Checkout] Detecting currency...');
    const detectedCountry = detectCountryFromRequest(req.headers);
    const userCurrency = getCurrencyForCheckout(req.headers);

    // Calculate price with discount if applicable (in USD)
    const basePriceUSD = plan.retail_price;
    const finalPriceUSD = applyDiscount ? basePriceUSD * 0.9 : basePriceUSD; // 10% off

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

    // Create Stripe Checkout Session with user's local currency
    console.log('[Checkout] Creating Stripe session...');
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

    console.log('[Checkout] Calling Stripe API...');
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
