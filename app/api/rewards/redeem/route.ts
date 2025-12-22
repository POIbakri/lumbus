/**
 * Reward Redemption API
 * POST /api/rewards/redeem - Redeem a pending reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { z } from 'zod';

const redeemSchema = z.object({
  rewardId: z.string().uuid(),
});

/**
 * POST /api/rewards/redeem
 * Redeem a pending referral reward and add data credits to user's wallet
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;

    const body = await req.json();
    const { rewardId } = redeemSchema.parse(body);

    // Use atomic RPC function to redeem reward
    // This handles everything in a single transaction:
    // 1. Validates and locks the reward
    // 2. Marks it as APPLIED
    // 3. Atomically updates wallet balance
    // 4. Logs the transaction
    const { data: result, error: rpcError } = await supabase
      .rpc('redeem_referral_reward', {
        p_reward_id: rewardId,
        p_user_id: userId,
      });

    if (rpcError) {
      console.error('Failed to redeem reward:', rpcError);
      return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${result.credits_added}MB added to your data wallet`,
      credits_added: result.credits_added,
      new_balance: result.new_balance,
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
