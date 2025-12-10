-- =====================================================
-- Add is_topup flag to orders table
-- =====================================================
-- This allows mobile app and other clients to easily identify
-- which orders are top-ups vs original eSIM purchases

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_topup BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for filtering top-ups
CREATE INDEX IF NOT EXISTS idx_orders_is_topup
ON public.orders(is_topup)
WHERE is_topup = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.is_topup IS 'True if this order is a top-up for an existing eSIM, false for original purchases';

-- =====================================================
-- Backfill existing orders
-- =====================================================
-- Mark orders as top-ups if they share an ICCID with an older order
-- (i.e., not the first order for that ICCID)

UPDATE public.orders o
SET is_topup = TRUE
WHERE o.iccid IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders older
    WHERE older.iccid = o.iccid
    AND older.created_at < o.created_at
  );
