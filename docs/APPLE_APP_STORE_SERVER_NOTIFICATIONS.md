# Apple App Store Server Notifications Setup

This document explains how to set up and use Apple App Store Server Notifications v2 for the Lumbus eSIM platform.

## What Are App Store Server Notifications?

App Store Server Notifications are **server-to-server** webhooks that Apple sends to your backend when in-app purchase events occur. These are **completely different** from push notifications sent to users.

## Why Do We Need This?

While we already validate receipts when users make purchases, App Store Server Notifications provide additional security and functionality:

1. **Refund Detection** - Apple notifies us when a user gets a refund (we can't detect this from receipts alone)
2. **Purchase Verification** - Apple validates the purchase before notifying us (fraud prevention)
3. **Subscription Renewals** - Get notified about subscription renewals (for future use)
4. **Billing Issues** - Know when subscription payments fail
5. **Real-time Updates** - Get updates without polling Apple's APIs

## Events We Handle

### Critical Events (Implemented)
- ✅ **REFUND** - User got a refund → Deactivate eSIM, void commissions/rewards
- ✅ **REVOKE** - Access revoked (family sharing) → Deactivate eSIM
- ✅ **EXPIRED** - Subscription expired → Mark order as expired

### Future Events (Ready for Subscriptions)
- 🔄 **DID_RENEW** - Subscription renewed successfully
- 🔄 **DID_FAIL_TO_RENEW** - Subscription renewal failed (billing issue)
- 🔄 **SUBSCRIBED** - New subscription started
- 🔄 **DID_CHANGE_RENEWAL_STATUS** - User changed auto-renewal setting
- 🔄 **GRACE_PERIOD_EXPIRED** - Grace period for subscription ended

## Setup Instructions

### Step 1: Deploy Backend Changes

1. **Run the database migration:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/016_appstore_server_notifications.sql
   ```

2. **Deploy the code:**
   ```bash
   npm run build
   # Deploy to your production environment
   ```

3. **Verify the webhook endpoint is accessible:**
   ```bash
   curl https://api.getlumbus.com/api/appstore/webhook
   # Should return: {"status":"ready","message":"Apple App Store Server Notifications endpoint is operational",...}
   ```

### Step 2: Configure App Store Connect

1. **Log in to App Store Connect:**
   - Go to https://appstoreconnect.apple.com/
   - Select your app (Lumbus)

2. **Navigate to App Information:**
   - Click on your app
   - Go to "App Information" (in the left sidebar)

3. **Scroll to "App Store Server Notifications":**
   - You'll find this section near the bottom of the page

4. **Add the webhook URL:**
   - **Production Server URL:** `https://api.getlumbus.com/api/appstore/webhook`
   - **Sandbox Server URL:** `https://api.getlumbus.com/api/appstore/webhook`

   Note: We use the same URL for both environments. The webhook automatically handles both.

5. **Save the configuration**

6. **Test the webhook:**
   - Apple provides a "Send Test Notification" button
   - Click it to verify your endpoint is working
   - Check your backend logs to see if the notification was received

### Step 3: Verify Setup

1. **Check if test notification was received:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT * FROM apple_server_notifications
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Make a test purchase in Sandbox:**
   - Use a Sandbox Apple ID to make a test purchase in your app
   - Check if the notification is received and processed

3. **Test refund flow:**
   - Request a refund in App Store Connect (Sandbox)
   - Verify the order status changes to 'refunded'
   - Verify commissions and rewards are voided

## How It Works

### Flow Diagram

```
┌─────────────┐
│  User Makes │
│  Purchase   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Apple Charges  │
│  User           │
└──────┬──────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────────┐
│  Receipt    │      │  Server          │
│  Validation │      │  Notification    │
│  (Existing) │      │  (New!)          │
└──────┬──────┘      └────────┬─────────┘
       │                      │
       ▼                      ▼
  ┌────────────────────────────────┐
  │  Order Status Updated          │
  │  eSIM Provisioned              │
  └────────────────────────────────┘
```

### Refund Flow

```
┌─────────────┐
│  User Gets  │
│  Refund     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Apple Sends    │
│  REFUND         │
│  Notification   │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│  Our Webhook Handler    │
│  1. Verify JWS          │
│  2. Check idempotency   │
│  3. Find order          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Process Refund         │
│  1. Mark order refunded │
│  2. Void commissions    │
│  3. Void rewards        │
└─────────────────────────┘
```

## Security

### JWS Signature Verification

All notifications from Apple are signed using JWS (JSON Web Signature) with ES256 algorithm:

1. Apple includes their certificate chain in the `x5c` header
2. We verify the signature using the leaf certificate
3. Certificate chain can be validated against Apple Root CA (optional)

Our implementation:
- Verifies signature using Node's built-in `crypto` module
- Rejects notifications with invalid signatures
- Logs all verification attempts

### Idempotency

Apple may send the same notification multiple times. We handle this:

1. Each notification has a unique `notificationUUID`
2. We check if we've already processed this UUID
3. If yes, we return success without re-processing
4. This prevents duplicate refunds or status changes

### IP Whitelisting (Optional)

You can optionally enable IP whitelisting by setting:
```env
APPSTORE_ENABLE_IP_WHITELIST=true
```

Apple's server IPs (not currently used):
- No public IP list available (Apple uses AWS/CloudFlare)

## Database Schema

### apple_server_notifications

Stores all notifications from Apple:

```sql
CREATE TABLE apple_server_notifications (
  id UUID PRIMARY KEY,
  notification_uuid TEXT NOT NULL UNIQUE,  -- Apple's unique ID
  notification_type TEXT NOT NULL,          -- REFUND, DID_RENEW, etc.
  subtype TEXT,                             -- Additional context
  transaction_id TEXT,                      -- Apple transaction ID
  original_transaction_id TEXT,             -- For subscriptions
  order_id UUID,                            -- Link to our orders table
  signed_payload TEXT NOT NULL,             -- JWS token from Apple
  decoded_payload JSONB NOT NULL,           -- Decoded notification
  processed BOOLEAN DEFAULT false,          -- Processing status
  processing_error TEXT,                    -- Error if processing failed
  notification_sent_date TIMESTAMPTZ,       -- When Apple sent it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

### apple_notification_processing_log

Tracks all processing attempts (for debugging):

```sql
CREATE TABLE apple_notification_processing_log (
  id UUID PRIMARY KEY,
  notification_id UUID REFERENCES apple_server_notifications(id),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  processing_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### orders (extended)

Added refund tracking fields:

```sql
ALTER TABLE orders
  ADD COLUMN refunded_at TIMESTAMPTZ,
  ADD COLUMN refund_reason TEXT;

-- Updated status constraint to include 'refunded'
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'provisioning', 'completed', 'failed',
                    'active', 'depleted', 'expired', 'cancelled', 'revoked', 'refunded'));
```

## API Endpoints

### GET /api/appstore/webhook

Health check endpoint

**Response:**
```json
{
  "status": "ready",
  "message": "Apple App Store Server Notifications endpoint is operational",
  "version": "v2",
  "supported_notification_types": ["REFUND", "REVOKE", ...]
}
```

### POST /api/appstore/webhook

Receives notifications from Apple

**Request (from Apple):**
```json
{
  "signedPayload": "eyJhbGciOiJFUzI1NiIsIng1YyI6WyJNSUlDZm..."
}
```

**Response:**
```json
{
  "received": true,
  "notificationUUID": "unique-id",
  "type": "REFUND"
}
```

## Troubleshooting

### Notifications Not Arriving

1. **Check App Store Connect configuration:**
   - Verify the URL is correct
   - Make sure it starts with `https://`
   - No trailing slashes

2. **Test the endpoint manually:**
   ```bash
   curl https://api.getlumbus.com/api/appstore/webhook
   ```

3. **Check Apple's test notification:**
   - Use "Send Test Notification" in App Store Connect
   - Check your logs for any errors

4. **Verify DNS and SSL:**
   - Make sure your domain resolves correctly
   - SSL certificate must be valid

### Signature Verification Failures

If signatures fail to verify:

1. Check logs for specific error messages
2. Verify you're not modifying the `signedPayload` in any way
3. Make sure you're using the raw request body (not parsed JSON)

### Orders Not Found

If notifications arrive but order is not found:

1. Check that `apple_transaction_id` is being stored correctly during purchase
2. Verify the transaction ID in the notification matches what's in your database
3. Check for timing issues (notification might arrive before order is created)

### Duplicate Notifications

This is normal! Apple may send the same notification multiple times. Our idempotency checks handle this automatically.

## Monitoring

### Query Recent Notifications

```sql
-- Last 10 notifications
SELECT
  notification_uuid,
  notification_type,
  transaction_id,
  processed,
  processing_error,
  created_at
FROM apple_server_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Query Failed Notifications

```sql
-- Notifications that failed processing
SELECT
  n.notification_uuid,
  n.notification_type,
  n.processing_error,
  l.error_message,
  l.processing_duration_ms
FROM apple_server_notifications n
LEFT JOIN apple_notification_processing_log l ON l.notification_id = n.id
WHERE n.processed = false OR l.success = false
ORDER BY n.created_at DESC;
```

### Query Refunded Orders

```sql
-- All refunded orders
SELECT
  o.id,
  o.status,
  o.refunded_at,
  o.refund_reason,
  u.email,
  p.name as plan_name,
  o.amount_cents / 100.0 as amount_usd
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN plans p ON p.id = o.plan_id
WHERE o.status = 'refunded'
ORDER BY o.refunded_at DESC;
```

## Mobile App Integration

### No Code Changes Needed!

The mobile app doesn't need any changes. App Store Server Notifications are purely server-to-server.

### What Mobile Team Needs to Know

1. **Product IDs must match:**
   - Mobile app StoreKit product IDs must match what we generate
   - Format: `com.lumbus.esim.{region_code}_{data_gb}gb`
   - Example: `com.lumbus.esim.usa_5gb`

2. **Transaction IDs are stored:**
   - When validating receipts, we store `apple_transaction_id`
   - This is how we link notifications to orders

3. **Testing:**
   - Use Sandbox environment for testing
   - Test purchases will trigger notifications
   - Refunds can be tested via App Store Connect

## Environment Variables

No new environment variables required! The webhook endpoint works out of the box.

Optional configuration:
```env
# Enable IP whitelisting (not recommended - Apple doesn't publish IPs)
APPSTORE_ENABLE_IP_WHITELIST=false
```

## Apple Documentation

- [App Store Server Notifications v2](https://developer.apple.com/documentation/appstoreservernotifications)
- [Enabling App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/enabling_app_store_server_notifications)
- [Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding_to_app_store_server_notifications)
- [JWS Verification](https://developer.apple.com/documentation/appstoreservernotifications/jwstransaction)

## Support

If you encounter issues:

1. Check the logs in your backend
2. Query the `apple_server_notifications` table
3. Review the `apple_notification_processing_log` for errors
4. Contact the backend team with:
   - Notification UUID
   - Transaction ID
   - Error messages from logs

## Future Enhancements

When adding subscriptions:

1. Implement `DID_RENEW` handler to extend eSIM validity
2. Implement `DID_FAIL_TO_RENEW` to notify users of payment issues
3. Add grace period handling
4. Add billing retry notifications
5. Implement subscription management dashboard

---

**Last Updated:** October 2025
**Status:** ✅ Production Ready
