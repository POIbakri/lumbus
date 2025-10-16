-- Migration 004: Fix region_code column length for multi-country plans
-- Some plans have longer region codes (e.g., "USCA-2", "GL-139") that exceed VARCHAR(10)

-- Increase region_code from VARCHAR(10) to VARCHAR(20)
ALTER TABLE public.plans
ALTER COLUMN region_code TYPE VARCHAR(20);

-- Update index if needed (recreate for consistency)
DROP INDEX IF EXISTS idx_plans_region;
CREATE INDEX idx_plans_region ON public.plans(region_code);

-- Add comment
COMMENT ON COLUMN public.plans.region_code IS 'Country/region code (single country or multi-country code like GL-139, EU-42, USCA-2)';
