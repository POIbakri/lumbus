-- =====================================================
-- LUMBUS AFFILIATE USER_ID BACKFILL
-- Migration: 004 - Link existing affiliates to users
-- =====================================================
-- This migration links existing affiliate records to user accounts
-- by matching email addresses
-- =====================================================

-- Update affiliates table to set user_id where it's NULL but email matches a user
UPDATE public.affiliates a
SET user_id = u.id
FROM public.users u
WHERE a.user_id IS NULL
  AND a.email IS NOT NULL
  AND LOWER(a.email) = LOWER(u.email);

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.affiliates
  WHERE user_id IS NOT NULL;

  RAISE NOTICE 'Backfill complete. Total affiliates with user_id: %', updated_count;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- To apply this migration:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this file
-- 4. Run the migration
-- =====================================================
