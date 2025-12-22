-- =====================================================
-- Atomic Reward Redemption Function
-- =====================================================
-- This function atomically:
-- 1. Validates and claims the reward
-- 2. Updates the user's data wallet
-- 3. Logs the transaction
-- All within a single transaction to prevent race conditions

CREATE OR REPLACE FUNCTION redeem_referral_reward(
  p_reward_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Lock and fetch the reward in one step to prevent race conditions
  SELECT * INTO v_reward
  FROM referral_rewards
  WHERE id = p_reward_id
    AND referrer_user_id = p_user_id
    AND status = 'PENDING'
  FOR UPDATE;

  -- Check if reward exists and is claimable
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reward not found or already redeemed'
    );
  END IF;

  -- Mark reward as APPLIED
  UPDATE referral_rewards
  SET status = 'APPLIED',
      applied_at = NOW()
  WHERE id = p_reward_id;

  -- Atomic upsert for wallet balance
  INSERT INTO user_data_wallet (user_id, balance_mb, created_at, updated_at)
  VALUES (p_user_id, v_reward.reward_value, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance_mb = user_data_wallet.balance_mb + EXCLUDED.balance_mb,
      updated_at = NOW()
  RETURNING balance_mb INTO v_new_balance;

  -- Log the transaction
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount_mb,
    source,
    source_id,
    description
  ) VALUES (
    p_user_id,
    'CREDIT',
    v_reward.reward_value,
    'REFERRAL_REWARD',
    p_reward_id,
    'Referral reward: ' || v_reward.reward_value || 'MB free data'
  );

  RETURN json_build_object(
    'success', true,
    'credits_added', v_reward.reward_value,
    'new_balance', v_new_balance
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION redeem_referral_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_referral_reward(UUID, UUID) TO service_role;
