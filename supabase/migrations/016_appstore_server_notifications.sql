-- =====================================================
-- APPLE APP STORE SERVER NOTIFICATIONS
-- Migration for server-to-server notification handling
-- =====================================================
-- This migration adds support for Apple App Store Server Notifications v2
-- which provides real-time updates on:
-- - Purchases and renewals
-- - Refunds and revocations
-- - Subscription changes
-- - Billing issues
-- =====================================================

-- =====================================================
-- 1. CREATE APPLE SERVER NOTIFICATIONS TABLE
-- =====================================================

-- Table to store all Apple App Store Server Notifications
CREATE TABLE IF NOT EXISTS public.apple_server_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Apple's unique notification identifier (for idempotency)
  notification_uuid TEXT NOT NULL UNIQUE,

  -- Notification metadata
  notification_type TEXT NOT NULL,
  subtype TEXT,

  -- Transaction identifiers
  transaction_id TEXT,
  original_transaction_id TEXT,
  web_order_line_item_id TEXT,

  -- Order linking (nullable - we match by transaction_id)
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  -- Raw notification data
  signed_payload TEXT NOT NULL,
  decoded_payload JSONB NOT NULL,

  -- Processing status
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,

  -- Timestamps
  notification_sent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_apple_notifications_uuid
  ON public.apple_server_notifications(notification_uuid);

CREATE INDEX IF NOT EXISTS idx_apple_notifications_type
  ON public.apple_server_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_apple_notifications_transaction
  ON public.apple_server_notifications(transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_apple_notifications_original_transaction
  ON public.apple_server_notifications(original_transaction_id)
  WHERE original_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_apple_notifications_order
  ON public.apple_server_notifications(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_apple_notifications_processed
  ON public.apple_server_notifications(processed)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_apple_notifications_created
  ON public.apple_server_notifications(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.apple_server_notifications IS 'Stores Apple App Store Server Notifications v2 for purchase events, refunds, and subscription changes';
COMMENT ON COLUMN public.apple_server_notifications.notification_uuid IS 'Apple unique notification identifier from notificationUUID field';
COMMENT ON COLUMN public.apple_server_notifications.notification_type IS 'Type of notification (REFUND, DID_RENEW, SUBSCRIBED, etc.)';
COMMENT ON COLUMN public.apple_server_notifications.signed_payload IS 'JWS signed payload from Apple (for verification)';
COMMENT ON COLUMN public.apple_server_notifications.decoded_payload IS 'Decoded notification payload in JSON format';

-- =====================================================
-- 2. EXTEND ORDERS TABLE
-- =====================================================

-- Add refund tracking columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Update order status constraint to include 'refunded'
-- We need to drop and recreate the constraint
DO $$
BEGIN
  -- Check if constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check'
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

-- Add updated constraint with all status values including 'refunded'
-- Based on analysis: pending, paid, provisioning, completed, failed, active, depleted, expired, cancelled, revoked, refunded
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'provisioning',
    'completed',
    'failed',
    'active',
    'depleted',
    'expired',
    'cancelled',
    'revoked',
    'refunded'
  ));

-- Add index for refunded orders
CREATE INDEX IF NOT EXISTS idx_orders_refunded_at
  ON public.orders(refunded_at DESC)
  WHERE refunded_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.orders.refunded_at IS 'Timestamp when order was refunded (from Apple App Store Server Notification)';
COMMENT ON COLUMN public.orders.refund_reason IS 'Reason for refund if provided by Apple';

-- =====================================================
-- 3. EXTEND WEBHOOK_EVENTS TABLE (Optional)
-- =====================================================

-- Add apple_notification_id for linking webhook events to apple notifications
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS apple_notification_id UUID REFERENCES public.apple_server_notifications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_apple_notification
  ON public.webhook_events(apple_notification_id)
  WHERE apple_notification_id IS NOT NULL;

COMMENT ON COLUMN public.webhook_events.apple_notification_id IS 'Links webhook event to specific Apple server notification';

-- =====================================================
-- 4. CREATE NOTIFICATION PROCESSING LOG
-- =====================================================

-- Table to track notification processing attempts and retries
CREATE TABLE IF NOT EXISTS public.apple_notification_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.apple_server_notifications(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  processing_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apple_processing_log_notification
  ON public.apple_notification_processing_log(notification_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_apple_processing_log_failed
  ON public.apple_notification_processing_log(success)
  WHERE success = false;

COMMENT ON TABLE public.apple_notification_processing_log IS 'Tracks all processing attempts for Apple notifications including retries and errors';

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.apple_server_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_notification_processing_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies (service role bypasses these automatically)
-- Regular users cannot read these tables
CREATE POLICY apple_notifications_admin_only ON public.apple_server_notifications
  FOR ALL USING (false);

CREATE POLICY apple_processing_log_admin_only ON public.apple_notification_processing_log
  FOR ALL USING (false);

-- =====================================================
-- 6. CREATE HELPER FUNCTION FOR NOTIFICATION LOOKUP
-- =====================================================

-- Function to find order by Apple transaction ID
CREATE OR REPLACE FUNCTION public.find_order_by_apple_transaction(
  p_transaction_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  SELECT id INTO v_order_id
  FROM public.orders
  WHERE apple_transaction_id = p_transaction_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.find_order_by_apple_transaction IS 'Helper function to find order by Apple transaction ID';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration adds:
-- 1. apple_server_notifications table - Store all notifications from Apple
-- 2. apple_notification_processing_log - Track processing attempts
-- 3. Extended orders table - Add refunded status and refund tracking
-- 4. Helper functions - For transaction lookups
-- 5. Indexes and RLS policies - For performance and security
--
-- Next steps:
-- 1. Implement webhook endpoint at /api/appstore/webhook
-- 2. Add JWS signature verification
-- 3. Configure URL in App Store Connect
-- 4. Test with Apple's test notifications
-- =====================================================
