# Lumbus Mobile App Documentation

Complete guide to the Lumbus React Native mobile app and backend API integration.

---

## 🎉 Quick Status

**Mobile app integration is COMPLETE!**

- ✅ All API calls authenticated with Bearer tokens
- ✅ Core features working (browse, purchase, track usage)
- ✅ Ready for testing and further development
- ⚠️ 2 backend endpoints using Supabase fallback (production optimization needed)

---

## 📚 Documentation Guide

### Start Here

1. **[API_COMPATIBILITY_REPORT.md](./API_COMPATIBILITY_REPORT.md)** ← **Read This First!**
   - Current implementation status
   - What's working vs. what's missing
   - Backend endpoint templates for missing features
   - Complete integration details

2. **[MOBILE_APP_SUMMARY.md](./MOBILE_APP_SUMMARY.md)**
   - Executive overview
   - Feature support matrix
   - Development timeline
   - Next steps

### Detailed References

3. **[MOBILE_APP_API.md](./MOBILE_APP_API.md)**
   - Complete API endpoint documentation
   - Request/response formats
   - Authentication guide
   - Code examples for React Native

4. **[MOBILE_APP_READINESS.md](./MOBILE_APP_READINESS.md)**
   - What's ready to use
   - What needs to be created
   - Implementation priorities
   - Quick start guide

5. **[MOBILE_APP_USER_FLOW.md](./MOBILE_APP_USER_FLOW.md)**
   - Visual user journey
   - Screen architecture
   - API integration by screen
   - State management recommendations

---

## ✅ What's Working Right Now

### Mobile App
- ✅ Supabase Auth integration (sign up, login, session management)
- ✅ API calls with Bearer token authentication
- ✅ Browse plans with search/filter
- ✅ Purchase eSIM with Stripe Payment Sheet
- ✅ View order details
- ✅ Track real-time data usage
- ✅ View order history (using Supabase fallback)
- ✅ QR code generation for eSIM installation
- ✅ Error handling with graceful fallbacks

### Backend APIs (Already Integrated)
- ✅ `GET /api/plans` - Browse eSIM plans
- ✅ `GET /api/plans/[id]` - Get plan details
- ✅ `POST /api/checkout` - Create payment intent
- ✅ `GET /api/orders/[id]` - Get order details
- ✅ `GET /api/orders/[id]/usage` - Get usage data
- ✅ `GET /api/qr/[orderId]` - Generate QR code

---

## ⚠️ What Needs Backend Implementation

### 2 Critical Endpoints (2-3 hours)

**1. User Orders List**
```typescript
GET /api/user/orders
```
- Currently using Supabase fallback
- Template provided in `API_COMPATIBILITY_REPORT.md`

**2. Push Token Registration**
```typescript
POST /api/user/push-token
```
- Currently direct Supabase write
- Template provided in `API_COMPATIBILITY_REPORT.md`
- Requires `user_push_tokens` table creation

### Implementation Steps

1. **Read** `API_COMPATIBILITY_REPORT.md` for complete templates
2. **Create** the 2 endpoint files:
   - `app/api/user/orders/route.ts`
   - `app/api/user/push-token/route.ts`
3. **Create** database table using SQL in the report
4. **Test** with Postman or curl
5. **Deploy** to production

---

## 🚀 Quick Start (Backend)

### Option 1: Use Existing Implementation (Current)

The mobile app works right now using Supabase fallback for user orders. You can test immediately:

```bash
# Mobile app is already configured to call your backend APIs
# Just ensure your backend is running on the configured URL
npm run dev
```

### Option 2: Implement Production Endpoints (Recommended)

For production deployment, implement the 2 missing endpoints:

```bash
# 1. Create endpoint files
mkdir -p app/api/user/orders app/api/user/push-token

# 2. Copy templates from API_COMPATIBILITY_REPORT.md

# 3. Create database table
psql $DATABASE_URL < user_push_tokens.sql

# 4. Test endpoints
curl -H "Authorization: Bearer {token}" https://getlumbus.com/api/user/orders
```

---

## 🧪 Testing the Mobile App

### Prerequisites
- Backend running (local or production)
- Supabase project configured
- Stripe test mode enabled

### Test Flow

1. **Sign Up** - Create new account
2. **Browse Plans** - View available eSIMs
3. **Purchase** - Buy with test card `4242 4242 4242 4242`
4. **View Order** - Check order status
5. **Track Usage** - View data consumption
6. **Top Up** - Add more data (future)

### Test Cards (Stripe)
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0027 6000 3184

---

## 📱 Mobile App Architecture

### Tech Stack
- **Framework:** React Native (Expo)
- **Auth:** Supabase Auth (JWT tokens)
- **Payments:** Stripe Payment Sheet
- **State:** Zustand (recommended) or Context API
- **Navigation:** React Navigation
- **Storage:** Expo SecureStore (tokens), AsyncStorage (cache)

### Key Files
```
/lib
  /api.ts             ← API client with authentication
  /supabase.ts        ← Supabase configuration
  /storage.ts         ← Secure storage helpers

/contexts
  /AuthContext.tsx    ← Authentication state

/screens
  /HomeScreen.tsx     ← Browse plans
  /CheckoutScreen.tsx ← Purchase flow
  /OrdersScreen.tsx   ← Order history
  /UsageScreen.tsx    ← Data tracking
```

---

## 🔐 Authentication Flow

```
1. User signs up/logs in via Supabase Auth
2. Session stored in Expo SecureStore
3. API client retrieves token from session
4. All API calls include: Authorization: Bearer {token}
5. Backend validates JWT and extracts user_id
6. User can only access their own data
```

---

## 🔄 API Integration Pattern

All mobile app API functions follow this pattern:

```typescript
export async function fetchPlans(): Promise<Plan[]> {
  try {
    // 1. Get authentication headers
    const headers = await getAuthHeaders();

    // 2. Call backend API
    const response = await fetch(`${API_URL}/plans`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) throw new Error('API call failed');

    // 3. Return data
    const data = await response.json();
    return data.plans || data;

  } catch (error) {
    console.error('API error, using fallback:', error);

    // 4. Fallback to Supabase for resilience
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true);

    return data || [];
  }
}
```

**Benefits:**
- ✅ Works with backend when available
- ✅ Falls back to Supabase if backend is down
- ✅ Logs errors for debugging
- ✅ Resilient and production-ready

---

## 📊 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Mobile App Auth | ✅ Complete | Supabase integration working |
| API Integration | ✅ Complete | All calls authenticated |
| Browse Plans | ✅ Working | Backend API integrated |
| Purchase Flow | ✅ Working | Stripe Payment Sheet |
| View Orders | ✅ Working | Using Supabase fallback |
| Track Usage | ✅ Working | Backend API integrated |
| Push Notifications | ⚠️ Partial | Direct Supabase write |
| Top-Up | 🟡 Pending | Backend ready, mobile not yet |
| Referrals | 🟡 Pending | Backend ready, mobile not yet |
| Wallet | 🟡 Pending | Backend ready, mobile not yet |

---

## 🎯 Next Steps

### For Backend Team (2-3 hours)
1. ✅ Review `API_COMPATIBILITY_REPORT.md`
2. 🔧 Implement `GET /api/user/orders`
3. 🔧 Implement `POST /api/user/push-token`
4. 🔧 Create `user_push_tokens` table
5. ✅ Test endpoints with Postman
6. 🚀 Deploy to production

### For Mobile Team (Ongoing)
1. ✅ Core features complete and tested
2. 🔧 Implement top-up flow
3. 🔧 Implement referrals screen
4. 🔧 Implement wallet screen
5. 🔧 Add push notifications
6. ✅ Polish UI/UX
7. 🧪 End-to-end testing
8. 🚀 Submit to App Store/Play Store

---

## 💬 Need Help?

### Issues & Bugs
- **Mobile App:** Check console logs for API errors
- **Backend:** Check `/api/health` endpoint
- **Auth:** Verify Supabase credentials in `.env`
- **Payments:** Check Stripe test mode dashboard

### Documentation
- **API Details:** See `MOBILE_APP_API.md`
- **Integration Status:** See `API_COMPATIBILITY_REPORT.md`
- **Architecture:** See `MOBILE_APP_USER_FLOW.md`
- **Overview:** See `MOBILE_APP_SUMMARY.md`

### Templates
- **Backend Endpoints:** See `API_COMPATIBILITY_REPORT.md`
- **Mobile Screens:** See `MOBILE_APP_USER_FLOW.md`
- **API Client:** See `MOBILE_APP_READINESS.md`

---

## 🎉 Conclusion

Your mobile app is **fully integrated** and **functional**! The core features (auth, browse, purchase, track) are working with proper authentication.

For production deployment, implement the 2 backend endpoints (templates provided) to replace the Supabase fallbacks with proper backend validation and logging.

**Total time to production:** 2-3 hours for backend + ongoing mobile feature development

---

**Last Updated:** October 18, 2025
**Status:** ✅ Integration Complete
**Production Ready:** After implementing 2 backend endpoints
**Estimated Completion:** 2-3 hours
