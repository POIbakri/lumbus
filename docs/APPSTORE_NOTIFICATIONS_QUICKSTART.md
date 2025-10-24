# Apple App Store Server Notifications - Quick Setup Guide

⚡ **5-Minute Setup** for receiving refund notifications and other purchase events from Apple.

## What This Does

Automatically receive notifications when:
- ✅ User gets a refund → Auto-deactivate eSIM
- ✅ Subscription renews → Extend validity
- ✅ Payment fails → Notify user
- ✅ Access revoked → Remove access

## Step-by-Step Setup

### 1. Run Database Migration (2 minutes)

```bash
# In Supabase SQL Editor, run this migration:
supabase/migrations/016_appstore_server_notifications.sql
```

Verify it worked:
```sql
SELECT * FROM apple_server_notifications LIMIT 1;
-- Should return no rows but no errors
```

### 2. Deploy Code (1 minute)

```bash
npm run build
# Deploy to production (Vercel/Railway/etc.)
```

Verify webhook is live:
```bash
curl https://api.getlumbus.com/api/appstore/webhook
# Should return: {"status":"ready",...}
```

### 3. Configure App Store Connect (2 minutes)

1. Go to https://appstoreconnect.apple.com/
2. Click your app → "App Information"
3. Scroll to "App Store Server Notifications"
4. Add URLs:
   - **Production:** `https://api.getlumbus.com/api/appstore/webhook`
   - **Sandbox:** `https://api.getlumbus.com/api/appstore/webhook`
5. Click "Send Test Notification" button
6. Check your database:

```sql
SELECT notification_type, processed, created_at
FROM apple_server_notifications
ORDER BY created_at DESC LIMIT 1;
-- Should show the test notification
```

## That's It! 🎉

You're now receiving real-time notifications from Apple.

## Test It Works

### Test Refund Flow

1. Make a Sandbox purchase in your app
2. Go to App Store Connect → "Sandbox Testing"
3. Find the transaction → Click "Request Refund"
4. Check your database:

```sql
SELECT status, refunded_at FROM orders
WHERE apple_transaction_id = 'YOUR_TRANSACTION_ID';
-- Status should be 'refunded'
```

## What Happens Automatically

### On Refund:
1. Order status → `refunded`
2. Commissions → voided
3. Referral rewards → voided
4. ✅ All automatic!

### On Revoke (Family Sharing):
1. Order status → `revoked`
2. Access removed
3. Commissions/rewards voided

## Monitoring

```sql
-- Check recent notifications
SELECT
  notification_type,
  processed,
  processing_error,
  created_at
FROM apple_server_notifications
ORDER BY created_at DESC
LIMIT 10;
```

```sql
-- Check for errors
SELECT * FROM apple_server_notifications
WHERE processed = false OR processing_error IS NOT NULL;
```

## Mobile Team: Nothing to Do!

No mobile app changes needed. This is purely server-to-server.

Just make sure product IDs match format: `com.lumbus.esim.{region}_{data}gb`

## Troubleshooting

**Notifications not arriving?**
- Check URL is exactly: `https://api.getlumbus.com/api/appstore/webhook`
- No trailing slash!
- Must be HTTPS

**Order not found?**
- Check `apple_transaction_id` is stored during purchase
- Transaction ID from notification must match database

**Signature errors?**
- This shouldn't happen - contact backend team

## Need Help?

See full docs: `docs/APPLE_APP_STORE_SERVER_NOTIFICATIONS.md`

Or check:
- Logs in your backend
- `apple_server_notifications` table
- `apple_notification_processing_log` table

---

**Status:** ✅ Production Ready
**Setup Time:** ~5 minutes
**Maintenance:** None required
