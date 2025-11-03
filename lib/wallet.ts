/**
 * Data Wallet Management System
 * Handles data credit operations for referral rewards
 */

import { supabase } from './db';

/**
 * Get available free data for a user
 * @param userId - User ID
 * @returns Available data in MB
 */
export async function getAvailableData(
  userId: string
): Promise<number> {
  // Get user's wallet balance
  const { data: wallet } = await supabase
    .from('user_data_wallet')
    .select('balance_mb')
    .eq('user_id', userId)
    .maybeSingle();

  return wallet?.balance_mb || 0;
}

/**
 * Add free data to user's balance
 * @param userId - User ID
 * @param dataMB - Amount of data to add in MB
 * @param source - Source of the data (e.g., 'referral_reward', 'promo')
 */
export async function addFreeData(
  userId: string,
  dataMB: number,
  source: string = 'referral_reward'
): Promise<boolean> {
  try {
    // Get current wallet balance
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('balance_mb')
      .eq('user_id', userId)
      .maybeSingle();

    if (wallet) {
      // Update existing wallet
      const newBalance = wallet.balance_mb + dataMB;
      await supabase
        .from('user_data_wallet')
        .update({
          balance_mb: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new wallet
      await supabase
        .from('user_data_wallet')
        .insert({
          user_id: userId,
          balance_mb: dataMB
        });
    }

    console.log(`Added ${dataMB}MB (${(dataMB / 1024).toFixed(1)}GB) to user ${userId}'s data balance`);
    return true;
  } catch (error) {
    console.error('Failed to add free data:', error);
    return false;
  }
}

/**
 * Get user's current wallet balance
 * @param userId - User ID
 */
export async function getWalletBalance(userId: string): Promise<number> {
  const { data: wallet } = await supabase
    .from('user_data_wallet')
    .select('balance_mb')
    .eq('user_id', userId)
    .maybeSingle();

  return wallet?.balance_mb || 0;
}

/**
 * Check if user has any pending rewards to claim
 * @param userId - User ID
 */
export async function hasPendingRewards(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', userId)
    .eq('status', 'PENDING');

  return (count || 0) > 0;
}