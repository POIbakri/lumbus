-- Add is_reloadable column to plans table
-- This indicates whether a plan supports top-up (adding more data to existing eSIM)

ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS is_reloadable BOOLEAN DEFAULT true;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_plans_is_reloadable ON public.plans(is_reloadable) WHERE is_reloadable = true;

-- Add comment for documentation
COMMENT ON COLUMN public.plans.is_reloadable IS 'Whether this plan supports top-up. Daily unlimited plans are typically non-reloadable.';
