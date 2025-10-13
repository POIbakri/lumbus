# 🚨 CRITICAL SECURITY VULNERABILITY - MUST FIX BEFORE PRODUCTION

**Date**: 2025-10-13
**Severity**: CRITICAL 🔴
**Status**: UNFIXED - BLOCKS PRODUCTION DEPLOYMENT

---

## Summary

The database migration (`supabase/migrations/001_affiliate_referral_system.sql`) contains **DANGEROUS RLS POLICIES** that would grant unrestricted access to all authenticated users.

## The Problem

Lines 356-378 create RLS policies with `USING (true)`:

```sql
-- Service role can do everything (for API)
CREATE POLICY service_role_all ON public.user_profiles
  FOR ALL USING (true);

CREATE POLICY service_role_all_affiliates ON public.affiliates
  FOR ALL USING (true);

CREATE POLICY service_role_all_clicks ON public.affiliate_clicks
  FOR ALL USING (true);

CREATE POLICY service_role_all_attributions ON public.order_attributions
  FOR ALL USING (true);

CREATE POLICY service_role_all_commissions ON public.affiliate_commissions
  FOR ALL USING (true);

CREATE POLICY service_role_all_rewards ON public.referral_rewards
  FOR ALL USING (true);

CREATE POLICY service_role_all_payouts ON public.affiliate_payouts
  FOR ALL USING (true);

CREATE POLICY service_role_all_fraud ON public.fraud_flags
  FOR ALL USING (true);
```

## Why This Is Critical

1. **`USING (true)` = Anyone Can Access**: These policies allow ANY authenticated user (anyone with a login) to:
   - Read ALL affiliate data (including commissions)
   - Modify ANY user's referral rewards
   - See ALL fraud flags
   - Access ALL commission records
   - Delete ANY affiliate account

2. **Misunderstanding of Service Role**:
   - The Supabase **service role key BYPASSES ALL RLS policies** automatically
   - You don't need policies for the service role
   - These policies actually grant access to REGULAR USERS, not just the service role

3. **Attack Vector**:
   ```javascript
   // Any authenticated user could do this:
   const supabase = createClient(url, anonKey); // Regular client
   await supabase.auth.signInWithPassword({email, password});

   // Now they can access EVERYTHING:
   const { data: allCommissions } = await supabase
     .from('affiliate_commissions')
     .select('*'); // Returns ALL commissions from ALL affiliates!

   const { data: allRewards } = await supabase
     .from('referral_rewards')
     .select('*'); // Returns ALL rewards from ALL users!

   // They can even DELETE:
   await supabase
     .from('affiliates')
     .delete()
     .eq('id', 'some-affiliate-id'); // Would succeed!
   ```

## Impact

If this migration is deployed:
- **ANY authenticated user** can view all affiliate commissions (financial data leak)
- **ANY authenticated user** can modify or delete affiliate records
- **ANY authenticated user** can view all referral rewards
- **ANY authenticated user** can see ALL fraud flags (including ongoing investigations)
- **Complete loss of data privacy and security**

## The Fix

**DELETE THESE DANGEROUS POLICIES**. The service role key doesn't need them, and they expose your entire database to regular users.

### Fixed Migration (Lines 355-378 should be REMOVED or COMMENTED OUT):

```sql
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

-- ❌ REMOVE THESE DANGEROUS POLICIES:
-- CREATE POLICY service_role_all ON public.user_profiles FOR ALL USING (true);
-- CREATE POLICY service_role_all_affiliates ON public.affiliates FOR ALL USING (true);
-- CREATE POLICY service_role_all_clicks ON public.affiliate_clicks FOR ALL USING (true);
-- CREATE POLICY service_role_all_attributions ON public.order_attributions FOR ALL USING (true);
-- CREATE POLICY service_role_all_commissions ON public.affiliate_commissions FOR ALL USING (true);
-- CREATE POLICY service_role_all_rewards ON public.referral_rewards FOR ALL USING (true);
-- CREATE POLICY service_role_all_payouts ON public.affiliate_payouts FOR ALL USING (true);
-- CREATE POLICY service_role_all_fraud ON public.fraud_flags FOR ALL USING (true);

-- NOTE: Service role key in lib/db.ts bypasses ALL RLS automatically.
-- No special policies are needed for the service role.
```

## How Supabase RLS Actually Works

1. **Service Role Key** (`lib/db.ts`):
   ```typescript
   export const supabase = createClient(url, serviceRoleKey);
   // ☑️ Bypasses ALL RLS policies
   // ☑️ Has full database access
   // ☑️ Used by API routes
   ```

2. **Anon/Authenticated Keys** (client-side):
   ```typescript
   export const supabaseClient = createClient(url, anonKey);
   // ✅ Subject to RLS policies
   // ✅ Only sees data allowed by policies
   // ✅ Used by frontend
   ```

3. **Your API routes already use service role key**, so they have full access without needing policies.

4. **Your frontend uses anon key**, so it should only see data explicitly allowed by policies.

## Current Status

The codebase in `lib/db.ts` IS using the service role key:
```typescript
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '...';
export const supabase = createClient(supabaseUrl, supabaseKey);
```

This is CORRECT for API routes. But the RLS policies are WRONG.

## Immediate Actions Required

1. ✅ **DO NOT run the current migration in production**
2. ✅ **Remove lines 356-378 from the migration file**
3. ✅ **If already deployed, run this SQL to fix**:
   ```sql
   DROP POLICY IF EXISTS service_role_all ON public.user_profiles;
   DROP POLICY IF EXISTS service_role_all_affiliates ON public.affiliates;
   DROP POLICY IF EXISTS service_role_all_clicks ON public.affiliate_clicks;
   DROP POLICY IF EXISTS service_role_all_attributions ON public.order_attributions;
   DROP POLICY IF EXISTS service_role_all_commissions ON public.affiliate_commissions;
   DROP POLICY IF EXISTS service_role_all_rewards ON public.referral_rewards;
   DROP POLICY IF EXISTS service_role_all_payouts ON public.affiliate_payouts;
   DROP POLICY IF EXISTS service_role_all_fraud ON public.fraud_flags;
   ```

## Why This Wasn't Caught Earlier

- The code builds successfully because it's valid SQL
- The application works in development
- The vulnerability only becomes apparent when analyzing RLS policies
- Service role key in API routes bypasses RLS, so API routes work fine
- Frontend would need to use anon key to expose the vulnerability

## Testing the Fix

After fixing, test that:
1. API routes still work (they use service role key, bypasses RLS)
2. Frontend can only access user's own data
3. Users cannot read other users' commissions/rewards
4. Users cannot modify affiliate records they don't own

---

**This issue MUST be fixed before any production deployment.**

**Estimated Fix Time**: 5 minutes (delete 23 lines from migration)
**Risk if Not Fixed**: Complete database security breach
**Priority**: P0 - BLOCKS PRODUCTION
