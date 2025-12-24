/**
 * Data Wallet API
 * GET /api/rewards/wallet - Get user's data wallet balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';

/**
 * GET /api/rewards/wallet
 * Get user's data wallet balance and active eSIMs
 * Auto-applies any PENDING rewards using atomic DB function
 */
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Auto-apply any PENDING rewards using atomic DB function (prevents race conditions)
    const { data: pendingRewards } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('referrer_user_id', userId)
      .eq('status', 'PENDING');

    if (pendingRewards && pendingRewards.length > 0) {
      for (const reward of pendingRewards) {
        // Use atomic DB function with FOR UPDATE locking
        const { data: result } = await supabase.rpc('redeem_referral_reward', {
          p_reward_id: reward.id,
          p_user_id: userId,
        });

        if (result?.success) {
          console.log(`Auto-applied pending reward ${reward.id} for user ${userId}`);
        }
        // If not success, reward was already redeemed by concurrent request - that's fine
      }
    }

    // Get wallet balance (after any auto-applied rewards)
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const balanceMB = wallet?.balance_mb || 0;

    // Get active eSIMs (orders that can be topped up - not expired)
    const { data: activeEsims } = await supabase
      .from('orders')
      .select('id, plan_id, data_remaining_bytes, free_data_added_mb, created_at, expires_at, plans(name, region_code)')
      .eq('user_id', userId)
      .in('status', ['completed', 'active', 'depleted'])
      .order('created_at', { ascending: false });

    // Format active eSIMs data
    const formattedEsims = activeEsims?.map(esim => {
      const plan = Array.isArray(esim.plans) ? esim.plans[0] : esim.plans;
      return {
        id: esim.id,
        plan_name: plan?.name || 'Unknown Plan',
        data_remaining_bytes: esim.data_remaining_bytes || 0,
        free_data_added_mb: esim.free_data_added_mb || 0,
        created_at: esim.created_at,
        expires_at: esim.expires_at,
        region_code: plan?.region_code || null,
      };
    }).filter(esim => {
      // Only show eSIMs that are active (have data or not expired)
      const hasDataRemaining = esim.data_remaining_bytes > 0;
      const isNotExpired = !esim.expires_at || new Date(esim.expires_at) > new Date();
      return hasDataRemaining || isNotExpired;
    }) || [];

    return NextResponse.json({
      balance_mb: balanceMB,
      balance_gb: (balanceMB / 1024).toFixed(1),
      active_esims: formattedEsims,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
