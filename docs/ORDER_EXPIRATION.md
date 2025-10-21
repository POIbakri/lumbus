# Order Expiration System

## Overview

The Lumbus platform now has an automated system to mark orders as 'expired' when their validity period has elapsed. This ensures accurate order status tracking and proper filtering in the dashboard.

## How It Works

### 1. Database Support

The `orders` table already supports the 'expired' status:

```typescript
// lib/db.ts:22
export type OrderStatus = 'pending' | 'paid' | 'provisioning' | 'completed' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'revoked' | 'failed';
```

The database constraint in `supabase/migrations/002_esimaccess_integration.sql:28`:
```sql
CHECK (status IN ('pending', 'paid', 'provisioning', 'completed', 'active', 'depleted', 'expired', 'cancelled', 'revoked', 'failed'))
```

### 2. Expiration Calculation

Orders expire based on:
- **Activation Date** (`activated_at` field): When the eSIM was first activated
- **Validity Period** (`plans.validity_days`): Number of days the plan is valid

**Formula:**
```
Expiration Date = Activation Date + (Validity Days × 24 hours)
```

**Example:**
- Plan: 30-day validity
- Activated: January 1, 2025 at 10:00 AM
- Expires: January 31, 2025 at 10:00 AM

### 3. Automatic Expiration Methods

#### Method 1: eSIM Access Webhooks (Primary)

The `ESIM_STATUS` webhook automatically updates orders to 'expired' when eSIM Access reports:
- `USED_EXPIRED` → Order status becomes 'expired'
- `UNUSED_EXPIRED` → Order status becomes 'expired'

**Location:** `app/api/esimaccess/webhook/route.ts:308-326`

#### Method 2: Cron Job (Backup)

A scheduled cron job runs every 6 hours to catch any orders that weren't expired via webhook:

**Endpoint:** `/api/cron/expire-orders`
**Schedule:** Every 6 hours (`0 */6 * * *`)
**What it does:**
1. Finds all activated orders with status: `active`, `completed`, or `provisioning`
2. Calculates if current time > expiration date
3. Updates expired orders to status: `expired`

**Configuration:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-orders",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Testing

### Using the Test Script

A test script is provided to check which orders would be expired:

```bash
# Dry run (shows what would be expired, but doesn't change anything)
npx tsx scripts/test-expire-orders.ts

# Actually expire the orders
npx tsx scripts/test-expire-orders.ts --apply
```

**Note:** Requires `.env.local` with valid Supabase credentials.

### Manual Testing via API

You can manually trigger the cron job (requires CRON_SECRET):

```bash
curl -X GET https://your-domain.com/api/cron/expire-orders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Expected Response

```json
{
  "success": true,
  "total_checked": 15,
  "expired": 3,
  "duration_ms": 245,
  "expired_orders": [
    {
      "order_id": "abc-123",
      "old_status": "active",
      "new_status": "expired",
      "activated_at": "2024-12-01T10:00:00Z",
      "expired_at": "2024-12-31T10:00:00Z",
      "days_since_expiry": 5
    }
  ]
}
```

## Order Lifecycle

```
pending → paid → provisioning → completed → active → expired
                                     ↓         ↓
                                 cancelled  depleted
```

**Status Transitions:**
- `pending` → `paid`: After Stripe payment
- `paid` → `provisioning`: eSIM order placed with supplier
- `provisioning` → `completed`: eSIM ready, QR code generated
- `completed` → `active`: eSIM activated on device (SM-DP+ ENABLED event)
- `active` → `depleted`: Data fully consumed
- `active` → `expired`: Validity period elapsed (webhook or cron)
- `completed` → `expired`: Never activated, but validity period passed

## Monitoring

### Vercel Logs

Check cron job execution in Vercel dashboard:
1. Go to your project
2. Click "Cron Jobs" tab
3. View execution logs for `/api/cron/expire-orders`

### Database Queries

**Find expired orders:**
```sql
SELECT id, status, activated_at, created_at
FROM orders
WHERE status = 'expired'
ORDER BY activated_at DESC;
```

**Find orders that should be expired but aren't:**
```sql
SELECT o.id, o.status, o.activated_at, p.validity_days,
       (o.activated_at + (p.validity_days || ' days')::interval) as should_expire_at
FROM orders o
JOIN plans p ON o.plan_id = p.id
WHERE o.activated_at IS NOT NULL
  AND o.status IN ('active', 'completed', 'provisioning')
  AND NOW() > (o.activated_at + (p.validity_days || ' days')::interval);
```

## Dashboard Display

Expired orders are filtered out of the "Active eSIMs" section and can optionally be shown in order history.

**Filter Logic** (from `app/api/admin/debug-orders/route.ts:47`):
```typescript
const isExpired = daysRemaining <= 0 && activated_at !== null;
const wouldShowInActiveSims = isActiveStatus && !isDepleted && !isExpired;
```

## Environment Variables

No additional environment variables are needed. The cron job uses the existing `CRON_SECRET` for authorization.

## Troubleshooting

### Orders not expiring automatically

1. **Check webhook configuration:**
   - Verify eSIM Access webhook is configured correctly
   - Check `webhook_events` table for `ESIM_STATUS` events

2. **Check cron job:**
   - Verify cron is scheduled in `vercel.json`
   - Check Vercel cron logs for errors
   - Test manually: `curl https://your-domain.com/api/cron/expire-orders`

3. **Check database:**
   - Ensure `activated_at` is set on the order
   - Verify plan has `validity_days` set correctly

### False positives (expiring too early)

- Verify `activated_at` timestamp is correct (should be when eSIM was enabled, not when order was created)
- Check plan's `validity_days` value
- Review timezone handling in expiration calculation

## Future Enhancements

Potential improvements:
- [ ] Send email notification when order expires
- [ ] Allow users to renew expired orders
- [ ] Add "expires in X days" warnings in dashboard
- [ ] Track expiration history/audit log
- [ ] Add grace period before marking as expired
