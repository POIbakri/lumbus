-- =====================================================
-- DISCOUNT CODES SYSTEM
-- =====================================================
-- Allows admin to create promotional discount codes with various percentages
-- Supports 10%, 20%, 30%, 40%, 50%, and 100% discounts
-- Tracks usage limits, expiry dates, and active status

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Code identification
  code TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Discount configuration
  discount_percent INTEGER NOT NULL CHECK (discount_percent IN (10, 20, 30, 40, 50, 100)),

  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1, -- How many times one user can use this code

  -- Time constraints
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL = no expiry

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast code lookup
CREATE INDEX idx_discount_codes_code ON discount_codes(code) WHERE is_active = true;
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, valid_from, valid_until);

-- Track discount code usage per order
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  discount_percent INTEGER NOT NULL,
  original_price_usd DECIMAL(10, 2) NOT NULL,
  discount_amount_usd DECIMAL(10, 2) NOT NULL,
  final_price_usd DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(order_id) -- One discount code per order
);

-- Index for usage tracking
CREATE INDEX idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX idx_discount_usage_user ON discount_code_usage(user_id);
CREATE INDEX idx_discount_usage_order ON discount_code_usage(order_id);

-- Function to validate and apply discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_user_id UUID,
  OUT is_valid BOOLEAN,
  OUT discount_percent INTEGER,
  OUT error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_code RECORD;
  v_user_usage_count INTEGER;
BEGIN
  -- Default values
  is_valid := false;
  discount_percent := 0;
  error_message := NULL;

  -- Find the code
  SELECT * INTO v_code
  FROM discount_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true;

  -- Check if code exists
  IF NOT FOUND THEN
    error_message := 'Invalid discount code';
    RETURN;
  END IF;

  -- Check if code has started
  IF v_code.valid_from > NOW() THEN
    error_message := 'This discount code is not yet valid';
    RETURN;
  END IF;

  -- Check if code has expired
  IF v_code.valid_until IS NOT NULL AND v_code.valid_until < NOW() THEN
    error_message := 'This discount code has expired';
    RETURN;
  END IF;

  -- Check max global uses
  IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
    error_message := 'This discount code has reached its usage limit';
    RETURN;
  END IF;

  -- Check per-user usage limit
  SELECT COUNT(*) INTO v_user_usage_count
  FROM discount_code_usage
  WHERE discount_code_id = v_code.id
    AND user_id = p_user_id;

  IF v_code.max_uses_per_user IS NOT NULL AND v_user_usage_count >= v_code.max_uses_per_user THEN
    error_message := 'You have already used this discount code';
    RETURN;
  END IF;

  -- All checks passed
  is_valid := true;
  discount_percent := v_code.discount_percent;
  error_message := NULL;
END;
$$;

-- Function to increment discount code usage
CREATE OR REPLACE FUNCTION increment_discount_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = NEW.discount_code_id;

  RETURN NEW;
END;
$$;

-- Trigger to auto-increment usage counter
CREATE TRIGGER trigger_increment_discount_usage
AFTER INSERT ON discount_code_usage
FOR EACH ROW
EXECUTE FUNCTION increment_discount_code_usage();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_discount_codes_updated_at
BEFORE UPDATE ON discount_codes
FOR EACH ROW
EXECUTE FUNCTION update_discount_codes_updated_at();

-- =====================================================
-- SAMPLE DISCOUNT CODES (for testing - remove in production)
-- =====================================================

-- Uncomment below to create sample codes:
-- INSERT INTO discount_codes (code, description, discount_percent, max_uses) VALUES
-- ('WELCOME10', '10% off for new customers', 10, NULL),
-- ('SUMMER20', '20% off summer sale', 20, 1000),
-- ('VIP50', '50% off VIP discount', 50, 100),
-- ('FREESIM', '100% off - Free eSIM', 100, 10);

COMMENT ON TABLE discount_codes IS 'Admin-created promotional discount codes';
COMMENT ON TABLE discount_code_usage IS 'Tracks which orders used which discount codes';
COMMENT ON FUNCTION validate_discount_code IS 'Validates a discount code and returns discount percentage if valid';
