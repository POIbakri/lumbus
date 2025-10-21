-- =====================================================
-- OPTIONAL: RLS POLICIES FOR BACKEND-ONLY TABLES
-- =====================================================
-- This migration is OPTIONAL and addresses INFO-level warnings
-- from Supabase database linter about tables with RLS enabled
-- but no policies.
--
-- These tables are ONLY accessed via service role (backend API routes),
-- so these policies don't affect functionality - they're just defensive.
--
-- Level: INFO (not ERROR or WARN)
-- Impact: None (service role bypasses all policies)
-- =====================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Service role has full access to affiliate_clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Service role has full access to affiliate_payouts" ON public.affiliate_payouts;
DROP POLICY IF EXISTS "Service role has full access to fraud_flags" ON public.fraud_flags;
DROP POLICY IF EXISTS "Service role has full access to order_attributions" ON public.order_attributions;

-- Create service role policies for backend-only tables
-- These tables are never accessed from the frontend (only via API routes)

-- 1. affiliate_clicks - Click tracking (backend only)
CREATE POLICY "Service role has full access to affiliate_clicks"
ON public.affiliate_clicks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. affiliate_payouts - Payout management (backend/admin only)
CREATE POLICY "Service role has full access to affiliate_payouts"
ON public.affiliate_payouts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. fraud_flags - Fraud detection (backend/admin only)
CREATE POLICY "Service role has full access to fraud_flags"
ON public.fraud_flags
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. order_attributions - Attribution tracking (backend only)
CREATE POLICY "Service role has full access to order_attributions"
ON public.order_attributions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- NOTES
-- =====================================================
-- These policies resolve INFO-level warnings but don't change behavior:
-- 1. All backend operations use service role (bypass RLS)
-- 2. No frontend code queries these tables
-- 3. These policies are defensive security (belt and suspenders)
--
-- Without these policies:
-- - App works fine (service role has full access anyway)
-- - Info warnings appear in Supabase linter
--
-- With these policies:
-- - App still works fine (service role still has full access)
-- - Info warnings disappear
-- - Defense in depth if anon key is ever used accidentally
-- =====================================================
