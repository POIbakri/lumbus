-- =====================================================
-- Atomic Referral Reward Creation + Credit Function
-- =====================================================
-- Atomically creates a reward record and credits the wallet
-- The INSERT uses unique constraint as a lock to prevent duplicates

CREATE OR REPLACE FUNCTION create_and_credit_referral_reward(
  p_reward_id UUID,
  p_order_id UUID,
  p_referrer_user_id UUID,
  p_referred_user_id UUID,
  p_reward_value INTEGER,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Try to insert reward record first (unique constraint acts as lock)
  BEGIN
    INSERT INTO referral_rewards (
      id,
      order_id,
      referrer_user_id,
      referred_user_id,
      reward_type,
      reward_value,
      status,
      applied_at,
      notes
    ) VALUES (
      p_reward_id,
      p_order_id,
      p_referrer_user_id,
      p_referred_user_id,
      'FREE_DATA',
      p_reward_value,
      'APPLIED',
      NOW(),
      p_notes
    );
  EXCEPTION WHEN unique_violation THEN
    -- Record already exists, skip
    RETURN json_build_object(
      'success', false,
      'error', 'Reward already exists for this order and user'
    );
  END;

  -- Reward record created, now atomically credit wallet
  INSERT INTO user_data_wallet (user_id, balance_mb, created_at, updated_at)
  VALUES (p_referrer_user_id, p_reward_value, NOW(), NOW())
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
    p_referrer_user_id,
    'CREDIT',
    p_reward_value,
    'REFERRAL_REWARD',
    p_reward_id,
    p_notes
  );

  RETURN json_build_object(
    'success', true,
    'reward_id', p_reward_id,
    'new_balance', v_new_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_and_credit_referral_reward(UUID, UUID, UUID, UUID, INTEGER, TEXT) TO service_role;
