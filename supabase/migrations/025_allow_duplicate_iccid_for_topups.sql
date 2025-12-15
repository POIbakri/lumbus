-- Migration: Allow duplicate ICCID for top-up orders
--
-- Problem: The unique constraint on orders.iccid prevents top-up orders from
-- storing which eSIM they topped up. When a user tops up an existing eSIM,
-- we need to record the same ICCID on the new top-up order.
--
-- Solution: Remove the unique constraint. Multiple orders CAN legitimately
-- share the same ICCID (original purchase + any subsequent top-ups).

-- Drop the unique constraint on iccid
ALTER TABLE orders DROP CONSTRAINT IF EXISTS unique_iccid;

-- Add an index for performance (non-unique) since we query by iccid
CREATE INDEX IF NOT EXISTS idx_orders_iccid ON orders(iccid) WHERE iccid IS NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN orders.iccid IS 'The ICCID of the eSIM. Multiple orders can share the same ICCID (original + top-ups).';
