/**
 * Commission & Reward Calculation
 */

import { supabase } from './db';
import type {
  Order,
  Affiliate,
  AffiliateCommission,
  ReferralReward,
  OrderAttribution,
} from './db';

// =====================================================
// COMMISSION CALCULATION
// =====================================================

export interface CommissionConfig {
  MIN_COMMISSION_CENTS: number;
  COMMISSION_LOCK_DAYS: number;
}

const DEFAULT_CONFIG: CommissionConfig = {
  MIN_COMMISSION_CENTS: 50, // $0.50 minimum
  COMMISSION_LOCK_DAYS: 14, // 14-day refund window
};

/**
 * Calculate commission amount for an order
 */
export function calculateCommissionAmount(
  order: Order,
  affiliate: Affiliate,
  config: CommissionConfig = DEFAULT_CONFIG
): number {
  const netAmount = order.amount_cents || 0;

  let commissionCents = 0;

  if (affiliate.commission_type === 'PERCENT') {
    commissionCents = Math.round((netAmount * affiliate.commission_value) / 100);
    // Apply minimum only to percentage commissions to prevent micro-commissions
    return Math.max(commissionCents, config.MIN_COMMISSION_CENTS);
  } else {
    // FIXED - return as-is, no minimum
    // Fixed commissions are already set at a specific amount chosen by admin
    commissionCents = Math.round(affiliate.commission_value * 100);
    return commissionCents;
  }
}

/**
 * Create a commission record for an order
 */
export async function createCommission(
  orderId: string,
  affiliateId: string,
  amountCents: number
): Promise<AffiliateCommission | null> {
  // Check if commission already exists (idempotency)
  const { data: existing } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing) {
    return existing as AffiliateCommission;
  }

  // Create new commission
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .insert({
      order_id: orderId,
      affiliate_id: affiliateId,
      amount_cents: amountCents,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create commission:', error);
    return null;
  }

  return data as AffiliateCommission;
}

/**
 * Approve pending commissions after lock period
 */
export async function approvePendingCommissions(
  lockDays = DEFAULT_CONFIG.COMMISSION_LOCK_DAYS
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lockDays);

  // Find orders that are past lock period and still have PENDING commissions
  const { data: orders } = await supabase
    .from('orders')
    .select('id, paid_at')
    .eq('status', 'paid')
    .lte('paid_at', cutoffDate.toISOString());

  if (!orders || orders.length === 0) {
    return 0;
  }

  const orderIds = orders.map(o => o.id);

  // Update commissions to APPROVED
  const { error } = await supabase
    .from('affiliate_commissions')
    .update({
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
    })
    .in('order_id', orderIds)
    .eq('status', 'PENDING');

  if (error) {
    console.error('Failed to approve commissions:', error);
    return 0;
  }

  // Get actual count of approved commissions (not just order count)
  const { count } = await supabase
    .from('affiliate_commissions')
    .select('*', { count: 'exact', head: true })
    .in('order_id', orderIds)
    .eq('status', 'APPROVED');

  return count || 0;
}

/**
 * Void commission (for refunds/chargebacks)
 */
export async function voidCommission(orderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('affiliate_commissions')
    .update({
      status: 'VOID',
      voided_at: new Date().toISOString(),
      notes: 'Order refunded or voided',
    })
    .eq('order_id', orderId)
    .in('status', ['PENDING', 'APPROVED']);

  return !error;
}

// =====================================================
// REFERRAL REWARDS
// =====================================================

export interface RewardConfig {
  REFERRAL_GIVE_MB: number;
  REFERRAL_FRIEND_DISCOUNT_PCT: number;
  REFERRAL_MONTHLY_CAP: number;
}

const DEFAULT_REWARD_CONFIG: RewardConfig = {
  REFERRAL_GIVE_MB: 1024, // 1 GB
  REFERRAL_FRIEND_DISCOUNT_PCT: 10,
  REFERRAL_MONTHLY_CAP: 10,
};

/**
 * Check if order is eligible for referral reward
 */
export async function isEligibleForReferralReward(
  orderId: string,
  userId: string
): Promise<boolean> {
  // Get all paid orders for this user to verify current order is included
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paid');

  if (!orders || orders.length === 0) {
    return false;
  }

  // Check if this is the first paid order AND the current order is in the list
  const orderIds = orders.map(o => o.id);
  return orderIds.length === 1 && orderIds.includes(orderId);
}

/**
 * Check referrer's monthly cap
 */
export async function checkReferrerMonthlyCap(
  referrerUserId: string,
  config: RewardConfig = DEFAULT_REWARD_CONFIG
): Promise<boolean> {
  // Use UTC to ensure consistent month boundaries regardless of server timezone
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1,
    0, 0, 0, 0
  ));

  const { count } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', referrerUserId)
    .gte('created_at', startOfMonth.toISOString());

  return (count || 0) < config.REFERRAL_MONTHLY_CAP;
}

/**
 * Create a referral reward
 */
export async function createReferralReward(
  orderId: string,
  referrerUserId: string,
  referredUserId: string,
  rewardType: 'FREE_DATA' | 'DISCOUNT' | 'CREDIT' = 'FREE_DATA',
  rewardValue: number,
  config: RewardConfig = DEFAULT_REWARD_CONFIG
): Promise<ReferralReward | null> {
  // Check if reward already exists (idempotency)
  const { data: existing } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing) {
    return existing as ReferralReward;
  }

  // Check eligibility
  const isFirstOrder = await isEligibleForReferralReward(orderId, referredUserId);
  if (!isFirstOrder) {
    return null;
  }

  // Check monthly cap
  const withinCap = await checkReferrerMonthlyCap(referrerUserId, config);
  if (!withinCap) {
    console.log(`Referrer ${referrerUserId} has reached monthly cap`);
    return null;
  }

  // Create reward
  const { data, error } = await supabase
    .from('referral_rewards')
    .insert({
      order_id: orderId,
      referrer_user_id: referrerUserId,
      referred_user_id: referredUserId,
      reward_type: rewardType,
      reward_value: rewardValue,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create referral reward:', error);
    return null;
  }

  return data as ReferralReward;
}

/**
 * Apply a referral reward (mark as APPLIED and credit data wallet)
 */
export async function applyReferralReward(rewardId: string): Promise<boolean> {
  const { data: reward } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('id', rewardId)
    .single();

  if (!reward || reward.status !== 'PENDING') {
    return false;
  }

  // Update status
  const { error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'APPLIED',
      applied_at: new Date().toISOString(),
    })
    .eq('id', rewardId);

  if (error) {
    console.error('Failed to apply reward:', error);
    return false;
  }

  // Add data credits to user's wallet
  const dataCreditsMB = reward.reward_value; // e.g., 1024 MB = 1 GB
  const userId = reward.referrer_user_id;

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

  console.log(`Applied reward ${rewardId}: ${reward.reward_type} ${reward.reward_value}MB credited to user ${userId}`);

  return true;
}

/**
 * Void referral reward (for refunds)
 */
export async function voidReferralReward(orderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'VOID',
      voided_at: new Date().toISOString(),
      notes: 'Order refunded or voided',
    })
    .eq('order_id', orderId)
    .in('status', ['PENDING', 'APPLIED']);

  return !error;
}

// =====================================================
// PROCESSING PIPELINE
// =====================================================

/**
 * Process attribution and create commissions/rewards for a paid order
 */
export async function processOrderAttribution(
  order: Order,
  attribution: OrderAttribution
): Promise<{
  commission?: AffiliateCommission;
  reward?: ReferralReward;
}> {
  const result: {
    commission?: AffiliateCommission;
    reward?: ReferralReward;
  } = {};

  // Handle affiliate commission
  if (attribution.source_type === 'AFFILIATE' && attribution.affiliate_id) {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', attribution.affiliate_id)
      .single();

    if (affiliate) {
      const commissionAmount = calculateCommissionAmount(order, affiliate as Affiliate);
      const commission = await createCommission(order.id, affiliate.id, commissionAmount);
      if (commission) {
        result.commission = commission;
      }
    }
  }

  // Handle referral reward
  if (attribution.source_type === 'REFERRAL' && attribution.referrer_user_id) {
    const reward = await createReferralReward(
      order.id,
      attribution.referrer_user_id,
      order.user_id,
      'FREE_DATA',
      DEFAULT_REWARD_CONFIG.REFERRAL_GIVE_MB
    );

    if (reward) {
      result.reward = reward;
    }
  }

  return result;
}

/**
 * Get system config values
 * Note: Using unknown because config values can be strings, numbers, booleans, etc.
 */
export async function getSystemConfig(): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('system_config')
    .select('key, value');

  if (!data) {
    return {};
  }

  return data.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, unknown>);
}
