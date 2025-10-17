-- =====================================================
-- LUMBUS AFFILIATE APPLICATION SYSTEM
-- Migration: 003 - Add application fields to affiliates
-- =====================================================

-- Add application-related columns to affiliates table
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS audience_description TEXT,
  ADD COLUMN IF NOT EXISTS traffic_sources TEXT,
  ADD COLUMN IF NOT EXISTS promotional_methods TEXT,
  ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending'
    CHECK (application_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for application status queries
CREATE INDEX IF NOT EXISTS idx_affiliates_application_status
  ON public.affiliates(application_status)
  WHERE application_status = 'pending';

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_email
  ON public.affiliates(email)
  WHERE email IS NOT NULL;

-- Update existing affiliates to have 'approved' status
UPDATE public.affiliates
SET application_status = 'approved',
    approved_at = created_at
WHERE application_status IS NULL OR application_status = 'pending';

-- Add comment
COMMENT ON COLUMN public.affiliates.application_status IS
  'Application status: pending (awaiting review), approved (active affiliate), rejected (denied)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
