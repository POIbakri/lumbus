-- App Events Table for Mobile Analytics
-- Tracks app installs, opens, and other mobile events

CREATE TABLE IF NOT EXISTS app_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_type VARCHAR(50) NOT NULL,  -- 'first_open', 'app_open', 'signup', etc.

  -- Device identification (anonymous until user signs in)
  device_id VARCHAR(255) NOT NULL,  -- Unique device identifier from mobile app
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Linked after signup/login

  -- Device info
  platform VARCHAR(20) NOT NULL,  -- 'ios' or 'android'
  app_version VARCHAR(20),
  os_version VARCHAR(50),
  device_model VARCHAR(100),

  -- Attribution
  install_source VARCHAR(100),  -- 'app_store', 'play_store', 'testflight', etc.
  campaign VARCHAR(255),  -- UTM campaign or ad campaign ID

  -- Location (optional, from IP or device)
  country_code VARCHAR(2),

  -- Additional data
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When event occurred on device
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- When received by server
);

-- Indexes for common queries
CREATE INDEX idx_app_events_event_type ON app_events(event_type);
CREATE INDEX idx_app_events_device_id ON app_events(device_id);
CREATE INDEX idx_app_events_user_id ON app_events(user_id);
CREATE INDEX idx_app_events_platform ON app_events(platform);
CREATE INDEX idx_app_events_created_at ON app_events(created_at);
CREATE INDEX idx_app_events_event_timestamp ON app_events(event_timestamp);

-- Composite index for analytics queries (event_type + timestamp)
CREATE INDEX idx_app_events_type_timestamp ON app_events(event_type, event_timestamp);

-- Comments
COMMENT ON TABLE app_events IS 'Mobile app analytics events (installs, opens, etc.)';
COMMENT ON COLUMN app_events.event_type IS 'Type of event: first_open, app_open, signup, purchase, etc.';
COMMENT ON COLUMN app_events.device_id IS 'Unique device identifier (IDFV on iOS, Android ID on Android)';
