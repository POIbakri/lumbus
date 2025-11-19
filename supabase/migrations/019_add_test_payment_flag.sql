-- =====================================================
-- 019 - Add Test Payment Flag for Users
-- =====================================================
-- This migration adds a simple boolean flag to the users table
-- so we can route specific accounts (e.g. App Store / Play Store
-- reviewer accounts) through Stripe TEST mode while all normal
-- users continue to use Stripe LIVE mode.
--
-- Usage:
-- - Set is_test_user = true for dedicated reviewer/test accounts
--   in the public.users table.
-- - Backend code will detect this flag and use STRIPE_SECRET_KEY_TEST
--   when creating Stripe Payment Intents / Checkout Sessions.
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_test_user
  ON public.users(is_test_user);

-- =====================================================
-- Notes:
-- - No changes to RLS are required; this column is only
--   used by the backend via the service role key.
-- - Existing users default to is_test_user = false.
-- =====================================================


