-- Add account deletion tracking fields to users table
-- This allows for soft deletion with a 30-day grace period

-- Add deleted_at column to track when deletion was requested
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_deletion_date TIMESTAMPTZ;

-- Create index for finding accounts scheduled for deletion
CREATE INDEX IF NOT EXISTS idx_users_scheduled_deletion
ON public.users(scheduled_deletion_date)
WHERE deleted_at IS NOT NULL;

-- Add comment explaining the deletion process
COMMENT ON COLUMN public.users.deleted_at IS 'Timestamp when user requested account deletion';
COMMENT ON COLUMN public.users.scheduled_deletion_date IS 'Date when account will be permanently deleted (30 days after request)';
