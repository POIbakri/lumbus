-- =====================================================
-- 020 - Flag Reviewer Accounts as Test Users
-- =====================================================
-- Marks the specific App Store / Play Store reviewer accounts
-- to use Stripe TEST mode automatically.
-- =====================================================

UPDATE public.users
SET is_test_user = TRUE
WHERE email IN ('android@getlumbus.com', 'apple@getlumbus.com');

-- Also update any future users with these emails if they sign up later
-- (This is handled by the default FALSE on the column, but good to
-- allow manual updates if they are deleted/recreated)

