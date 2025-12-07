/**
 * User Referral API
 * GET /api/referrals/me - Get current user's referral info and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getUserReferralStats, ensureUserProfile } from '@/lib/referral';
import { requireUserAuth } from '@/lib/server-auth';

/**
 * GET /api/referrals/me
 * Get current user's referral code and statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Get or create user profile with referral code
    // This ensures users who signed up before profile creation was added still get a code
    let profile;
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !existingProfile) {
      // Profile doesn't exist - create one (handles legacy users and edge cases)
      try {
        profile = await ensureUserProfile(userId);
      } catch (createError) {
        console.error('Failed to create user profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    } else {
      profile = existingProfile;
    }

    // Get referral statistics
    const stats = await getUserReferralStats(userId);

    return NextResponse.json({
      user_id: userId,
      ref_code: profile.ref_code,
      referred_by_code: profile.referred_by_code,
      stats,
      referral_link: `${process.env.NEXT_PUBLIC_APP_URL}/r/${profile.ref_code}`,
    });
  } catch (error) {
    console.error('Get user referral info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
