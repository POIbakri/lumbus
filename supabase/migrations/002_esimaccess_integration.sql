-- =====================================================
-- ESIM ACCESS INTEGRATION MIGRATION
-- Adds required fields for eSIM Access API v1.6 integration
-- =====================================================

-- Add eSIM Access specific fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS iccid TEXT,
  ADD COLUMN IF NOT EXISTS esim_tran_no TEXT,
  ADD COLUMN IF NOT EXISTS data_usage_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_remaining_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS last_usage_update TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_orders_iccid ON public.orders(iccid) WHERE iccid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_esim_tran_no ON public.orders(esim_tran_no) WHERE esim_tran_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_activated_at ON public.orders(activated_at DESC) WHERE activated_at IS NOT NULL;

-- Add unique constraint on iccid (one order per eSIM)
ALTER TABLE public.orders
  ADD CONSTRAINT unique_iccid UNIQUE (iccid);

-- Update status enum to include more granular states
-- Note: PostgreSQL doesn't support ALTER TYPE for CHECK constraints, so we need to recreate the constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'provisioning', 'completed', 'active', 'depleted', 'expired', 'cancelled', 'revoked', 'failed'));

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.orders.iccid IS 'eSIM ICCID number from eSIM Access';
COMMENT ON COLUMN public.orders.esim_tran_no IS 'eSIM Access transaction number for usage queries';
COMMENT ON COLUMN public.orders.data_usage_bytes IS 'Current data usage in bytes (updated via webhook)';
COMMENT ON COLUMN public.orders.data_remaining_bytes IS 'Remaining data in bytes (updated via webhook)';
COMMENT ON COLUMN public.orders.last_usage_update IS 'Timestamp of last data usage update';
COMMENT ON COLUMN public.orders.activated_at IS 'Timestamp when eSIM was activated on device (from SMDP_EVENT webhook)';

-- =====================================================
-- UPDATE SAMPLE DATA
-- =====================================================

-- Update sample plans to use eSIM Access SKUs instead of 1GLOBAL
UPDATE public.plans
SET supplier_sku = REPLACE(supplier_sku, '1GLOBAL_', 'ESIMACCESS_')
WHERE supplier_sku LIKE '1GLOBAL_%';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
