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
 * Uses atomic DB function to prevent race conditions
 */
export async function applyReferralReward(rewardId: string, userId: string): Promise<boolean> {
  // Use atomic DB function with FOR UPDATE locking
  const { data: result, error } = await supabase.rpc('redeem_referral_reward', {
    p_reward_id: rewardId,
    p_user_id: userId,
  });

  if (error) {
    console.error(`Failed to apply reward ${rewardId}:`, error);
    return false;
  }

  if (!result?.success) {
    console.log(`Reward ${rewardId} not applied: ${result?.error || 'already redeemed or not found'}`);
    return false;
  }

  console.log(`Applied reward ${rewardId}: ${(result.credits_added / 1024).toFixed(1)}GB free data added`);
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
 * @param skipRewards - Skip creating free data rewards (used when discount codes override referral benefits)
 */
export async function processOrderAttribution(
  order: Order,
  attribution: OrderAttribution,
  skipRewards = false
): Promise<{
  commission?: AffiliateCommission;
  reward?: ReferralReward;
}> {
  const result: {
    commission?: AffiliateCommission;
    reward?: ReferralReward;
  } = {};

  // Load referral reward configuration so discount percentages and reward MB stay in sync with system_config
  const systemConfig = await getSystemConfig();
  const cfgRewardMB = systemConfig.REFERRAL_GIVE_MB as unknown;
  const rewardValueMB =
    typeof cfgRewardMB === 'number'
      ? cfgRewardMB
      : Number(cfgRewardMB as string) || DEFAULT_REWARD_CONFIG.REFERRAL_GIVE_MB;
  const rewardConfig: RewardConfig = {
    REFERRAL_GIVE_MB: rewardValueMB,
    REFERRAL_FRIEND_DISCOUNT_PCT: DEFAULT_REWARD_CONFIG.REFERRAL_FRIEND_DISCOUNT_PCT,
    REFERRAL_MONTHLY_CAP: DEFAULT_REWARD_CONFIG.REFERRAL_MONTHLY_CAP,
  };

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

  // Handle referral reward - BOTH users get 1GB auto-credited to their wallet
  // Skip rewards if a discount code was used (discount codes override referral benefits)
  if (!skipRewards && attribution.source_type === 'REFERRAL' && attribution.referrer_user_id) {
    // Check if rewards already exist for this order
    const { data: existingRewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('order_id', order.id);

    const referrerRewardExists = existingRewards?.some(r => r.referrer_user_id === attribution.referrer_user_id);
    const buyerRewardExists = existingRewards?.some(r => r.referrer_user_id === order.user_id);

    // Check if this is the buyer's first order (required for any referral rewards)
    const isFirstOrder = await isEligibleForReferralReward(order.id, order.user_id);

    // Only create rewards if this is the buyer's first purchase
    if (isFirstOrder) {
      // 1. Create reward and credit referrer's wallet atomically
      if (!referrerRewardExists) {
        // Check monthly cap
        const withinCap = await checkReferrerMonthlyCap(attribution.referrer_user_id, rewardConfig);
        if (withinCap) {
          const rewardId = crypto.randomUUID();

          // Atomic: insert reward record + credit wallet in one transaction
          const { data: rewardResult, error } = await supabase.rpc('create_and_credit_referral_reward', {
            p_reward_id: rewardId,
            p_order_id: order.id,
            p_referrer_user_id: attribution.referrer_user_id,
            p_referred_user_id: order.user_id,
            p_reward_value: rewardValueMB,
            p_notes: 'Earned from referral - friend made first purchase',
          });

          if (error) {
            console.error(`Failed to create referrer reward:`, error);
          } else if (rewardResult?.success) {
            // Set result.reward so webhook can send notification email
            result.reward = {
              id: rewardId,
              order_id: order.id,
              referrer_user_id: attribution.referrer_user_id,
              referred_user_id: order.user_id,
              reward_type: 'FREE_DATA',
              reward_value: rewardValueMB,
              status: 'APPLIED',
              created_at: new Date().toISOString(),
              applied_at: new Date().toISOString(),
              expired_at: null,
              voided_at: null,
              notes: 'Earned from referral - friend made first purchase',
            } as ReferralReward;
            console.log(`Auto-credited 1GB to referrer ${attribution.referrer_user_id}`);
          } else {
            console.log(`Referrer reward already exists for order ${order.id}`);
          }
        } else {
          console.log(`Referrer ${attribution.referrer_user_id} has reached monthly cap`);
        }
      }

      // 2. Create reward and credit buyer's wallet atomically
      if (!buyerRewardExists) {
        const rewardId = crypto.randomUUID();

        // Atomic: insert reward record + credit wallet in one transaction
        const { data: rewardResult, error } = await supabase.rpc('create_and_credit_referral_reward', {
          p_reward_id: rewardId,
          p_order_id: order.id,
          p_referrer_user_id: order.user_id,
          p_referred_user_id: order.user_id,
          p_reward_value: rewardValueMB,
          p_notes: 'First-time buyer bonus for using referral code',
        });

        if (error) {
          console.error(`Failed to create buyer reward:`, error);
        } else if (rewardResult?.success) {
          console.log(`Auto-credited 1GB to first-time buyer ${order.user_id}`);
        } else {
          console.log(`Buyer reward already exists for order ${order.id}`);
        }
      }
    } else {
      console.log(`Skipping referral rewards - user ${order.user_id} is not a first-time buyer`);
    }
  } else if (skipRewards && attribution.source_type === 'REFERRAL') {
    console.log(`Skipping referral rewards for order ${order.id} - discount code was used (overrides referral benefits)`);
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
