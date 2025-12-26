import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'all', 'pending', 'applied', 'void'

    let query = supabase
      .from('referral_rewards')
      .select(`
        id,
        order_id,
        referrer_user_id,
        referred_user_id,
        reward_type,
        reward_value,
        status,
        created_at,
        applied_at,
        voided_at,
        notes
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: rewards, error } = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json({ error: 'Failed to load rewards' }, { status: 500 });
    }

    // Get unique user IDs to fetch emails
    const userIds = new Set<string>();
    rewards?.forEach((r: any) => {
      if (r.referrer_user_id) userIds.add(r.referrer_user_id);
      if (r.referred_user_id) userIds.add(r.referred_user_id);
    });

    // Fetch user emails
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', Array.from(userIds));

    const userMap = new Map(users?.map((u: any) => [u.id, u.email]) || []);

    const formattedRewards = rewards?.map((reward: any) => ({
      id: reward.id,
      order_id: reward.order_id,
      referrer_user_id: reward.referrer_user_id,
      referrer_email: userMap.get(reward.referrer_user_id) || 'N/A',
      referred_user_id: reward.referred_user_id,
      referred_email: userMap.get(reward.referred_user_id) || 'N/A',
      reward_type: reward.reward_type,
      reward_value_mb: reward.reward_value,
      reward_value_gb: (reward.reward_value / 1024).toFixed(2),
      status: reward.status,
      created_at: reward.created_at,
      applied_at: reward.applied_at,
      voided_at: reward.voided_at,
      notes: reward.notes,
    }));

    // Calculate stats
    const stats = {
      total: rewards?.length || 0,
      pending: rewards?.filter((r: any) => r.status === 'PENDING').length || 0,
      applied: rewards?.filter((r: any) => r.status === 'APPLIED').length || 0,
      voided: rewards?.filter((r: any) => r.status === 'VOID').length || 0,
      total_mb_rewarded: rewards?.filter((r: any) => r.status === 'APPLIED').reduce((sum: number, r: any) => sum + r.reward_value, 0) || 0,
    };

    return NextResponse.json({ rewards: formattedRewards || [], stats });
  } catch (error) {
    console.error('Admin rewards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
