-- =====================================================
-- Fix Referral Rewards Unique Constraint
-- =====================================================
-- The original schema had order_id as UNIQUE, but we need to allow
-- TWO rewards per order: one for the referrer, one for the buyer.
-- Change to a composite unique constraint on (order_id, referrer_user_id)

-- Drop the old unique constraint on order_id
ALTER TABLE public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_order_id_key;

-- Add a composite unique constraint to prevent duplicate rewards for the same user on same order
-- This allows: referrer gets reward for order X, AND buyer gets reward for order X
ALTER TABLE public.referral_rewards
ADD CONSTRAINT referral_rewards_order_user_unique
UNIQUE (order_id, referrer_user_id);
