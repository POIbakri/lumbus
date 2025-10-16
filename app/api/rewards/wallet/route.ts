/**
 * Data Wallet API
 * GET /api/rewards/wallet - Get user's data wallet balance and pending rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';

/**
 * GET /api/rewards/wallet
 * Get user's data wallet balance and pending rewards
 */
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Get wallet balance
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('*')
      .eq('user_id', userId)
      .single();

    const balanceMB = wallet?.balance_mb || 0;

    // Get pending rewards
    const { data: pendingRewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_user_id', userId)
      .eq('status', 'PENDING');

    // Get applied rewards
    const { data: appliedRewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_user_id', userId)
      .eq('status', 'APPLIED');

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      balance_mb: balanceMB,
      balance_gb: (balanceMB / 1024).toFixed(2),
      pending_rewards: pendingRewards || [],
      applied_rewards: appliedRewards || [],
      recent_transactions: transactions || [],
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
