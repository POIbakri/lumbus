-- =====================================================
-- FIX FUNCTION SEARCH PATH SECURITY
-- =====================================================
-- This migration addresses security warnings from Supabase database linter
-- by setting an immutable search_path on all functions to prevent
-- search_path manipulation attacks
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- =====================================================

-- 1. Fix update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 2. Fix generate_ref_code function
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 3. Fix ensure_ref_code function
CREATE OR REPLACE FUNCTION ensure_ref_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 4. Fix cleanup_old_webhook_idempotency function
CREATE OR REPLACE FUNCTION cleanup_old_webhook_idempotency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.webhook_idempotency
  WHERE processed_at < NOW() - INTERVAL '180 days';
END;
$$;

-- 5. Fix validate_discount_code function
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_user_id UUID,
  OUT is_valid BOOLEAN,
  OUT discount_percent INTEGER,
  OUT error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 6. Fix increment_discount_code_usage function
CREATE OR REPLACE FUNCTION increment_discount_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = NEW.discount_code_id;

  RETURN NEW;
END;
$$;

-- 7. Fix update_discount_codes_updated_at function
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All 7 functions now have:
-- - SECURITY DEFINER: Runs with privileges of function owner
-- - SET search_path = public: Locks search_path to prevent attacks
--
-- This prevents search_path manipulation attacks where malicious users
-- could create tables/functions in their own schema to hijack function calls
-- =====================================================
