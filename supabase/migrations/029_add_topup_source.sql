-- =====================================================
-- Add topup_source column to orders table
-- =====================================================
-- This allows us to distinguish between:
-- - 'paid' - regular Stripe/IAP top-ups
-- - 'reward' - top-ups using wallet credit from referral rewards
-- - NULL - original eSIM purchases (not top-ups)

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS topup_source TEXT;

-- Add constraint to ensure valid values
ALTER TABLE public.orders
ADD CONSTRAINT orders_topup_source_check
CHECK (topup_source IS NULL OR topup_source IN ('paid', 'reward'));

-- Add comment for documentation
COMMENT ON COLUMN public.orders.topup_source IS 'Source of top-up: paid (Stripe/IAP), reward (wallet credit), or NULL for original purchases';

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_orders_topup_source
ON public.orders(topup_source)
WHERE topup_source IS NOT NULL;
