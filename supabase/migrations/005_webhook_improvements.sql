-- Migration 003: Webhook Improvements
-- Add idempotency tracking and better data storage for webhooks

-- Add notify_id column to webhook_events table for duplicate detection
ALTER TABLE public.webhook_events
ADD COLUMN IF NOT EXISTS notify_id TEXT;

-- Add unique constraint on (provider, notify_id) to prevent duplicate processing
-- Only enforces uniqueness when notify_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_notify_id_unique
ON public.webhook_events (provider, notify_id)
WHERE notify_id IS NOT NULL;

-- Add total_bytes column to orders table to store provider's totalVolume
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS total_bytes BIGINT;

-- Add comment for clarity
COMMENT ON COLUMN public.webhook_events.notify_id IS 'Unique notification ID from webhook provider for idempotency';
COMMENT ON COLUMN public.orders.total_bytes IS 'Total data allocation from provider (in bytes) - may differ from plan.data_gb';
