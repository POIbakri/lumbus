-- =====================================================
-- LUMBUS COMPLETE DATABASE SCHEMA
-- Production-Ready Migration for Supabase
-- =====================================================
-- This file contains the complete schema for the Lumbus eSIM platform
-- including: Users, Plans, Orders, Affiliates, Referrals, Data Wallet, and more
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CORE TABLES: USERS, PLANS, ORDERS
-- =====================================================

-- Users table (integrates with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    data_gb DECIMAL(10, 2) NOT NULL,
    validity_days INTEGER NOT NULL,
    supplier_sku VARCHAR(255) NOT NULL UNIQUE,
    retail_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_region ON public.plans(region_code);
CREATE INDEX idx_plans_active ON public.plans(is_active) WHERE is_active = true;
CREATE INDEX idx_plans_sku ON public.plans(supplier_sku);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'provisioning', 'completed', 'failed')),
    stripe_session_id VARCHAR(255) UNIQUE,
    connect_order_id VARCHAR(255) UNIQUE,
    qr_url TEXT,
    smdp VARCHAR(255),
    activation_code VARCHAR(255),
    amount_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    paid_at TIMESTAMPTZ,
    country_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_stripe_session ON public.orders(stripe_session_id);
CREATE INDEX idx_orders_connect_order ON public.orders(connect_order_id);
CREATE INDEX idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX idx_orders_paid_at ON public.orders(paid_at DESC) WHERE paid_at IS NOT NULL;

-- =====================================================
-- 2. USER PROFILES & REFERRAL CODES
-- =====================================================

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
-- 3. AFFILIATES SYSTEM
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
-- 4. AFFILIATE CLICKS (Tracking)
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
CREATE INDEX idx_clicks_ip ON public.affiliate_clicks(ip_address);

-- =====================================================
-- 5. ORDER ATTRIBUTION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_attributions (
  order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('AFFILIATE','REFERRAL','DIRECT')),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referrer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ref_code TEXT,
  click_id BIGINT REFERENCES public.affiliate_clicks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attributions_source ON public.order_attributions(source_type);
CREATE INDEX idx_attributions_affiliate ON public.order_attributions(affiliate_id);
CREATE INDEX idx_attributions_referrer ON public.order_attributions(referrer_user_id);
CREATE INDEX idx_attributions_click ON public.order_attributions(click_id);

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
CREATE INDEX idx_commissions_created ON public.affiliate_commissions(created_at DESC);

-- =====================================================
-- 7. REFERRAL REWARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_rewards_order ON public.referral_rewards(order_id);
CREATE INDEX idx_rewards_created ON public.referral_rewards(created_at DESC);

-- =====================================================
-- 8. DATA WALLET SYSTEM
-- =====================================================

-- User data wallet for storing data credits
CREATE TABLE IF NOT EXISTS public.user_data_wallet (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance_mb INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_balance ON public.user_data_wallet(balance_mb DESC);

-- Wallet transactions log
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CREDIT','DEBIT')),
  amount_mb INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('REFERRAL_REWARD','PURCHASE','REFUND','ADMIN','PROMO')),
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_tx_source ON public.wallet_transactions(source, source_id);
CREATE INDEX idx_wallet_tx_created ON public.wallet_transactions(created_at DESC);

-- =====================================================
-- 9. AFFILIATE PAYOUTS
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
-- 10. PAYOUT COMMISSION LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payout_commissions (
  payout_id UUID REFERENCES public.affiliate_payouts(id) ON DELETE CASCADE,
  commission_id UUID REFERENCES public.affiliate_commissions(id) ON DELETE CASCADE,
  PRIMARY KEY (payout_id, commission_id)
);

CREATE INDEX idx_payout_commissions_payout ON public.payout_commissions(payout_id);
CREATE INDEX idx_payout_commissions_commission ON public.payout_commissions(commission_id);

-- =====================================================
-- 11. FRAUD DETECTION
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
CREATE INDEX idx_fraud_flags_severity ON public.fraud_flags(severity);

-- =====================================================
-- 12. WEBHOOK IDEMPOTENCY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB
);

CREATE INDEX idx_webhook_idempotency_type ON public.webhook_idempotency(webhook_type);
CREATE INDEX idx_webhook_idempotency_processed ON public.webhook_idempotency(processed_at);

-- =====================================================
-- 13. WEBHOOK EVENTS LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_provider_type ON public.webhook_events(provider, event_type);
CREATE INDEX idx_webhook_processed ON public.webhook_events(processed_at);
CREATE INDEX idx_webhook_created ON public.webhook_events(created_at DESC);

-- =====================================================
-- 14. ANALYTICS / STATS TABLE
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
CREATE INDEX idx_stats_date ON public.affiliate_stats_daily(date DESC);

-- =====================================================
-- 15. SYSTEM CONFIG
-- =====================================================

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
-- 16. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_wallet_updated_at
  BEFORE UPDATE ON public.user_data_wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

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

-- Auto-cleanup old webhook idempotency entries (180 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_idempotency()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_idempotency
  WHERE processed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables that need user-level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own record
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

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

-- Data Wallet: Users can read their own wallet
CREATE POLICY wallet_select_own ON public.user_data_wallet
  FOR SELECT USING (auth.uid() = user_id);

-- Wallet Transactions: Users can read their own transactions
CREATE POLICY wallet_tx_select_own ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Orders: Users can read their own orders
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- NOTE: Service role key (used in API routes via lib/db.ts) bypasses
-- ALL RLS policies automatically. No special policies are needed.
-- The policies above restrict access for regular users (anon/authenticated keys).
-- =====================================================

-- =====================================================
-- 18. SAMPLE DATA (Optional - Remove in production)
-- =====================================================

-- Sample plans
INSERT INTO public.plans (name, region_code, data_gb, validity_days, supplier_sku, retail_price, currency) VALUES
('Japan 5GB - 30 Days', 'JP', 5, 30, '1GLOBAL_JP_5GB_30D', 19.99, 'USD'),
('Europe 10GB - 30 Days', 'EU', 10, 30, '1GLOBAL_EU_10GB_30D', 29.99, 'USD'),
('USA 5GB - 30 Days', 'US', 5, 30, '1GLOBAL_US_5GB_30D', 24.99, 'USD'),
('Global 3GB - 7 Days', 'GLOBAL', 3, 7, '1GLOBAL_GLOBAL_3GB_7D', 14.99, 'USD'),
('Asia 8GB - 14 Days', 'ASIA', 8, 14, '1GLOBAL_ASIA_8GB_14D', 22.99, 'USD'),
('UK 10GB - 30 Days', 'UK', 10, 30, '1GLOBAL_UK_10GB_30D', 27.99, 'USD')
ON CONFLICT (supplier_sku) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- To deploy this migration to Supabase:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Run the migration
-- 5. Verify all tables are created: \dt public.*
-- =====================================================

-- =====================================================
-- ENVIRONMENT VARIABLES REQUIRED
-- =====================================================
-- Add these to your .env.local file:
--
-- # Supabase
-- NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
--
-- # Stripe
-- STRIPE_SECRET_KEY=your_stripe_secret_key
-- STRIPE_WEBHOOK_SECRET=your_webhook_secret
-- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
--
-- # 1GLOBAL
-- ONEGLOBAL_API_URL=https://connect.1global.com/api/v1
-- ONEGLOBAL_API_KEY=your_1global_api_key
-- ONEGLOBAL_WEBHOOK_SECRET=your_webhook_secret
--
-- # Admin Auth
-- ADMIN_USERNAME=admin
-- ADMIN_PASSWORD_HASH=your_bcrypt_hash
--
-- # Cron
-- CRON_SECRET=your_secret_token
--
-- # App
-- NEXT_PUBLIC_APP_URL=http://localhost:3000
-- =====================================================
