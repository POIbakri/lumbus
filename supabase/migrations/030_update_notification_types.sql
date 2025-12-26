-- Migration: Update notification types to match mobile app
-- Purpose: Align backend notification types with mobile app expectations
-- Date: 2025-12-26

-- Step 1: Drop the old constraint first (so we can update data)
ALTER TABLE usage_notifications_sent
DROP CONSTRAINT IF EXISTS usage_notifications_sent_notification_type_check;

-- Step 2: Migrate existing records to new type names
-- This prevents duplicate notifications for users who already received alerts
UPDATE usage_notifications_sent SET notification_type = 'usage_50' WHERE notification_type = 'data_50';
UPDATE usage_notifications_sent SET notification_type = 'usage_20' WHERE notification_type = 'data_80';  -- 80% used = 20% remaining
UPDATE usage_notifications_sent SET notification_type = 'usage_10' WHERE notification_type = 'data_90';  -- 90% used = 10% remaining
UPDATE usage_notifications_sent SET notification_type = 'usage_depleted' WHERE notification_type = 'data_100';

-- Step 3: Add new constraint with only the new notification types
ALTER TABLE usage_notifications_sent
ADD CONSTRAINT usage_notifications_sent_notification_type_check
CHECK (notification_type IN (
  -- Usage types (aligned with mobile app)
  'usage_50',       -- 50% data used
  'usage_30',       -- 30% remaining (70% used) - NEW threshold
  'usage_20',       -- 20% remaining (80% used)
  'usage_10',       -- 10% remaining (90% used)
  'usage_depleted', -- 0% remaining (100% used)
  -- Validity types (unchanged)
  'validity_1_day',
  'validity_expired',
  -- eSIM types (unchanged)
  'esim_ready',
  'esim_activated'
));

-- Update comment
COMMENT ON COLUMN usage_notifications_sent.notification_type IS
  'Type of notification: usage thresholds (usage_50, usage_30, usage_20, usage_10, usage_depleted), validity alerts (validity_1_day, validity_expired), or eSIM status (esim_ready, esim_activated)';
