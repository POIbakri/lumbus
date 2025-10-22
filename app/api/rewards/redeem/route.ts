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

    // Get the reward
    const { data: reward, error: rewardError } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('referrer_user_id', userId)
      .eq('status', 'PENDING')
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found or already redeemed' }, { status: 404 });
    }

    // Mark reward as APPLIED
    const { error: updateError } = await supabase
      .from('referral_rewards')
      .update({
        status: 'APPLIED',
        applied_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    if (updateError) {
      console.error('Failed to update reward:', updateError);
      return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
    }

    // Add data credits to user's wallet
    const dataCreditsMB = reward.reward_value; // 1024 MB = 1 GB

    // Check if wallet entry exists
    const { data: existingWallet } = await supabase
      .from('user_data_wallet')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingWallet) {
      // Update existing wallet
      await supabase
        .from('user_data_wallet')
        .update({
          balance_mb: existingWallet.balance_mb + dataCreditsMB,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Create new wallet entry
      await supabase
        .from('user_data_wallet')
        .insert({
          user_id: userId,
          balance_mb: dataCreditsMB,
        });
    }

    // Log the transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'CREDIT',
        amount_mb: dataCreditsMB,
        source: 'REFERRAL_REWARD',
        source_id: rewardId,
        description: `Referral reward: ${dataCreditsMB}MB free data`,
      });

    return NextResponse.json({
      success: true,
      message: `${dataCreditsMB}MB added to your data wallet`,
      credits_added: dataCreditsMB,
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
