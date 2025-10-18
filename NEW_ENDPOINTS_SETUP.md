# New User Endpoints - Setup & Testing Guide

## 🎉 What's Been Created

Two critical endpoints for mobile app functionality:

1. **GET `/api/user/orders`** - Fetch all orders for authenticated user
2. **POST `/api/user/push-token`** - Register push notification token
3. **DELETE `/api/user/push-token`** - Remove push notification token

---

## 📁 Files Created

```
app/api/user/
├── orders/
│   └── route.ts          ← GET /api/user/orders
└── push-token/
    └── route.ts          ← POST/DELETE /api/user/push-token

migrations/
└── create_user_push_tokens.sql   ← Database migration

test-new-endpoints.sh     ← Testing script
```

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration

```bash
# Run the migration to create user_push_tokens table
psql $DATABASE_URL -f migrations/create_user_push_tokens.sql
```

**What this creates:**
- `user_push_tokens` table with RLS policies
- Indexes for performance
- Foreign key to `auth.users`
- One token per user constraint

### Step 2: Verify Server is Running

```bash
# Server should already be running from npm run dev
# Check at: http://localhost:3000

# If not running:
npm run dev
```

### Step 3: Test the Endpoints

```bash
# Get a JWT token first (see "Getting a JWT Token" below)
# Then run the test script:
./test-new-endpoints.sh
```

---

## 🔐 Getting a JWT Token for Testing

### Option 1: From Browser Console

1. Open your app in browser (http://localhost:3000)
2. Log in with a test account
3. Open browser console (F12)
4. Run this command:
```javascript
(await supabase.auth.getSession()).data.session.access_token
```
5. Copy the token

### Option 2: From Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click on a user
3. Copy their JWT token

### Option 3: Create Test User via API

```bash
# Sign up a new user
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

---

## 🧪 Manual Testing

### Test 1: GET /api/user/orders

**Request:**
```bash
curl -X GET http://localhost:3000/api/user/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plan_id": "uuid",
      "status": "completed",
      "smdp": "prod.truphone.com",
      "activation_code": "1$prod.truphone.com$...",
      "iccid": "89...",
      "data_usage_bytes": 2147483648,
      "data_remaining_bytes": 3221225472,
      "created_at": "2025-01-15T10:00:00Z",
      "plan": {
        "id": "uuid",
        "name": "USA 5GB - 30 Days",
        "region_code": "US",
        "data_gb": 5,
        "validity_days": 30,
        "retail_price": 12.99,
        "currency": "USD"
      }
    }
  ],
  "count": 1
}
```

**Expected Response (No Auth):**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

### Test 2: POST /api/user/push-token

**Request:**
```bash
curl -X POST http://localhost:3000/api/user/push-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
    "platform": "ios"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Push token saved successfully"
}
```

**Expected Response (Invalid Platform):**
```json
{
  "error": "Invalid request",
  "details": [
    {
      "message": "Platform must be either \"ios\" or \"android\"",
      "path": ["platform"]
    }
  ]
}
```

---

### Test 3: DELETE /api/user/push-token

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/user/push-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Push token deleted successfully"
}
```

---

## 📊 Database Verification

Check if the table was created correctly:

```sql
-- Check table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'user_push_tokens';

-- View table structure
\d user_push_tokens

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'user_push_tokens';

-- View sample data
SELECT * FROM user_push_tokens LIMIT 5;
```

---

## 🔍 Troubleshooting

### Problem: "Table does not exist"

**Solution:** Run the migration
```bash
psql $DATABASE_URL -f migrations/create_user_push_tokens.sql
```

### Problem: "Authentication required"

**Cause:** Missing or invalid JWT token

**Solution:**
1. Verify token is not expired
2. Get a fresh token from Supabase
3. Ensure `Authorization: Bearer {token}` header is included

### Problem: "Foreign key violation"

**Cause:** User ID doesn't exist in auth.users

**Solution:**
1. Create a user first via Supabase Auth
2. Use a valid user_id from auth.users table

### Problem: "Platform validation error"

**Cause:** Platform is not "ios" or "android"

**Solution:**
```json
{
  "pushToken": "ExponentPushToken[xxx]",
  "platform": "ios"  // Must be exactly "ios" or "android"
}
```

---

## 📱 Mobile App Integration

Update your mobile app to use the new endpoints:

### Before (Supabase Fallback)
```typescript
// Old: Direct Supabase query
const { data: orders } = await supabase
  .from('orders')
  .select('*, plans(*)')
  .eq('user_id', userId);
```

### After (Backend API)
```typescript
// New: Use backend API
const response = await fetch(`${API_URL}/user/orders`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const { orders } = await response.json();
```

### Push Token Registration
```typescript
import * as Notifications from 'expo-notifications';

// Register push token
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const token = await Notifications.getExpoPushTokenAsync();

  await fetch(`${API_URL}/user/push-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pushToken: token.data,
      platform: Platform.OS, // 'ios' or 'android'
    }),
  });
}
```

---

## ✅ Testing Checklist

- [ ] Migration ran successfully
- [ ] `user_push_tokens` table exists
- [ ] Server is running (http://localhost:3000)
- [ ] GET `/api/user/orders` returns 401 without auth
- [ ] GET `/api/user/orders` returns orders with valid token
- [ ] POST `/api/user/push-token` saves token successfully
- [ ] POST `/api/user/push-token` validates platform
- [ ] DELETE `/api/user/push-token` removes token
- [ ] RLS policies prevent users from seeing each other's data
- [ ] Mobile app updated to use new endpoints

---

## 🎯 Next Steps

### For Backend
1. ✅ Endpoints created
2. ✅ Migration file ready
3. ⏳ Run migration: `psql $DATABASE_URL -f migrations/create_user_push_tokens.sql`
4. ⏳ Test endpoints with JWT token
5. ⏳ Deploy to production

### For Mobile App
1. ⏳ Update API calls to use `/api/user/orders`
2. ⏳ Implement push token registration on app launch
3. ⏳ Remove Supabase fallback (now optional)
4. ⏳ Test full flow: signup → browse → purchase → notifications

---

## 📚 Related Documentation

- **API_COMPATIBILITY_REPORT.md** - Full API integration status
- **MOBILE_APP_API.md** - Complete API reference
- **MOBILE_APP_README.md** - Documentation navigation

---

## 🔒 Security Features

Both endpoints include:

✅ **JWT Authentication** - Required on all requests
✅ **User Isolation** - Users can only access their own data
✅ **RLS Policies** - Database-level security
✅ **Input Validation** - Zod schema validation
✅ **Error Handling** - Graceful error messages
✅ **Logging** - Request/error logging for debugging

---

## 📝 API Specifications

### GET /api/user/orders

**Authentication:** Required
**Rate Limit:** None (add if needed)
**Cache:** No caching (real-time data)

**Response Fields:**
- `orders[]` - Array of order objects
- `count` - Total number of orders
- Each order includes `plan` object (joined data)

### POST /api/user/push-token

**Authentication:** Required
**Method:** POST (upsert - updates if exists)
**Validation:** Zod schema

**Required Fields:**
- `pushToken` (string, min 1 char)
- `platform` (enum: "ios" | "android")

**Behavior:**
- Upserts on `user_id` (one token per user)
- Updates `updated_at` timestamp
- Overwrites previous token

### DELETE /api/user/push-token

**Authentication:** Required
**Method:** DELETE
**Validation:** None (user_id from JWT)

**Behavior:**
- Deletes all tokens for authenticated user
- Useful for logout or disabling notifications

---

**Created:** October 18, 2025
**Status:** ✅ Ready for Testing
**Next:** Run migration + test endpoints
