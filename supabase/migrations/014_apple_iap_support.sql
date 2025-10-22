-- =====================================================
-- APPLE IAP SUPPORT MIGRATION
-- Adds required fields for Apple In-App Purchase integration
-- =====================================================

-- Add payment method tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IN ('stripe', 'apple_iap', 'google_play'));

-- Add Apple IAP specific fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_product_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_receipt_data TEXT;

-- Add Google Play IAP fields (for future Android IAP support)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS google_purchase_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS google_order_id TEXT,
  ADD COLUMN IF NOT EXISTS google_product_id TEXT;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_method
  ON public.orders(payment_method);

CREATE INDEX IF NOT EXISTS idx_orders_apple_transaction_id
  ON public.orders(apple_transaction_id)
  WHERE apple_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_google_purchase_token
  ON public.orders(google_purchase_token)
  WHERE google_purchase_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used: stripe (web/mobile), apple_iap (iOS), google_play (Android)';
COMMENT ON COLUMN public.orders.apple_transaction_id IS 'Apple transaction ID from App Store receipt';
COMMENT ON COLUMN public.orders.apple_original_transaction_id IS 'Apple original transaction ID for subscription tracking';
COMMENT ON COLUMN public.orders.apple_product_id IS 'Apple product ID (e.g., com.lumbus.esim.usa_1gb)';
COMMENT ON COLUMN public.orders.apple_receipt_data IS 'Base64 encoded Apple receipt for validation';
COMMENT ON COLUMN public.orders.google_purchase_token IS 'Google Play purchase token for verification';
COMMENT ON COLUMN public.orders.google_order_id IS 'Google Play order ID';
COMMENT ON COLUMN public.orders.google_product_id IS 'Google Play product/SKU ID';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration adds support for:
-- 1. Apple IAP (In-App Purchases) for iOS
-- 2. Google Play IAP for Android (future)
-- 3. Payment method tracking for all platforms
-- =====================================================
