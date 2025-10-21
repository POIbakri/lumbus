-- Enable Row Level Security on all public tables
-- This migration addresses security warnings from Supabase database linter

-- Enable RLS on all affected tables
ALTER TABLE public.payout_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Service role has full access to payout_commissions" ON public.payout_commissions;
DROP POLICY IF EXISTS "Service role has full access to plans" ON public.plans;
DROP POLICY IF EXISTS "Service role has full access to webhook_idempotency" ON public.webhook_idempotency;
DROP POLICY IF EXISTS "Service role has full access to affiliate_stats_daily" ON public.affiliate_stats_daily;
DROP POLICY IF EXISTS "Service role has full access to system_config" ON public.system_config;
DROP POLICY IF EXISTS "Service role has full access to webhook_events" ON public.webhook_events;
DROP POLICY IF EXISTS "Service role has full access to discount_code_usage" ON public.discount_code_usage;
DROP POLICY IF EXISTS "Service role has full access to discount_codes" ON public.discount_codes;

DROP POLICY IF EXISTS "Users can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Users can view discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Authenticated users can view their discount code usage" ON public.discount_code_usage;
DROP POLICY IF EXISTS "Affiliates can view their payout links" ON public.payout_commissions;
DROP POLICY IF EXISTS "Affiliates can view their daily stats" ON public.affiliate_stats_daily;

-- Create RLS policies for payout_commissions
-- Service role has full access for backend operations
CREATE POLICY "Service role has full access to payout_commissions"
ON public.payout_commissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: payout_commissions is a junction table with payout_id and commission_id
-- Affiliates can view their payout commission links through the payouts table
CREATE POLICY "Affiliates can view their payout links"
ON public.payout_commissions
FOR SELECT
TO authenticated
USING (payout_id IN (
  SELECT id FROM public.affiliate_payouts WHERE affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  )
));

-- Create RLS policies for plans
-- Service role has full access for backend operations
CREATE POLICY "Service role has full access to plans"
ON public.plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All users can view active plans (for browsing eSIM options)
CREATE POLICY "Users can view active plans"
ON public.plans
FOR SELECT
TO public
USING (is_active = true);

-- Create RLS policies for webhook_idempotency
-- Service role only (backend webhook processing)
CREATE POLICY "Service role has full access to webhook_idempotency"
ON public.webhook_idempotency
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policies for affiliate_stats_daily
-- Service role has full access for backend operations
CREATE POLICY "Service role has full access to affiliate_stats_daily"
ON public.affiliate_stats_daily
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Affiliates can view their own daily stats
CREATE POLICY "Affiliates can view their daily stats"
ON public.affiliate_stats_daily
FOR SELECT
TO authenticated
USING (affiliate_id IN (
  SELECT id FROM public.affiliates WHERE user_id = auth.uid()
));

-- Create RLS policies for system_config
-- Service role only (administrative configuration)
CREATE POLICY "Service role has full access to system_config"
ON public.system_config
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policies for webhook_events
-- Service role only (backend webhook processing)
CREATE POLICY "Service role has full access to webhook_events"
ON public.webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policies for discount_code_usage
-- Service role has full access for backend operations
CREATE POLICY "Service role has full access to discount_code_usage"
ON public.discount_code_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can view their own discount code usage
CREATE POLICY "Authenticated users can view their discount code usage"
ON public.discount_code_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create RLS policies for discount_codes
-- Service role has full access for backend operations
CREATE POLICY "Service role has full access to discount_codes"
ON public.discount_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All users can view active discount codes (for applying discounts)
CREATE POLICY "Users can view discount codes"
ON public.discount_codes
FOR SELECT
TO public
USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));
