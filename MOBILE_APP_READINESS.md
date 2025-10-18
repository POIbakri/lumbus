# Mobile App API Readiness Check

Quick reference for mobile app development - what APIs exist and what needs to be created.

## 🔐 Important: Auth-First Mobile App

**The mobile app requires authentication before ANY feature access:**

- ✅ **Web version:** Passwordless checkout → Sign up later (optional)
- ✅ **Mobile app:** Sign up/login FIRST → Browse → Purchase → Manage

**User Flow:**
1. Download app
2. **Sign up or login** (required)
3. Browse plans (authenticated)
4. Purchase eSIM (authenticated)
5. View orders & usage (authenticated)

All API calls from the mobile app MUST include an `Authorization: Bearer {token}` header.

---

## ✅ Ready to Use & Integrated

These APIs are fully functional and **ALREADY INTEGRATED** in the React Native app:

### Core Shopping Features
- ✅ **Browse Plans** - `GET /api/plans` ← **Integrated with auth headers**
- ✅ **Get Single Plan** - `GET /api/plans/[planId]` ← **Integrated with auth headers**
- ✅ **Currency Detection** - `GET /api/currency/detect`
- ✅ **Mobile Checkout** - `POST /api/checkout` ← **Integrated with auth headers**
- ✅ **Discount Validation** - `POST /api/discount-codes/validate`

### Order Management
- ✅ **Get Order Details** - `GET /api/orders/[orderId]` ← **Integrated with auth headers**
- ✅ **Get QR Code** - `GET /api/qr/[orderId]`
- ✅ **Get Real-Time Usage** - `GET /api/orders/[orderId]/usage` ← **Integrated with auth headers** (fixed endpoint path)

### Top-Up Feature
- ✅ **Top-Up Checkout** - `POST /api/checkout/session` (requires auth)
  - Fully implemented with eSIM Access API integration
  - No reinstallation needed
  - See `TOPUP_FUNCTIONALITY.md` for details

### Rewards & Referrals
- ✅ **Get Referral Info** - `GET /api/referrals/me` (requires auth)
- ✅ **Get Data Wallet** - `GET /api/rewards/wallet` (requires auth)
- ✅ **Redeem Wallet Credit** - `POST /api/rewards/redeem` (requires auth)

### System
- ✅ **Health Check** - `GET /api/health`

### Mobile App Status
- ✅ **Authentication** - All API calls include `Authorization: Bearer {token}` headers
- ✅ **Error Handling** - Graceful fallback to Supabase for resilience
- ✅ **Endpoint Corrections** - Usage endpoint fixed from `/usage/{id}` to `/orders/{id}/usage`
- ✅ **Ready for Testing** - Mobile app can be tested with backend immediately

---

## ❌ Missing Endpoints (Need to Create)

These are critical for full mobile app functionality. **Mobile app currently uses Supabase fallback for these:**

### Order History (HIGH PRIORITY)
```typescript
// app/api/user/orders/route.ts
GET /api/user/orders - List all user's orders (sorted by date)
```
**Status:** ⚠️ Mobile app currently queries Supabase directly
**Template:** See `API_COMPATIBILITY_REPORT.md` for implementation code

### Push Notifications (HIGH PRIORITY)
```typescript
// app/api/user/push-token/route.ts
POST /api/user/push-token - Register Expo push token
DELETE /api/user/push-token - Unregister push token (optional)
```
**Status:** ⚠️ Mobile app currently saves directly to Supabase
**Template:** See `API_COMPATIBILITY_REPORT.md` for implementation code
**Database:** Need to create `user_push_tokens` table

### User Profile Management (MEDIUM PRIORITY)
```typescript
// app/api/user/me/route.ts
GET /api/user/me - Get current user profile
PATCH /api/user/me - Update user profile (name, phone, etc.)
POST /api/user/password - Set/change password
```
**Status:** 🔵 Not yet used by mobile app, future feature

### Support & Feedback (MEDIUM PRIORITY)
```typescript
// app/api/feedback/route.ts
POST /api/feedback - Submit app feedback/support request
```
**Status:** 🔵 Not yet used by mobile app, future feature

### Order Management (LOW PRIORITY)
```typescript
// app/api/orders/[orderId]/cancel/route.ts
DELETE /api/orders/[orderId] - Cancel pending order (if not yet provisioned)
```
**Status:** 🔵 Not yet used by mobile app, future feature

---

## 📝 Implementation Priority

### ✅ Phase 0 (COMPLETED)
1. ✅ **Mobile app authentication** - All API calls include Bearer tokens
2. ✅ **API integration** - Plans, orders, checkout, usage all working
3. ✅ **Error handling** - Graceful fallback to Supabase
4. ✅ **Endpoint corrections** - Usage path fixed

### Phase 1 (Critical - Build These Next - 2-3 hours)
1. **GET `/api/user/orders`** - Users need to see their order history
   - Currently using Supabase fallback (works but not ideal)
   - Template code provided in `API_COMPATIBILITY_REPORT.md`

2. **POST `/api/user/push-token`** - Essential for order status notifications
   - Currently saves directly to Supabase (works but not ideal)
   - Template code provided in `API_COMPATIBILITY_REPORT.md`
   - Need to create `user_push_tokens` table (SQL provided)

### Phase 2 (Important - Build Soon)
3. **GET `/api/user/me`** - Display user profile in app
4. **POST `/api/feedback`** - Users will need support
5. **PATCH `/api/user/me`** - Let users update their profile

### Phase 3 (Nice to Have - Build Later)
6. **POST `/api/user/password`** - Passwordless users need to set passwords
7. **DELETE `/api/orders/[orderId]`** - Cancel failed orders
8. **GET `/api/orders/[orderId]/history`** - Show top-up history

---

## 🚀 Quick Start Guide for Mobile App

### 1. Authentication Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 2. API Client Setup

```typescript
// lib/api.ts
import { supabase } from './supabase';

const API_URL = 'https://getlumbus.com/api';

export class ApiClient {
  // Get auth token - REQUIRED for all requests
  private async getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error('User not authenticated. Please sign in.');
    }

    return token;
  }

  // Authenticated request (all requests require auth)
  private async request(endpoint: string, options?: RequestInit) {
    const token = await this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options?.headers || {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Plans (all require auth)
  getPlans = (params?: { region?: string; search?: string }) => {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/plans${queryParams ? `?${queryParams}` : ''}`);
  };

  getPlan = (id: string) => this.request(`/plans/${id}`);

  // Orders (require auth)
  getOrder = (id: string) => this.request(`/orders/${id}`);
  getOrderUsage = (id: string) => this.request(`/orders/${id}/usage`);
  getUserOrders = () => this.request('/user/orders'); // To be created

  // Checkout (requires auth)
  createCheckout = async (planId: string, currency: string) => {
    // Get email from current session
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;

    if (!email) {
      throw new Error('User email not found');
    }

    return this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId, email, currency }),
    });
  };

  // Top-up (requires auth)
  createTopUp = (planId: string, orderId: string, iccid: string) =>
    this.request('/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        planId,
        isTopUp: true,
        existingOrderId: orderId,
        iccid,
      }),
    });

  // User (require auth)
  getUserProfile = () => this.request('/user/me'); // To be created

  // Referrals & Rewards (require auth)
  getReferrals = () => this.request('/referrals/me');
  getWallet = () => this.request('/rewards/wallet');
  redeemWallet = (orderId: string, amountMB: number) =>
    this.request('/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ orderId, amountMB }),
    });

  // Currency detection (requires auth)
  detectCurrency = () => this.request('/currency/detect');

  // Health check (public but we'll auth it anyway)
  getHealth = () => this.request('/health');
}

// Export singleton instance
export const api = new ApiClient();
```

### 3. Stripe Setup

```bash
npm install @stripe/stripe-react-native
```

```typescript
// App.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY!}>
      {/* Your app */}
    </StripeProvider>
  );
}
```

### 4. Example Purchase Flow (Auth-First)

```typescript
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '../lib/api';

const CheckoutScreen = ({ plan }) => {
  const { confirmPayment } = useStripe();
  const { session } = useAuth(); // User already authenticated

  const handlePurchase = async () => {
    try {
      // User is already authenticated - email comes from session
      // 1. Detect currency
      const { currency } = await api.detectCurrency();

      // 2. Create payment intent (email automatically included)
      const { clientSecret, orderId } = await api.createCheckout(
        plan.id,
        currency
      );

      // 3. Show payment sheet
      const { error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Payment failed', error.message);
        return;
      }

      // 4. Navigate to order status
      navigation.navigate('OrderStatus', { orderId });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>Purchasing as: {session.user.email}</Text>
      <Button title="Purchase" onPress={handlePurchase} />
    </View>
  );
};
```

---

## 🔧 Suggested Backend Improvements

### 1. Create Missing User Endpoints

```bash
# Create user API directory
mkdir -p app/api/user

# Create files
touch app/api/user/me/route.ts
touch app/api/user/orders/route.ts
touch app/api/user/push-token/route.ts
```

### 2. Add Rate Limiting (Optional but Recommended)

```typescript
// Use Vercel KV for rate limiting
import { kv } from '@vercel/kv';

const rateLimit = async (key: string, limit: number, window: number) => {
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, window);
  }
  return count <= limit;
};
```

### 3. Add Push Notification Service

```typescript
// lib/push-notifications.ts
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export const sendPushNotification = async (
  pushToken: string,
  title: string,
  body: string
) => {
  const messages = [{
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { /* custom data */ },
  }];

  await expo.sendPushNotificationsAsync(messages);
};
```

---

## 📱 Mobile App Features Ready to Build

### Fully Supported
- ✅ Browse plans with search/filter
- ✅ View plan details
- ✅ Purchase eSIM (passwordless checkout)
- ✅ Apple Pay / Google Pay support
- ✅ View order status
- ✅ QR code display (web fallback)
- ✅ iOS 17.4+ deep link installation
- ✅ Real-time data usage tracking
- ✅ Top-up existing eSIM
- ✅ Referral program
- ✅ Data wallet rewards

### Needs Backend Work
- ⚠️ Order history list (need to create `/user/orders`)
- ⚠️ User profile display (need to create `/user/me`)
- ⚠️ Push notifications (need to create `/user/push-token`)
- ⚠️ Support/feedback (need to create `/feedback`)

---

## 🎯 Recommended Mobile App Architecture

```
/app
  /screens
    - HomeScreen.tsx (Browse plans)
    - PlanDetailsScreen.tsx
    - CheckoutScreen.tsx
    - OrderStatusScreen.tsx
    - InstallEsimScreen.tsx
    - DashboardScreen.tsx (My eSIMs)
    - UsageScreen.tsx (Real-time data usage)
    - TopUpScreen.tsx
    - ReferralsScreen.tsx
    - WalletScreen.tsx
    - ProfileScreen.tsx

  /components
    - PlanCard.tsx
    - UsageBar.tsx
    - QRCodeDisplay.tsx (with web fallback)
    - PaymentSheet.tsx

  /lib
    - api.ts (API client)
    - supabase.ts (Auth)
    - storage.ts (AsyncStorage/SecureStore)
    - notifications.ts (Push)

  /hooks
    - useAuth.ts
    - usePlans.ts
    - useOrders.ts
    - useUsage.ts
```

---

## ⚡ Performance Tips

### 1. Cache Plans Data
Plans change infrequently - cache for 5 minutes using AsyncStorage.

### 2. Optimistic Updates
Update UI immediately, sync with server in background.

### 3. Polling Strategy
- Order status: Poll every 5 seconds until `completed`
- Data usage: Poll every 30 seconds while user is on usage screen
- Stop polling when screen is not focused

### 4. Image Optimization
- QR codes: Cache after first load
- Plan images: Use `react-native-fast-image`

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid token" error
**Solution:** Token expired - refresh using Supabase auth:
```typescript
const { data } = await supabase.auth.refreshSession();
```

### Issue: Payment succeeds but order stuck at "paid"
**Solution:** Poll `/orders/[orderId]` endpoint - eSIM provisioning can take 1-5 minutes

### Issue: QR code won't scan
**Solution:** Use iOS 17.4+ deep link or link to web page

### Issue: Usage data not updating
**Solution:** eSIM Access updates every 2-3 hours - this is normal

---

## 📚 Documentation

- **Full API Reference:** `MOBILE_APP_API.md`
- **Top-Up Feature:** `TOPUP_FUNCTIONALITY.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

## ✨ Next Steps

1. **Review `MOBILE_APP_API.md`** for complete API documentation
2. **Create missing user endpoints** (Phase 1 above)
3. **Set up Stripe in React Native** using `@stripe/stripe-react-native`
4. **Build core screens** (Home, Plan Details, Checkout, Dashboard)
5. **Test purchase flow** in Stripe test mode
6. **Add push notifications** for order status updates
7. **Implement iOS 17.4+ deep link** installation
8. **Test on real devices** (iOS and Android)

---

**Your backend is 90% ready for mobile app!** 🎉

Just need to create a few user-focused endpoints and you're good to go.

---

**Last Updated:** October 18, 2025
