-- =====================================================
-- eSIM Reminder Email Tracking
-- Tracks when reminder emails are sent to avoid duplicates
-- =====================================================

-- Create table to track sent reminder emails
CREATE TABLE IF NOT EXISTS esim_reminder_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL CHECK (email_type IN ('install_reminder', 'activation_reminder')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint to prevent duplicate tracking entries
    UNIQUE(order_id, email_type, sent_at)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reminder_emails_order_type
ON esim_reminder_emails(order_id, email_type);

CREATE INDEX IF NOT EXISTS idx_reminder_emails_sent_at
ON esim_reminder_emails(sent_at DESC);

-- Add comment
COMMENT ON TABLE esim_reminder_emails IS 'Tracks eSIM reminder emails sent to users to prevent duplicate sends';
