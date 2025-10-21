-- =====================================================
-- FIX REMAINING PERFORMANCE WARNINGS
-- =====================================================
-- This migration fixes the REMAINING warnings found by Supabase linter after migration 011:
-- 1. users_select_own policy needs auth.uid() optimization
-- 2. user_push_tokens policies need auth.uid() optimization (if table exists)
-- 3. Additional duplicate indexes not covered in migration 011
--
-- Reference: Supabase database linter output
-- =====================================================

-- =====================================================
-- PART 1: FIX REMAINING auth_rls_initplan WARNINGS
-- =====================================================

-- 1. users table - users_select_own policy
-- EXISTS in migration 000, was MISSED in migration 011
-- NOTE: Migration 000 uses NO QUOTES for policy name
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own
ON public.users
FOR SELECT
TO authenticated
USING (id = (select auth.uid()));

-- 2. user_push_tokens table policies
-- NOTE: This table was added manually to database (not in migration files)
-- We'll use IF EXISTS to avoid errors if table doesn't exist

-- View policy
DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can view their own push tokens"
ON public.user_push_tokens
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- Insert policy
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can insert their own push tokens"
ON public.user_push_tokens
FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- Update policy
DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can update their own push tokens"
ON public.user_push_tokens
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- Delete policy
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can delete their own push tokens"
ON public.user_push_tokens
FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- =====================================================
-- PART 2: FIX ADDITIONAL DUPLICATE INDEXES
-- =====================================================
-- These duplicates were NOT handled in migration 011
-- Migration 000/006 created short names, migration 007 created long names
-- Drop the old ones, keep the descriptive ones from 007

-- 1. affiliates table - NOT in migration 011
DROP INDEX IF EXISTS public.idx_affiliates_active;      -- From 000, replaced by idx_affiliates_is_active (007)

-- 2. plans table - NEW duplicates
DROP INDEX IF EXISTS public.idx_plans_active;          -- From 000, replaced by idx_plans_is_active (007)
DROP INDEX IF EXISTS public.idx_plans_region;          -- From 000, replaced by idx_plans_region_code (007)

-- 3. orders table - NEW duplicates
DROP INDEX IF EXISTS public.idx_orders_stripe_session;      -- From 000, replaced by idx_orders_stripe_session_id (007)
DROP INDEX IF EXISTS public.idx_orders_connect_order;       -- From 000, replaced by idx_orders_connect_order_id (007)

-- 4. discount_code_usage table - NEW duplicates (from migration 006)
DROP INDEX IF EXISTS public.idx_discount_usage_code;        -- From 006, replaced by idx_discount_code_usage_code_id (007)
DROP INDEX IF EXISTS public.idx_discount_usage_user;        -- From 006, replaced by idx_discount_code_usage_user_id (007)
DROP INDEX IF EXISTS public.idx_discount_usage_order;       -- From 006, replaced by idx_discount_code_usage_order_id (007)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration fixes:
-- 1. ✅ 5 auth_rls_initplan warnings (users + user_push_tokens)
-- 2. ✅ 8 additional duplicate_index warnings
--
-- After this migration, only the "leaked password protection" warning
-- should remain (requires manual Supabase dashboard action)
-- =====================================================
