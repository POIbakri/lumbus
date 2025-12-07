-- =====================================================
-- 021 - Add Expiry Time Tracking to Orders
-- =====================================================
-- Adds expires_at column to store the exact expiration timestamp
-- from eSIM Access API (expiredTime field) instead of calculating
-- from activated_at + validity_days.
--
-- This enables:
-- - More accurate expiry tracking (API-provided vs calculated)
-- - Hours/minutes remaining display (not just days)
-- - Better VALIDITY_USAGE webhook handling
-- =====================================================

-- Add expires_at column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for querying expiring orders
CREATE INDEX IF NOT EXISTS idx_orders_expires_at
ON public.orders(expires_at ASC)
WHERE expires_at IS NOT NULL;

-- Create index for finding soon-to-expire orders (for notifications)
CREATE INDEX IF NOT EXISTS idx_orders_expiring_soon
ON public.orders(expires_at)
WHERE status IN ('completed', 'active') AND expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.expires_at IS 'Exact expiration timestamp from eSIM Access API (expiredTime). More accurate than calculating from activated_at + validity_days.';

-- =====================================================
-- Backfill expires_at for existing activated orders
-- =====================================================
-- Calculate expires_at from activated_at + validity_days for
-- orders that are already activated but don't have expires_at set
-- =====================================================

UPDATE public.orders o
SET expires_at = o.activated_at + (p.validity_days || ' days')::INTERVAL
FROM public.plans p
WHERE o.plan_id = p.id
  AND o.activated_at IS NOT NULL
  AND o.expires_at IS NULL
  AND o.status IN ('completed', 'active', 'depleted', 'expired');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Update esimaccess webhook to store expires_at from API response
-- 2. Update VALIDITY_USAGE webhook handler to update expires_at
-- 3. Update dashboard to show hours/minutes when < 1 day remaining
-- 4. Update /api/user/orders endpoint to include time_remaining
-- =====================================================
