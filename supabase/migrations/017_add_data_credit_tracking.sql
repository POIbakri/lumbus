-- =====================================================
-- Add Free Data Tracking to Orders
-- =====================================================

-- Add columns to track free data additions to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS free_data_added_mb INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_data_added_at TIMESTAMP WITH TIME ZONE;

-- Add index for finding orders that got free data
CREATE INDEX IF NOT EXISTS idx_orders_free_data_added
ON public.orders(free_data_added_mb)
WHERE free_data_added_mb > 0;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.free_data_added_mb IS 'Amount of free data (in MB) added to this eSIM order';
COMMENT ON COLUMN public.orders.free_data_added_at IS 'Timestamp when free data was added to this order';