-- =====================================================
-- Add Data Credit Tracking to Orders
-- =====================================================

-- Add columns to track data credit usage on orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS data_credits_used_mb INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_credit_discount_cents INTEGER DEFAULT 0;

-- Add index for finding orders that used credits
CREATE INDEX IF NOT EXISTS idx_orders_credits_used
ON public.orders(data_credits_used_mb)
WHERE data_credits_used_mb > 0;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.data_credits_used_mb IS 'Amount of data credits (in MB) used as payment for this order';
COMMENT ON COLUMN public.orders.data_credit_discount_cents IS 'Value of the data credit discount applied (in cents)';