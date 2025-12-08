-- Migration: Add usage notification tracking tables
-- Purpose: Track sent notifications to prevent duplicates and store usage history
-- Date: 2025-12-08

-- Create usage_notifications_sent table
-- Tracks which notifications have been sent to prevent duplicates
CREATE TABLE IF NOT EXISTS usage_notifications_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'data_50', 'data_80', 'data_90', 'data_100',
    'validity_1_day', 'validity_expired',
    'esim_ready', 'esim_activated'
  )),
  threshold_value NUMERIC, -- e.g., 50, 80, 90 for data percentage
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,

  -- Prevent duplicate notifications for same order + type combination
  CONSTRAINT unique_notification UNIQUE (order_id, notification_type)
);

-- Create esim_usage table for historical tracking
-- Stores snapshots of usage data for analytics and debugging
CREATE TABLE IF NOT EXISTS esim_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  data_used_bytes BIGINT NOT NULL DEFAULT 0,
  data_remaining_bytes BIGINT NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  usage_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('webhook', 'cron', 'api_refresh')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_notifications_order_id
  ON usage_notifications_sent(order_id);

CREATE INDEX IF NOT EXISTS idx_usage_notifications_user_id
  ON usage_notifications_sent(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_notifications_type
  ON usage_notifications_sent(notification_type);

CREATE INDEX IF NOT EXISTS idx_esim_usage_order_id
  ON esim_usage(order_id);

CREATE INDEX IF NOT EXISTS idx_esim_usage_recorded_at
  ON esim_usage(recorded_at DESC);

-- Add comments for documentation
COMMENT ON TABLE usage_notifications_sent IS 'Tracks sent notifications to prevent duplicate alerts';
COMMENT ON COLUMN usage_notifications_sent.notification_type IS 'Type of notification: data usage thresholds or validity alerts';
COMMENT ON COLUMN usage_notifications_sent.threshold_value IS 'The threshold that triggered this notification (e.g., 80 for 80% used)';
COMMENT ON COLUMN usage_notifications_sent.push_sent IS 'Whether a push notification was sent';
COMMENT ON COLUMN usage_notifications_sent.email_sent IS 'Whether an email notification was sent';

COMMENT ON TABLE esim_usage IS 'Historical usage data snapshots for analytics';
COMMENT ON COLUMN esim_usage.source IS 'Where this data came from: webhook, cron job, or user-triggered refresh';

-- Enable Row Level Security
ALTER TABLE usage_notifications_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE esim_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_notifications_sent
CREATE POLICY "Users can view their own notifications"
  ON usage_notifications_sent
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access to notifications"
  ON usage_notifications_sent
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for esim_usage
CREATE POLICY "Users can view their own usage history"
  ON esim_usage
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to usage"
  ON esim_usage
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON usage_notifications_sent TO authenticated;
GRANT ALL ON usage_notifications_sent TO service_role;
GRANT SELECT ON esim_usage TO authenticated;
GRANT ALL ON esim_usage TO service_role;
