/**
 * Data Wallet Management System
 * Handles data credit operations for referral rewards
 */

import { supabase } from './db';

/**
 * Calculate how many data credits can be applied to a purchase
 * @param userId - User ID
 * @param orderAmountUSD - Order amount in USD
 * @returns Credits to apply and equivalent USD discount
 */
export async function calculateDataCreditDiscount(
  userId: string,
  orderAmountUSD: number
): Promise<{ creditsToUseMB: number; discountUSD: number; discountCents: number }> {
  // Get user's wallet balance
  const { data: wallet } = await supabase
    .from('user_data_wallet')
    .select('balance_mb')
    .eq('user_id', userId)
    .maybeSingle();

  if (!wallet || wallet.balance_mb === 0) {
    return { creditsToUseMB: 0, discountUSD: 0, discountCents: 0 };
  }

  // Conversion rate: 1GB = $2 USD (adjustable)
  const MB_TO_USD_RATE = 0.002; // $0.002 per MB = $2 per GB

  // Calculate maximum discount possible from wallet
  const maxDiscountFromWallet = wallet.balance_mb * MB_TO_USD_RATE;

  // Calculate actual discount (min of order amount and wallet value)
  const actualDiscountUSD = Math.min(orderAmountUSD, maxDiscountFromWallet);

  // Calculate credits to use
  const creditsToUseMB = Math.ceil(actualDiscountUSD / MB_TO_USD_RATE);

  // Ensure we don't use more credits than available
  const finalCreditsToUse = Math.min(creditsToUseMB, wallet.balance_mb);
  const finalDiscount = finalCreditsToUse * MB_TO_USD_RATE;
  const finalDiscountCents = Math.round(finalDiscount * 100);

  return {
    creditsToUseMB: finalCreditsToUse,
    discountUSD: Number(finalDiscount.toFixed(2)),
    discountCents: finalDiscountCents
  };
}

/**
 * Apply data credits to an order
 * @param userId - User ID
 * @param orderId - Order ID
 * @param creditsMB - Amount of credits to use in MB
 * @param discountCents - Value of the discount in cents
 */
export async function applyDataCredits(
  userId: string,
  orderId: string,
  creditsMB: number,
  discountCents: number
): Promise<boolean> {
  try {
    // Start a transaction
    // 1. Deduct from wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_data_wallet')
      .select('balance_mb')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError || !wallet || wallet.balance_mb < creditsMB) {
      console.error('Insufficient wallet balance');
      return false;
    }

    // Update wallet balance
    const newBalance = wallet.balance_mb - creditsMB;
    const { error: updateError } = await supabase
      .from('user_data_wallet')
      .update({
        balance_mb: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update wallet:', updateError);
      return false;
    }

    // 2. Record transaction
    const discountUSD = (discountCents / 100).toFixed(2);
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'DEBIT',
        amount_mb: creditsMB,
        source: 'ORDER_PAYMENT',
        source_id: orderId,
        description: `Used ${(creditsMB / 1024).toFixed(2)}GB for eSIM purchase (saved $${discountUSD})`
      });

    // 3. Record credit usage on order (optional metadata)
    await supabase
      .from('orders')
      .update({
        data_credits_used_mb: creditsMB,
        data_credit_discount_cents: discountCents
      })
      .eq('id', orderId);

    console.log(`Applied ${creditsMB}MB credits ($${discountUSD} discount) to order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to apply data credits:', error);
    return false;
  }
}

/**
 * Refund data credits when an order is refunded
 * @param orderId - Order ID
 */
export async function refundDataCredits(orderId: string): Promise<boolean> {
  try {
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, data_credits_used_mb, data_credit_discount_cents')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || !order.data_credits_used_mb) {
      return true; // No credits to refund
    }

    // Get current wallet balance
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('balance_mb')
      .eq('user_id', order.user_id)
      .maybeSingle();

    const currentBalance = wallet?.balance_mb || 0;
    const newBalance = currentBalance + order.data_credits_used_mb;

    // Update wallet balance
    if (wallet) {
      await supabase
        .from('user_data_wallet')
        .update({
          balance_mb: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', order.user_id);
    } else {
      // Create wallet if doesn't exist
      await supabase
        .from('user_data_wallet')
        .insert({
          user_id: order.user_id,
          balance_mb: order.data_credits_used_mb
        });
    }

    // Record refund transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: order.user_id,
        type: 'CREDIT',
        amount_mb: order.data_credits_used_mb,
        source: 'ORDER_REFUND',
        source_id: orderId,
        description: `Refunded ${(order.data_credits_used_mb / 1024).toFixed(2)}GB from cancelled order`
      });

    console.log(`Refunded ${order.data_credits_used_mb}MB to user ${order.user_id}`);
    return true;
  } catch (error) {
    console.error('Failed to refund data credits:', error);
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