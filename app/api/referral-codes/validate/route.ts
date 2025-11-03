import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { z } from 'zod';

const validateSchema = z.object({
  code: z.string().min(8).max(8).regex(/^[A-Z0-9]+$/),
  userId: z.string().uuid().optional(), // Optional since guest users might not have ID yet
  email: z.string().email().optional(), // Optional email for checking existing orders
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, email } = validateSchema.parse(body);

    // Step 1: Check if referral code exists and is valid
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, email, referral_code')
      .eq('referral_code', code.toUpperCase().trim())
      .maybeSingle();

    if (referrerError || !referrer) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid referral code. Please check and try again.',
      });
    }

    // Step 2: Check if user is eligible (first-time buyer)
    // If we have a userId, check their order history
    if (userId) {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['paid', 'completed', 'provisioning']);

      if ((orderCount || 0) > 0) {
        return NextResponse.json({
          valid: false,
          error: 'Referral codes are only valid for first-time buyers. You already have an order.',
        });
      }
    }

    // Step 3: If we have an email, check if this email has any orders
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', existingUser.id)
          .in('status', ['paid', 'completed', 'provisioning']);

        if ((orderCount || 0) > 0) {
          return NextResponse.json({
            valid: false,
            error: 'This email has already been used for a purchase. Referral codes are only for new customers.',
          });
        }
      }
    }

    // Step 4: Check if user is trying to use their own code
    if (userId && referrer.id === userId) {
      return NextResponse.json({
        valid: false,
        error: 'You cannot use your own referral code.',
      });
    }

    // Step 5: Check if email matches referrer's email
    if (email && referrer.email === email.toLowerCase()) {
      return NextResponse.json({
        valid: false,
        error: 'You cannot use your own referral code.',
      });
    }

    // Step 6: Check monthly cap for the referrer
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0, 0, 0, 0
    ));

    const { count: monthlyRewards } = await supabase
      .from('referral_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_user_id', referrer.id)
      .gte('created_at', startOfMonth.toISOString())
      .in('status', ['PENDING', 'APPLIED']); // Count both pending and applied rewards

    const MONTHLY_CAP = 10;
    if ((monthlyRewards || 0) >= MONTHLY_CAP) {
      return NextResponse.json({
        valid: false,
        error: 'This referral code has reached its monthly usage limit. Try again next month!',
      });
    }

    // Success! Code is valid and user is eligible
    return NextResponse.json({
      valid: true,
      referrerId: referrer.id,
      benefits: {
        discount: 10, // 10% off
        freeDataMB: 1024, // 1GB free data
        message: 'You\'ll get 10% OFF your purchase + 1GB FREE data! Your friend gets 1GB FREE too!',
      },
    });
  } catch (error) {
    console.error('Error in referral code validation:', error);
    if (error instanceof z.ZodError) {
      // More user-friendly error messages for validation errors
      const fieldErrors = error.issues.map(issue => {
        if (issue.path[0] === 'code') {
          return 'Referral codes must be exactly 8 characters (letters and numbers only).';
        }
        if (issue.path[0] === 'email' && issue.code === 'invalid_type') {
          return 'Please provide a valid email address.';
        }
        return issue.message;
      }).join(' ');

      return NextResponse.json({
        valid: false,
        error: fieldErrors,
      });
    }
    return NextResponse.json(
      { valid: false, error: 'Failed to validate referral code. Please try again.' },
      { status: 500 }
    );
  }
}