import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { ensureUserProfile } from '@/lib/referral';

const iapCheckoutSchema = z.object({
  planId: z.string().uuid(),
  email: z.string().email(),
  currency: z.string().optional().default('USD'), // For record keeping
  amount: z.number().optional(), // USD price for record keeping
  isTopUp: z.boolean().optional(),
  existingOrderId: z.string().uuid().optional(),
  iccid: z.string().optional(),
  referralCode: z.string().optional(),
});

/**
 * Apple IAP Checkout API
 *
 * This endpoint creates a pending order for iOS in-app purchases.
 * Unlike Stripe, we don't create a payment intent here - Apple handles payment.
 * We just create the order and return a product ID for StoreKit.
 *
 * Flow:
 * 1. Mobile app calls this endpoint
 * 2. We create a pending order in Supabase
 * 3. We return Apple product ID (e.g., com.lumbus.esim.usa_1gb)
 * 4. App initiates purchase with Apple
 * 5. Apple charges user in their local currency
 * 6. App receives receipt
 * 7. App calls POST /api/iap/validate-receipt
 * 8. We validate with Apple, provision eSIM
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[IAP Checkout] Starting iOS in-app purchase checkout...');
    const body = await req.json();
    console.log('[IAP Checkout] Request body:', { planId: body.planId, email: body.email });

    const { planId, email, currency, amount, isTopUp, existingOrderId, iccid, referralCode } = iapCheckoutSchema.parse(body);

    // Get plan details
    console.log('[IAP Checkout] Fetching plan:', planId);
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[IAP Checkout] Plan not found:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    console.log('[IAP Checkout] Plan found:', plan.name);

    // Get or create user (for top-ups, get from existing order)
    console.log('[IAP Checkout] Getting/creating user...');
    let user;
    let isNewUser = false;

    if (isTopUp && existingOrderId) {
      // For top-ups, get user from existing order
      console.log('[IAP Checkout] Top-up flow - getting user from order');
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

      logger.info('[IAP Checkout] Looking for existing user:', { email });
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        console.log('[IAP Checkout] Using existing user:', existingUser.id);
        user = existingUser;
        isNewUser = false;

        // Ensure user profile exists
        console.log('[IAP Checkout] Ensuring user profile...');
        await ensureUserProfile(user.id);
      } else {
        // Create new user without password (passwordless)
        console.log('[IAP Checkout] Creating new user (no password yet)...');
        isNewUser = true;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: false,
          user_metadata: {
            created_via: 'ios_iap',
            needs_password_setup: true
          }
        });

        if (authError) {
          logger.error('[IAP Checkout] Auth user creation error', authError);
          return NextResponse.json({
            error: 'Unable to process checkout. Please try again or contact support.',
          }, { status: 400 });
        }

        if (!authData?.user) {
          console.error('[IAP Checkout] Auth user creation failed - no user data returned');
          return NextResponse.json({
            error: 'Failed to create user account - no user data',
          }, { status: 500 });
        }

        console.log('[IAP Checkout] Passwordless user created:', authData.user.id);

        // Wait for trigger to create user in users table
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: newUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (fetchError || !newUser) {
          console.error('[IAP Checkout] Failed to fetch new user:', fetchError);
          return NextResponse.json({
            error: 'User account created but failed to fetch',
            details: fetchError?.message
          }, { status: 500 });
        }

        user = newUser;

        // Create user profile
        console.log('[IAP Checkout] Creating user profile...');
        await ensureUserProfile(user.id);

        // Link referral code if provided
        if (referralCode) {
          console.log('[IAP Checkout] Linking referral code:', referralCode);
          const { linkReferrer } = await import('@/lib/referral');
          const linked = await linkReferrer(user.id, referralCode);
          if (linked) {
            console.log('[IAP Checkout] Referral code linked successfully');
          } else {
            console.log('[IAP Checkout] Invalid or already used referral code');
          }
        }
      }
    }
    console.log('[IAP Checkout] User ready:', user.id);

    // Create pending order
    console.log('[IAP Checkout] Creating order in database...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        currency: currency, // User's detected currency (for record keeping)
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[IAP Checkout] Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    console.log('[IAP Checkout] Order created:', order.id);

    // Generate Apple product ID
    // Format: com.lumbus.esim.{region_code}_{data_gb}gb
    // Example: com.lumbus.esim.usa_1gb, com.lumbus.esim.europe_10gb
    const regionCode = plan.region_code.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dataAmount = Math.floor(plan.data_gb);
    const productId = `com.lumbus.esim.${regionCode}_${dataAmount}gb`;

    console.log('[IAP Checkout] Generated product ID:', productId);

    // Store product ID in order metadata for tracking
    await supabase
      .from('orders')
      .update({
        // We'll use stripe_session_id field to store Apple transaction ID later
        // (it's just a string field, doesn't matter that it says "stripe")
      })
      .eq('id', order.id);

    console.log('[IAP Checkout] Success! Returning product ID');
    return NextResponse.json({
      orderId: order.id,
      productId: productId,
      planName: plan.name,
      dataGB: plan.data_gb,
      validityDays: plan.validity_days,
      retailPriceUSD: plan.retail_price, // Apple will convert based on their pricing tiers
      isNewUser: isNewUser,
    });
  } catch (error) {
    console.error('[IAP Checkout] Error:', error);
    console.error('[IAP Checkout] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
