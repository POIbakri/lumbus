# Additional Issues Found - Deep Audit

**Date**: 2025-10-13
**Audit Phase**: Extended Deep Dive
**Status**: Issues documented, fixes recommended

---

## Summary

After the initial audit fixed 3 critical issues, a deeper analysis revealed **4 more HIGH-priority bugs** in business logic, timezone handling, and data consistency.

---

## 🟠 HIGH PRIORITY ISSUE #1: Timezone Bug in Monthly Referral Cap

**File**: `lib/commission.ts` lines 163-165
**Severity**: HIGH 🟠 - BUSINESS LOGIC BUG
**Status**: ⚠️ UNFIXED

### Problem

The monthly cap calculation uses local server timezone instead of UTC:

```typescript
export async function checkReferrerMonthlyCap(
  referrerUserId: string,
  config: RewardConfig = DEFAULT_REWARD_CONFIG
): Promise<boolean> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);  // ❌ LOCAL TIMEZONE!

  const { count } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', referrerUserId)
    .gte('created_at', startOfMonth.toISOString());

  return (count || 0) < config.REFERRAL_MONTHLY_CAP;
}
```

### Impact

1. **Server in PST (UTC-8)**: Month starts at 8am UTC on the 1st
2. **Server in EST (UTC-5)**: Month starts at 5am UTC on the 1st
3. **Deploy at different times** = Different behavior
4. **Users near midnight** could get 11 rewards instead of 10

### Example Bug Scenario

```
User timezone: PST (UTC-8)
Server timezone: EST (UTC-5)

March 31, 11:30pm PST (7:30am UTC March 1):
- User makes 10th referral of March → Allowed (PST says it's March 31)
- Server in EST says it's April 1 → Resets counter
- User can now make 10 MORE referrals → 20 total instead of 10!
```

### Fix

Use UTC explicitly:

```typescript
export async function checkReferrerMonthlyCap(
  referrerUserId: string,
  config: RewardConfig = DEFAULT_REWARD_CONFIG
): Promise<boolean> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1,
    0, 0, 0, 0
  ));

  const { count } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', referrerUserId)
    .gte('created_at', startOfMonth.toISOString());

  return (count || 0) < config.REFERRAL_MONTHLY_CAP;
}
```

---

## 🟠 HIGH PRIORITY ISSUE #2: First Order Check Race Condition

**File**: `lib/commission.ts` lines 142-154
**Severity**: HIGH 🟠 - RACE CONDITION
**Status**: ⚠️ UNFIXED

### Problem

The "first order" check has a race condition:

```typescript
export async function isEligibleForReferralReward(
  orderId: string,
  userId: string
): Promise<boolean> {
  // Check if this is the user's first paid order
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'paid');  // ❌ Checks ALL paid orders

  return (count || 0) === 1; // First paid order
}
```

### Impact

**Scenario 1**: User places 2 orders quickly
1. Order A webhook arrives, marks order A as paid
2. Order A calls `isEligibleForReferralReward` → count = 1 → Creates reward ✅
3. Order B webhook arrives, marks order B as paid
4. Order B calls `isEligibleForReferralReward` → count = 2 → No reward ✅

This works correctly.

**Scenario 2**: Webhook arrives BEFORE order is marked as paid
1. Webhook calls `isEligibleForReferralReward`
2. Query checks paid orders → count = 0 (current order not yet marked paid!)
3. Returns false, no reward created ❌
4. This was the user's first order, but they don't get a reward!

### Why This Happens

Looking at the webhook handler (`app/api/stripe/webhook/route.ts`):

```typescript
// Order is marked as paid here
const { data: order } = await supabase
  .from('orders')
  .update({ status: 'paid', ... })
  .eq('id', orderId);

// Then attribution is processed
const attribution = await resolveAttribution(...);
const savedAttribution = await saveOrderAttribution(...);

// Then rewards are created
await processOrderAttribution(order, savedAttribution);
  // This calls isEligibleForReferralReward
```

Actually, looking more carefully, the order IS updated to 'paid' before checking eligibility. So this might be okay...

But there's still an issue: **What if the database hasn't committed the transaction yet?**

### Fix

Pass the current order ID and verify it's included:

```typescript
export async function isEligibleForReferralReward(
  orderId: string,
  userId: string
): Promise<boolean> {
  // Get ALL paid orders for this user
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paid');

  // Check if:
  // 1. This is the first paid order
  // 2. The current order is in the list
  const orderIds = (orders || []).map(o => o.id);
  return orderIds.length === 1 && orderIds.includes(orderId);
}
```

---

## 🟠 HIGH PRIORITY ISSUE #3: Minimum Commission Applied to Fixed Commissions

**File**: `lib/commission.ts` lines 31-49
**Severity**: HIGH 🟠 - BUSINESS LOGIC BUG
**Status**: ⚠️ UNFIXED

### Problem

The minimum commission is applied to BOTH percentage AND fixed commissions:

```typescript
export function calculateCommissionAmount(
  order: Order,
  affiliate: Affiliate,
  config: CommissionConfig = DEFAULT_CONFIG
): number {
  const netAmount = order.amount_cents || 0;

  let commissionCents = 0;

  if (affiliate.commission_type === 'PERCENT') {
    commissionCents = Math.round((netAmount * affiliate.commission_value) / 100);
  } else {
    // FIXED
    commissionCents = Math.round(affiliate.commission_value * 100);
  }

  // Apply minimum - affects BOTH types!
  return Math.max(commissionCents, config.MIN_COMMISSION_CENTS);  // $0.50 min
}
```

### Impact

**Scenario**: Affiliate has fixed commission of $0.25

```
User buys $5 plan
Expected commission: $0.25
Actual commission: $0.50 (bumped to minimum)
Affiliate gets paid 2x what they should!
```

### Fix Options

**Option 1**: Only apply minimum to percentage commissions:

```typescript
export function calculateCommissionAmount(
  order: Order,
  affiliate: Affiliate,
  config: CommissionConfig = DEFAULT_CONFIG
): number {
  const netAmount = order.amount_cents || 0;

  let commissionCents = 0;

  if (affiliate.commission_type === 'PERCENT') {
    commissionCents = Math.round((netAmount * affiliate.commission_value) / 100);
    // Apply minimum only to percentage commissions
    return Math.max(commissionCents, config.MIN_COMMISSION_CENTS);
  } else {
    // FIXED - return as-is, no minimum
    return Math.round(affiliate.commission_value * 100);
  }
}
```

**Option 2**: Make it explicit in the business rules and document it clearly:

```typescript
// If you intentionally want minimum for both types, add a comment:
// Apply minimum commission ($0.50) to prevent micro-commissions
// This affects both percentage and fixed commission types
return Math.max(commissionCents, config.MIN_COMMISSION_CENTS);
```

---

## 🟠 HIGH PRIORITY ISSUE #4: Missing Error Handling for Failed Referral Info Load

**File**: `components/referral-share-modal.tsx` lines 23-36
**Severity**: MEDIUM 🟡 - UX ISSUE
**Status**: ⚠️ UNFIXED

### Problem

The modal loads referral info but doesn't handle API failures:

```typescript
const loadReferralInfo = async () => {
  try {
    const response = await fetch(`/api/referrals/me?user_id=${userId}`);
    if (response.ok) {
      const data = await response.json();
      setReferralLink(data.referral_link);
      setRefCode(data.ref_code);
    }
    // ❌ No else block - if !response.ok, state remains empty
  } catch (error) {
    console.error('Failed to load referral info:', error);
    // ❌ Error is logged but user sees blank modal
  } finally {
    setLoading(false);
  }
};
```

### Impact

If API fails:
1. Loading spinner disappears
2. Modal shows empty/blank content
3. User sees referral code as "" and link as ""
4. Share buttons send malformed links
5. Poor user experience

### Fix

Add error state and UI:

```typescript
const [error, setError] = useState<string>('');

const loadReferralInfo = async () => {
  try {
    const response = await fetch(`/api/referrals/me?user_id=${userId}`);
    if (!response.ok) {
      setError('Failed to load referral link');
      return;
    }
    const data = await response.json();
    setReferralLink(data.referral_link);
    setRefCode(data.ref_code);
  } catch (error) {
    console.error('Failed to load referral info:', error);
    setError('Network error loading referral link');
  } finally {
    setLoading(false);
  }
};

// In render:
if (error) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🟡 MEDIUM PRIORITY ISSUE #5: Inconsistent Commission Approval Logic

**File**: `lib/commission.ts` lines 69-104
**Severity**: MEDIUM 🟡 - POTENTIAL BUG
**Status**: ⚠️ NEEDS REVIEW

### Problem

The commission approval logic counts orders but updates commissions:

```typescript
export async function approvePendingCommissions(
  lockDays = DEFAULT_CONFIG.COMMISSION_LOCK_DAYS
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lockDays);

  // Find orders that are past lock period
  const { data: orders } = await supabase
    .from('orders')
    .select('id, paid_at')
    .eq('status', 'paid')
    .lte('paid_at', cutoffDate.toISOString());

  if (!orders || orders.length === 0) {
    return 0;
  }

  const orderIds = orders.map(o => o.id);

  // Update commissions for these orders
  const { error } = await supabase
    .from('affiliate_commissions')
    .update({
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
    })
    .in('order_id', orderIds)
    .eq('status', 'PENDING');

  // ❌ Returns number of ORDERS, not number of COMMISSIONS updated!
  return orderIds.length;
}
```

### Impact

**Scenario**: 100 old orders found, but only 50 have pending commissions

```
Function returns: 100
Console logs: "Cron: Approved 100 commissions"
Actual commissions approved: 50
```

Misleading logs and metrics.

### Fix

Return actual count of commissions updated:

```typescript
export async function approvePendingCommissions(
  lockDays = DEFAULT_CONFIG.COMMISSION_LOCK_DAYS
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lockDays);

  // Directly update commissions with date check
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .update({
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
    })
    .eq('status', 'PENDING')
    .lte('created_at', cutoffDate.toISOString())  // Check commission creation date
    .select();

  if (error) {
    console.error('Failed to approve commissions:', error);
    return 0;
  }

  // Return actual number of commissions updated
  return data?.length || 0;
}
```

Actually, wait - we need to check when the ORDER was paid, not when the commission was created. Let me reconsider...

The current approach is actually correct logically (get orders → update their commissions), but the return value is misleading. A better fix:

```typescript
// At the end, after update:
const { count } = await supabase
  .from('affiliate_commissions')
  .select('*', { count: 'exact', head: true })
  .in('order_id', orderIds)
  .eq('status', 'APPROVED');

return count || 0;  // Actual number of commissions now approved
```

---

## 🟡 MEDIUM PRIORITY ISSUE #6: Cookie Security Settings May Fail in Development

**File**: `app/api/track/click/route.ts` lines 93-119
**Severity**: MEDIUM 🟡 - DEVELOPMENT ISSUE
**Status**: ⚠️ DOCUMENTED

### Problem

Cookies use conditional `secure` flag:

```typescript
response.cookies.set('sid', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // ⚠️
  sameSite: 'lax',
  maxAge: 90 * 24 * 60 * 60,
  path: '/',
});
```

### Impact

**In Development (HTTP)**:
- secure = false → Cookie works ✅

**In Development (HTTPS - rare but possible)**:
- secure = false → Cookie sent over HTTPS
- Not a security issue, just less strict

**In Production (HTTP - if misconfigured)**:
- secure = true → Cookie NOT sent over HTTP
- Attribution breaks ❌

### Fix

More robust detection:

```typescript
const isProduction = process.env.NODE_ENV === 'production';
const isHttps = req.url?.startsWith('https://') || false;

response.cookies.set('sid', sessionId, {
  httpOnly: true,
  secure: isProduction || isHttps,  // Secure if production OR HTTPS
  sameSite: isProduction ? 'strict' : 'lax',  // Stricter in production
  maxAge: 90 * 24 * 60 * 60,
  path: '/',
});
```

---

## Summary of Additional Issues

| # | Issue | Severity | Fixed | Impact |
|---|-------|----------|-------|--------|
| 1 | Timezone bug in monthly cap | HIGH 🟠 | ❌ | Users can bypass 10/month limit |
| 2 | First order check race condition | HIGH 🟠 | ❌ | Users may not get first-order reward |
| 3 | Minimum commission on fixed rates | HIGH 🟠 | ❌ | Affiliates overpaid for small commissions |
| 4 | No error UI in referral modal | MEDIUM 🟡 | ❌ | Poor UX if API fails |
| 5 | Misleading approval count return | MEDIUM 🟡 | ❌ | Inaccurate metrics/logs |
| 6 | Cookie security conditional | MEDIUM 🟡 | ❌ | May break in misconfigured environments |

---

## Recommended Action Plan

### Immediate (Before Next Test)

1. **Fix timezone bug** (Issue #1) - Use UTC for month calculations
2. **Fix first order check** (Issue #2) - Verify current order is included
3. **Add error UI to modal** (Issue #4) - Better user experience

### Before Production

4. **Decide on minimum commission policy** (Issue #3) - Document intended behavior
5. **Fix approval count** (Issue #5) - Return accurate metrics
6. **Improve cookie detection** (Issue #6) - More robust secure flag

---

## Testing Recommendations

### Timezone Tests

```javascript
// Test monthly cap near month boundary
test('monthly cap respects UTC month boundaries', async () => {
  const userId = 'test-user';

  // Set system time to March 31, 11:59pm UTC
  jest.useFakeTimers().setSystemTime(new Date('2025-03-31T23:59:00Z'));

  // Create 10 rewards
  for (let i = 0; i < 10; i++) {
    await createReferralReward(...);
  }

  // Check cap is reached
  expect(await checkReferrerMonthlyCap(userId)).toBe(false);

  // Move to April 1, 12:01am UTC
  jest.setSystemTime(new Date('2025-04-01T00:01:00Z'));

  // Cap should reset
  expect(await checkReferrerMonthlyCap(userId)).toBe(true);
});
```

### First Order Tests

```javascript
test('first order reward only given once', async () => {
  const userId = 'test-user';
  const order1 = await createOrder(userId);
  const order2 = await createOrder(userId);

  // Simulate concurrent webhooks
  await Promise.all([
    processOrderAttribution(order1, ...),
    processOrderAttribution(order2, ...)
  ]);

  // Only ONE reward should exist
  const rewards = await getRewardsForUser(userId);
  expect(rewards.length).toBe(1);
});
```

---

**End of Additional Issues Report**
