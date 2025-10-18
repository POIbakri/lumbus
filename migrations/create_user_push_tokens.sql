-- Migration: Create user_push_tokens table
-- Purpose: Store Expo push notification tokens for mobile app users
-- Date: 2025-10-18

-- Create user_push_tokens table
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  -- Ensure one token per user
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id
  ON user_push_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform
  ON user_push_tokens(platform);

-- Add comments for documentation
COMMENT ON TABLE user_push_tokens IS 'Stores Expo push notification tokens for mobile app users';
COMMENT ON COLUMN user_push_tokens.user_id IS 'Reference to auth.users - the user who owns this token';
COMMENT ON COLUMN user_push_tokens.push_token IS 'Expo push token (format: ExponentPushToken[xxx])';
COMMENT ON COLUMN user_push_tokens.platform IS 'Mobile platform: ios or android';
COMMENT ON COLUMN user_push_tokens.created_at IS 'When the token was first registered';
COMMENT ON COLUMN user_push_tokens.updated_at IS 'When the token was last updated';

-- Enable Row Level Security (RLS)
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own push tokens
CREATE POLICY "Users can view their own push tokens"
  ON user_push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON user_push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON user_push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON user_push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO authenticated;
GRANT SELECT ON user_push_tokens TO service_role;
