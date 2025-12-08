-- =====================================================
-- Migration: Add Stripe Customer IDs to Users
-- =====================================================
-- Adds columns to store Stripe customer IDs for both live and test mode.
-- This allows us to link returning customers in Stripe instead of
-- creating guest checkouts every time.
-- =====================================================

-- Add stripe_customer_id for live mode
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add stripe_customer_id_test for test mode (app reviewers, testing)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_customer_id_test VARCHAR(255);

-- Add indexes for lookups (e.g., when receiving webhooks with customer ID)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON public.users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id_test
ON public.users(stripe_customer_id_test)
WHERE stripe_customer_id_test IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe Customer ID for live mode payments';
COMMENT ON COLUMN public.users.stripe_customer_id_test IS 'Stripe Customer ID for test mode payments (app reviewers)';
