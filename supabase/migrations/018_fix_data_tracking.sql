-- =====================================================
-- Fix Data Tracking: Remove payment discount tracking, add free data tracking
-- =====================================================

-- Drop old columns that tracked data as payment discounts
ALTER TABLE public.orders
DROP COLUMN IF EXISTS data_credits_used_mb,
DROP COLUMN IF EXISTS data_credit_discount_cents;

-- Drop old index
DROP INDEX IF EXISTS idx_orders_credits_used;

-- Add new columns to track free data additions to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS free_data_added_mb INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_data_added_at TIMESTAMP WITH TIME ZONE;

-- Add index for finding orders that got free data
CREATE INDEX IF NOT EXISTS idx_orders_free_data_added
ON public.orders(free_data_added_mb)
WHERE free_data_added_mb > 0;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.free_data_added_mb IS 'Amount of free data (in MB) added to this eSIM from user wallet';
COMMENT ON COLUMN public.orders.free_data_added_at IS 'Timestamp when free data was last added to this order';