-- =====================================================
-- LUMBUS AFFILIATE & REFERRAL SYSTEM
-- Migration: 001 - Core Tables
-- =====================================================
-- ⚠️ WARNING: This migration is REDUNDANT!
-- All tables defined here are already included in migration 000_complete_lumbus_schema.sql
-- This file is kept for reference only. DO NOT RUN THIS MIGRATION.
-- Only run migrations in this order: 000, then 002
-- =====================================================

-- ⚠️ DO NOT RUN - Already in 000_complete_lumbus_schema.sql ⚠️

/*

-- Extension for better random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. EXTEND USERS WITH REFERRAL CODE
-- =====================================================

-- Add referral columns to existing public.users
-- Fixed: Changed auth.users to public.users for consistency
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  ref_code TEXT UNIQUE NOT NULL,
  referred_by_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_ref_code CHECK (ref_code ~ '^[A-Z0-9]{8}$')
);

CREATE INDEX idx_user_profiles_ref_code ON public.user_profiles(ref_code);
CREATE INDEX idx_user_profiles_referred_by ON public.user_profiles(referred_by_code);

-- =====================================================
-- 2. AFFILIATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('PERCENT','FIXED')),
  commission_value NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]{3,50}$')
);

CREATE INDEX idx_affiliates_slug ON public.affiliates(slug);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_active ON public.affiliates(is_active) WHERE is_active = true;

-- =====================================================
-- 3. AFFILIATE CLICKS (Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ref_code TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  user_agent TEXT,
  ip_address INET,
  landing_path TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at DESC);
CREATE INDEX idx_clicks_ref_code ON public.affiliate_clicks(ref_code, created_at DESC);
CREATE INDEX idx_clicks_session ON public.affiliate_clicks(session_id);
CREATE INDEX idx_clicks_created ON public.affiliate_clicks(created_at DESC);

-- =====================================================
-- 4. EXTEND ORDERS TABLE
-- =====================================================

-- Add columns to existing orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Update existing orders to have amount_cents
-- (You'll need to populate this based on plan prices)

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at DESC) WHERE paid_at IS NOT NULL;

-- =====================================================
-- 5. ORDER ATTRIBUTION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_attributions (
  order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('AFFILIATE','REFERRAL','DIRECT')),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ref_code TEXT,
  click_id BIGINT REFERENCES public.affiliate_clicks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attributions_source ON public.order_attributions(source_type);
CREATE INDEX idx_attributions_affiliate ON public.order_attributions(affiliate_id);
CREATE INDEX idx_attributions_referrer ON public.order_attributions(referrer_user_id);

-- =====================================================
-- 6. AFFILIATE COMMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPROVED','PAID','VOID')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_commissions_affiliate_status ON public.affiliate_commissions(affiliate_id, status);
CREATE INDEX idx_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX idx_commissions_order ON public.affiliate_commissions(order_id);

-- =====================================================
-- 7. REFERRAL REWARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('FREE_DATA','DISCOUNT','CREDIT')),
  reward_value INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPLIED','EXPIRED','VOID')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_rewards_referrer_status ON public.referral_rewards(referrer_user_id, status);
CREATE INDEX idx_rewards_referred ON public.referral_rewards(referred_user_id);
CREATE INDEX idx_rewards_status ON public.referral_rewards(status);

-- =====================================================
-- 8. AFFILIATE PAYOUTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('WISE','PAYPAL','BANK','OTHER')),
  destination TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED','PROCESSING','PAID','FAILED')) DEFAULT 'CREATED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processing_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  notes TEXT,
  external_id TEXT
);

CREATE INDEX idx_payouts_affiliate ON public.affiliate_payouts(affiliate_id, created_at DESC);
CREATE INDEX idx_payouts_status ON public.affiliate_payouts(status);

-- =====================================================
-- 9. PAYOUT COMMISSION LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payout_commissions (
  payout_id UUID REFERENCES public.affiliate_payouts(id) ON DELETE CASCADE,
  commission_id UUID REFERENCES public.affiliate_commissions(id) ON DELETE CASCADE,
  PRIMARY KEY (payout_id, commission_id)
);

CREATE INDEX idx_payout_commissions_payout ON public.payout_commissions(payout_id);
CREATE INDEX idx_payout_commissions_commission ON public.payout_commissions(commission_id);

-- =====================================================
-- 10. FRAUD FLAGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('CLICK','ORDER','USER','AFFILIATE')),
  entity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_fraud_flags_entity ON public.fraud_flags(entity_type, entity_id);
CREATE INDEX idx_fraud_flags_unresolved ON public.fraud_flags(resolved) WHERE resolved = false;
CREATE INDEX idx_fraud_flags_created ON public.fraud_flags(created_at DESC);

-- =====================================================
-- 11. WEBHOOK IDEMPOTENCY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB
);

CREATE INDEX idx_webhook_idempotency_type ON public.webhook_idempotency(webhook_type);
CREATE INDEX idx_webhook_idempotency_processed ON public.webhook_idempotency(processed_at);

-- Auto-cleanup old entries (180 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_idempotency()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_idempotency
  WHERE processed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. ANALYTICS / STATS TABLE (optional, for caching)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.affiliate_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  commission_cents INTEGER DEFAULT 0,
  UNIQUE(affiliate_id, date)
);

CREATE INDEX idx_stats_affiliate_date ON public.affiliate_stats_daily(affiliate_id, date DESC);

-- =====================================================
-- 13. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Remove confusing chars (0,O,1,I)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ref_code on user profile creation
CREATE OR REPLACE FUNCTION ensure_ref_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  IF NEW.ref_code IS NULL OR NEW.ref_code = '' THEN
    LOOP
      new_code := generate_ref_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE ref_code = new_code);
      attempt := attempt + 1;
      EXIT WHEN attempt >= max_attempts;
    END LOOP;

    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique ref_code after % attempts', max_attempts;
    END IF;

    NEW.ref_code := new_code;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_ref_code
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_ref_code();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read their own profile
CREATE POLICY user_profiles_select_own ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- User Profiles: Users can update their own profile
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Affiliates: Anyone can read active affiliates (for public pages)
CREATE POLICY affiliates_select_active ON public.affiliates
  FOR SELECT USING (is_active = true);

-- Affiliates: Affiliates can read their own data
CREATE POLICY affiliates_select_own ON public.affiliates
  FOR SELECT USING (auth.uid() = user_id);

-- Affiliate Commissions: Affiliates can read their own commissions
CREATE POLICY commissions_select_own ON public.affiliate_commissions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- Referral Rewards: Users can read their own rewards
CREATE POLICY rewards_select_own ON public.referral_rewards
  FOR SELECT USING (
    referrer_user_id = auth.uid() OR referred_user_id = auth.uid()
  );

-- =====================================================
-- NOTE: Service role key (used in API routes via lib/db.ts) bypasses
-- ALL RLS policies automatically. No special policies are needed.
-- The policies above restrict access for regular users (anon/authenticated keys).
-- =====================================================

-- ❌ REMOVED DANGEROUS POLICIES THAT GRANTED FULL ACCESS TO ALL USERS:
-- These policies with USING (true) would allow ANY authenticated user
-- to access/modify ALL data, which is a critical security vulnerability.
--
-- DO NOT UNCOMMENT THESE:
-- CREATE POLICY service_role_all ON public.user_profiles FOR ALL USING (true);
-- CREATE POLICY service_role_all_affiliates ON public.affiliates FOR ALL USING (true);
-- CREATE POLICY service_role_all_clicks ON public.affiliate_clicks FOR ALL USING (true);
-- CREATE POLICY service_role_all_attributions ON public.order_attributions FOR ALL USING (true);
-- CREATE POLICY service_role_all_commissions ON public.affiliate_commissions FOR ALL USING (true);
-- CREATE POLICY service_role_all_rewards ON public.referral_rewards FOR ALL USING (true);
-- CREATE POLICY service_role_all_payouts ON public.affiliate_payouts FOR ALL USING (true);
-- CREATE POLICY service_role_all_fraud ON public.fraud_flags FOR ALL USING (true);

-- =====================================================
-- 15. INITIAL DATA / CONFIG
-- =====================================================

-- Create a config table for feature flags
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_config (key, value) VALUES
  ('AFFILIATE_COMMISSION_PCT', '12'),
  ('REFERRAL_GIVE_MB', '1024'),
  ('REFERRAL_FRIEND_DISCOUNT_PCT', '10'),
  ('ATTRIBUTION_LAST_TOUCH_DAYS', '14'),
  ('REFERRAL_MONTHLY_CAP', '10'),
  ('COMMISSION_LOCK_DAYS', '14'),
  ('MIN_COMMISSION_CENTS', '50')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- To run this migration:
-- 1. Connect to your Supabase project
-- 2. Run this SQL in the SQL Editor
-- 3. Verify all tables created: \dt public.*
-- =====================================================

*/

-- =====================================================
-- MIGRATION 001 IS DISABLED
-- All functionality is already in migration 000
-- Only run migrations: 000, then 002
-- =====================================================
