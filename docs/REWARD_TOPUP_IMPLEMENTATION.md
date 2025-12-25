# Reward Top-Up Implementation

## Overview
This document describes the implementation of the reward top-up feature, which allows users to apply their free data balance (earned through referrals) to their active eSIMs.

## What Worked

### Final Working Solution

**API Request Format:**
```json
{
  "packageCode": "AE_1_7",
  "transactionId": "1766618471430_reward",
  "iccid": "8943108170002745615"
}
```

**Key Requirements:**
1. **Use slug, not packageCode** - The eSIM Access API requires the `slug` (e.g., `AE_1_7`) for top-ups, not the internal package code (e.g., `CKH527`)
2. **Use iccid, not esimTranNo** - Despite documentation suggesting esimTranNo, `iccid` works reliably
3. **Short transactionId** - Format: `{timestamp}_reward` (e.g., `1766618471430_reward`)
4. **No amount field** - Omit the `amount` parameter to avoid validation errors
5. **Single identifier** - Send only `iccid` OR `esimTranNo`, not both

### API Flow
1. Query available top-up packages via `getTopUpPackages()` using the eSIM's ICCID
2. Filter packages by the eSIM's region (e.g., `AE` for UAE)
3. Find a 1GB package with a valid `slug`
4. Call `/esim/topup` with the slug as `packageCode`

## What Didn't Work

### Failed Approaches

| Attempt | Error | Reason |
|---------|-------|--------|
| Using `packageCode` (e.g., `CKH527`) | 310242 - "top up data plan code doesn't exist" | Top-ups require slug format |
| Using `esimTranNo` instead of `iccid` | 000001 - UNKNOWN_ERROR | Some eSIMs require iccid |
| Sending both `iccid` AND `esimTranNo` | 000104 - "request json invalid" | API expects one or the other |
| Including `amount` field | 000104 - "request json invalid" | Amount validation issues |
| Long transactionId with UUID | 000001 - UNKNOWN_ERROR | Possibly length issues |
| Using any 1GB package (wrong region) | 310242 | Must match eSIM's region |

### Error Codes Encountered
- `310242` - Package code doesn't exist (wrong format or incompatible package)
- `000104` - Request JSON invalid (malformed request body)
- `000001` - Unknown error (catch-all, often identifier issues)

## File Changes

### Modified Files
1. **`app/api/rewards/apply-data/route.ts`**
   - Auto-selects 1GB package for eSIM's region
   - Uses slug for top-up API call
   - Creates order record with `topup_source: 'reward'`

2. **`app/api/stripe/webhook/route.ts`**
   - Updated paid top-ups to also fetch and use slugs
   - Same pattern as reward top-ups for consistency

3. **`lib/esimaccess.ts`**
   - Updated `topUpEsim()` to prefer iccid over esimTranNo
   - Removed amount field from request

4. **`components/data-wallet.tsx`**
   - Simplified UI (removed package selector)
   - Added page refresh after successful claim

### New Files
- **`supabase/migrations/029_add_topup_source.sql`** - Adds `topup_source` column to track reward vs paid top-ups
- **`docs/MOBILE_APP_REWARDS_INTEGRATION.md`** - Mobile app integration guide

## Testing

### Successful Test
```
[Reward Top-up] Using package: United Arab Emirates 1GB 7Days (slug: AE_1_7, code: CKH527)
[eSIM Access] Top-up request to /esim/topup: {
  "packageCode": "AE_1_7",
  "transactionId": "1766618471430_reward",
  "iccid": "8943108170002745615"
}
[Reward Top-up] Provider response: {
  "success": true,
  "transactionId": "1766618471430_reward",
  "iccid": "8943108170002745615",
  "expiredTime": "2026-03-01T11:23:57+0000",
  "totalVolume": 11811160064,
  "totalDuration": 67,
  "orderUsage": 745598470
}
```

## Important Notes

1. **Package Compatibility**: Not all packages support top-ups. The `supportTopUpType` field indicates:
   - `1` = New eSIM only (no top-up)
   - `2` = Supports top-up

2. **Region Matching**: The top-up package must match the eSIM's original region. A UAE eSIM can only be topped up with UAE packages.

3. **Slug Format**: Slugs follow the pattern `{REGION}_{GB}_{DAYS}` (e.g., `AE_1_7` = UAE 1GB 7Days)

4. **Wallet Deduction**: The wallet balance is only deducted AFTER successful provider response.
