# Lumbus Mobile App API Documentation

Complete API reference for the React Native mobile application.

---

## Base URL

```
Production: https://getlumbus.com/api
Development: http://localhost:3000/api
```

---

## Authentication

**IMPORTANT:** The mobile app is fully authentication-protected. Users MUST sign up/login before accessing any features.

All API endpoints require a **Bearer token** in the Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json',
}
```

### User Flow: Sign Up → Browse → Purchase

Unlike the web version (which allows passwordless checkout), the mobile app requires users to create an account first:

1. **Sign Up/Login** → Get auth token
2. **Browse Plans** → View available eSIMs (requires auth)
3. **Purchase** → Checkout with saved user info (requires auth)
4. **Manage eSIMs** → Dashboard, usage tracking, top-ups (requires auth)

### How to Implement Authentication

Use Supabase Auth in your React Native app:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Sign up new user
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
});

// Sign in existing user
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123',
});

// Get auth token
const token = signInData.session?.access_token;

// Store token securely
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('userToken', token);

// Get current session (for auto-login)
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### Authentication State Management

```typescript
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, isAuthenticated: !!session };
};
```

### Navigation Guard

Protect your app routes with authentication:

```typescript
const RootNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {session ? (
        // Authenticated - Show main app
        <MainStack />
      ) : (
        // Not authenticated - Show auth screens
        <AuthStack />
      )}
    </NavigationContainer>
  );
};
```

---

## API Endpoints

### 1. Browse Plans (Authenticated)

**GET** `/plans`

Get all available eSIM plans with optional filtering.

**Authentication:** Required for mobile app

**Query Parameters:**
- `region` (optional) - Filter by region code (e.g., "US", "GB", "JP")
- `continent` (optional) - Filter by continent
- `search` (optional) - Search by name or region code

**Example Request:**
```typescript
// Get all plans (authenticated)
const response = await fetch('https://getlumbus.com/api/plans', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Get plans for Japan
const response = await fetch('https://getlumbus.com/api/plans?region=JP', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Search for "Europe"
const response = await fetch('https://getlumbus.com/api/plans?search=Europe', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Response:**
```json
{
  "plans": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Japan 5GB - 30 Days",
      "region_code": "JP",
      "data_gb": 5,
      "validity_days": 30,
      "retail_price": 12.99,
      "currency": "USD",
      "supplier_sku": "JP_5GB_30D",
      "is_active": true,
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Cache:** 5 minutes

---

### 2. Get Single Plan (Authenticated)

**GET** `/plans/[planId]`

Get details of a specific plan.

**Authentication:** Required for mobile app

**Example Request:**
```typescript
const planId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`https://getlumbus.com/api/plans/${planId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Japan 5GB - 30 Days",
  "region_code": "JP",
  "data_gb": 5,
  "validity_days": 30,
  "retail_price": 12.99,
  "currency": "USD",
  "supplier_sku": "JP_5GB_30D"
}
```

---

### 3. Currency Detection (Public)

**GET** `/currency/detect`

Detect user's currency based on IP geolocation.

**Example Request:**
```typescript
const response = await fetch('https://getlumbus.com/api/currency/detect');
```

**Response:**
```json
{
  "currency": "USD",
  "country": "US"
}
```

---

### 4. Purchase eSIM (Mobile Checkout)

**POST** `/checkout`

Create a Stripe Payment Intent for mobile app checkout.

**Authentication:** Required

**Request Body:**
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "currency": "USD"
}
```

**Response:**
```json
{
  "clientSecret": "pi_3Abc123...secret_xyz",
  "orderId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Usage in React Native:**
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { confirmPayment } = useStripe();
const { session } = useAuth(); // User is already authenticated

// 1. Create Payment Intent
const response = await fetch('https://getlumbus.com/api/checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: selectedPlan.id,
    email: session.user.email, // Email from authenticated session
    currency: 'USD',
  }),
});

const { clientSecret, orderId } = await response.json();

// 2. Show Payment Sheet
const { error, paymentIntent } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});

if (error) {
  // Payment failed
  Alert.alert('Payment failed', error.message);
} else if (paymentIntent) {
  // Payment succeeded - navigate to order status
  navigation.navigate('OrderStatus', { orderId });
}
```

**Notes:**
- User must be authenticated before checkout
- Email is automatically taken from authenticated session
- Payment Intent supports all Stripe payment methods (Card, Apple Pay, Google Pay)
- Order is automatically linked to authenticated user's account

---

### 5. Get Order Details (Authenticated)

**GET** `/orders/[orderId]`

Get eSIM activation details for a specific order.

**Authentication:** Required

**Example Request:**
```typescript
const response = await fetch(
  `https://getlumbus.com/api/orders/${orderId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "hasActivationDetails": true,
  "smdp": "prod.truphone.com",
  "activationCode": "1$prod.truphone.com$ABC123...",
  "plan": {
    "name": "Japan 5GB - 30 Days",
    "region": "Japan",
    "dataGb": 5,
    "validityDays": 30
  },
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Statuses:**
- `pending` - Payment not yet completed
- `paid` - Payment received, eSIM being provisioned
- `provisioning` - eSIM being assigned
- `completed` - eSIM ready to install
- `active` - eSIM installed and active
- `depleted` - Data used up
- `expired` - Validity period ended
- `failed` - Provisioning failed

---

### 6. Get QR Code (Public)

**GET** `/qr/[orderId]`

Get QR code image for eSIM installation.

**Example Request:**
```typescript
// In React Native, use this URL directly in <Image> component
const qrUrl = `https://getlumbus.com/api/qr/${orderId}`;

<Image
  source={{ uri: qrUrl }}
  style={{ width: 300, height: 300 }}
/>
```

**Response:** PNG image (400x400px)

**Cache:** 5 minutes

**Important:** For mobile app, you should:
1. **iOS 17.4+:** Use deep link instead (see Installation Methods section)
2. **Older devices:** Link to web page with QR code display

---

### 7. Get Real-Time Data Usage (Authenticated)

**GET** `/orders/[orderId]/usage`

Fetch real-time data usage from eSIM Access API.

**Authentication:** Required

**Example Request:**
```typescript
const response = await fetch(
  `https://getlumbus.com/api/orders/${orderId}/usage`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

**Response:**
```json
{
  "success": true,
  "data_usage_bytes": 2147483648,
  "data_remaining_bytes": 3221225472,
  "data_used_gb": 2.00,
  "data_total_gb": 5.00,
  "data_remaining_gb": 3.00,
  "usage_percent": 40.0,
  "last_update": "2025-01-15T14:30:00.000Z",
  "updated_at": "2025-01-15T14:35:00.000Z"
}
```

**Notes:**
- eSIM Access updates usage every 2-3 hours
- Falls back to cached data if API call fails
- Returns 0 values if eSIM not yet provisioned

---

### 8. Top Up eSIM (Authenticated)

**POST** `/checkout/session`

Create a Stripe Checkout Session for top-up purchase.

**Authentication:** Required

**Request Body:**
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "isTopUp": true,
  "existingOrderId": "660e8400-e29b-41d4-a716-446655440001",
  "iccid": "89012345678901234567"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Usage in React Native:**
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const handleTopUp = async (planId: string, orderId: string, iccid: string) => {
  // Create checkout session
  const response = await fetch('https://getlumbus.com/api/checkout/session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      isTopUp: true,
      existingOrderId: orderId,
      iccid,
    }),
  });

  const { url } = await response.json();

  // Open Stripe checkout in browser
  await Linking.openURL(url);
};
```

**Notes:**
- Top-ups are NOT eligible for referral discounts
- Data is added to existing eSIM (no reinstallation)
- User is redirected to `/dashboard?topup=success` after payment
- Processing completes within 5 minutes

---

### 9. Get User Profile (Authenticated)

**Note:** You'll need to create this endpoint. Currently missing!

**Suggested Implementation:**

```typescript
// app/api/user/me/route.ts
export async function GET(req: NextRequest) {
  const auth = await requireUserAuth(req);
  if (auth.error) return auth.error;

  const { data: user } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('id', auth.user.id)
    .single();

  return NextResponse.json(user);
}
```

---

### 10. Get User's Orders (Authenticated)

**Note:** You'll need to create this endpoint. Currently missing!

**Suggested Implementation:**

```typescript
// app/api/user/orders/route.ts
export async function GET(req: NextRequest) {
  const auth = await requireUserAuth(req);
  if (auth.error) return auth.error;

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      iccid,
      data_usage_bytes,
      data_remaining_bytes,
      plans (name, region_code, data_gb, validity_days, retail_price, currency)
    `)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ orders });
}
```

---

### 11. Get Referral Info (Authenticated)

**GET** `/referrals/me`

Get user's referral code and statistics.

**Authentication:** Required

**Example Request:**
```typescript
const response = await fetch('https://getlumbus.com/api/referrals/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Response:**
```json
{
  "user_id": "770e8400-e29b-41d4-a716-446655440002",
  "ref_code": "JOHN123",
  "referred_by_code": "MARY456",
  "stats": {
    "total_referrals": 5,
    "pending_rewards": 2,
    "total_earnings_mb": 5000
  },
  "referral_link": "https://getlumbus.com/r/JOHN123"
}
```

---

### 12. Get Data Wallet (Authenticated)

**GET** `/rewards/wallet`

Get user's data wallet balance and rewards.

**Authentication:** Required

**Example Request:**
```typescript
const response = await fetch('https://getlumbus.com/api/rewards/wallet', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Response:**
```json
{
  "balance_mb": 5120,
  "balance_gb": "5.00",
  "pending_rewards": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "amount_mb": 500,
      "status": "PENDING",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "applied_rewards": [],
  "recent_transactions": []
}
```

---

### 13. Redeem Wallet Credit (Authenticated)

**POST** `/rewards/redeem`

Apply data wallet credit to a purchase.

**Authentication:** Required

**Request Body:**
```json
{
  "orderId": "660e8400-e29b-41d4-a716-446655440001",
  "amountMB": 1000
}
```

**Response:**
```json
{
  "success": true,
  "new_balance_mb": 4120,
  "discount_applied": 1.99
}
```

---

### 14. Validate Discount Code (Public)

**POST** `/discount-codes/validate`

Check if a discount code is valid.

**Request Body:**
```json
{
  "code": "WELCOME10",
  "planId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "valid": true,
  "discount_percent": 10,
  "code": "WELCOME10"
}
```

---

### 15. Health Check (Public)

**GET** `/health`

Check status of all services.

**Example Request:**
```typescript
const response = await fetch('https://getlumbus.com/api/health');
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "up",
      "latency_ms": 45
    },
    "esimaccess": {
      "status": "up",
      "latency_ms": 120
    },
    "stripe": {
      "status": "up",
      "latency_ms": 80
    },
    "email": {
      "status": "up",
      "latency_ms": 60
    }
  }
}
```

---

## eSIM Installation Methods

### iOS 17.4+ (Deep Link)

For iOS 17.4 and newer, use Apple's eSIM installation deep link instead of QR codes:

```typescript
import { Linking, Platform } from 'react-native';

const installEsim = async (smdp: string, activationCode: string) => {
  if (Platform.OS === 'ios') {
    const iosVersion = parseInt(Platform.Version, 10);

    if (iosVersion >= 17.4) {
      // iOS 17.4+ - Use deep link
      const lpaString = `LPA:1$${smdp}$${activationCode}`;
      const encodedLPA = encodeURIComponent(lpaString);
      const deepLink = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodedLPA}`;

      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        // Fallback to web page
        await Linking.openURL(`https://getlumbus.com/install/${orderId}`);
      }
    } else {
      // Older iOS - Link to web page
      await Linking.openURL(`https://getlumbus.com/install/${orderId}`);
    }
  } else {
    // Android - Link to web page
    await Linking.openURL(`https://getlumbus.com/install/${orderId}`);
  }
};
```

### Android (Manual Entry)

Android doesn't support deep linking for eSIM installation. Guide users to:

1. Open **Settings** → **Network & Internet** → **SIMs** → **Add eSIM**
2. Choose **"Enter activation code"**
3. Provide the LPA string: `LPA:1$${smdp}$${activationCode}`

Or link them to the web page with the QR code.

---

## Push Notifications

Configure push notifications to alert users when their eSIM is ready.

### When to Send Notifications

1. **eSIM Ready** - When order status changes to `completed`
2. **Low Data Warning** - When usage reaches 80%
3. **Data Depleted** - When usage reaches 100%
4. **Top-Up Success** - After top-up completes

### Example: Expo Push Notifications

```typescript
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push tokens
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const token = await Notifications.getExpoPushTokenAsync();

  // Send token to backend (you'll need to create this endpoint)
  await fetch('https://getlumbus.com/api/user/push-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pushToken: token.data }),
  });
}
```

---

## Missing Endpoints (Need to Create)

### Critical

1. **GET `/user/me`** - Get current user profile
2. **GET `/user/orders`** - List all user's orders
3. **POST `/user/push-token`** - Register push notification token
4. **DELETE `/orders/[orderId]`** - Cancel pending order (if payment fails)

### Nice to Have

5. **PATCH `/user/me`** - Update user profile
6. **POST `/user/password`** - Set/change password
7. **GET `/orders/[orderId]/history`** - Get top-up history for an eSIM
8. **POST `/feedback`** - Submit app feedback/support request

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here",
  "details": "Additional details (development only)"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid request body/params
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - User doesn't have access
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service is down (health check)

---

## Rate Limiting

**Current Status:** ❌ Not implemented

**Recommended:** Add rate limiting using Vercel KV or Upstash Redis:

- `/checkout`: 5 requests per minute per IP
- `/plans`: 60 requests per minute per IP
- `/orders/[orderId]/usage`: 10 requests per minute per user

---

## Webhooks (Backend Only)

These endpoints handle webhooks from third-party services:

- **POST `/stripe/webhook`** - Stripe payment webhooks
- **POST `/esimaccess/webhook`** - eSIM Access status updates

**Do not call these from your mobile app!**

---

## Best Practices

### 1. Cache Plans Data

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const getCachedPlans = async () => {
  const cached = await AsyncStorage.getItem('plans');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }

  // Fetch fresh data
  const response = await fetch('https://getlumbus.com/api/plans');
  const data = await response.json();

  await AsyncStorage.setItem('plans', JSON.stringify({
    data,
    timestamp: Date.now(),
  }));

  return data;
};
```

### 2. Handle Offline Mode

```typescript
import NetInfo from '@react-native-community/netinfo';

const makeApiCall = async (url: string, options?: RequestInit) => {
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    throw new Error('No internet connection');
  }

  return fetch(url, options);
};
```

### 3. Secure Token Storage

```typescript
import * as SecureStore from 'expo-secure-store';

// Save token
await SecureStore.setItemAsync('userToken', token);

// Retrieve token
const token = await SecureStore.getItemAsync('userToken');

// Delete token
await SecureStore.deleteItemAsync('userToken');
```

### 4. Poll for Order Status

After payment, poll the order endpoint until status is `completed`:

```typescript
const pollOrderStatus = async (orderId: string) => {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes (5s intervals)

  while (attempts < maxAttempts) {
    const response = await fetch(
      `https://getlumbus.com/api/orders/${orderId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    const order = await response.json();

    if (order.status === 'completed' && order.hasActivationDetails) {
      return order;
    }

    if (order.status === 'failed') {
      throw new Error('eSIM provisioning failed');
    }

    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Timeout waiting for eSIM');
};
```

---

## Example: Complete Purchase Flow (Auth-First)

```typescript
import { useStripe } from '@stripe/stripe-react-native';

const PurchaseScreen = ({ route }) => {
  const { plan } = route.params;
  const { confirmPayment } = useStripe();
  const { session } = useAuth(); // User is already authenticated

  const purchaseEsim = async () => {
    try {
      // User is already authenticated, so we have their email and token
      const token = session.access_token;
      const email = session.user.email;

      // 1. Detect user's currency
      const currencyResponse = await fetch('https://getlumbus.com/api/currency/detect', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const { currency } = await currencyResponse.json();

      // 2. Create payment intent
      const checkoutResponse = await fetch('https://getlumbus.com/api/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          email,
          currency,
        }),
      });

      const { clientSecret, orderId } = await checkoutResponse.json();

      // 3. Show Stripe Payment Sheet
      const { error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Payment failed', error.message);
        return;
      }

      // 4. Poll for eSIM provisioning
      showLoading('Provisioning your eSIM...');

      const order = await pollOrderStatus(orderId, token);

      hideLoading();

      // 5. Show installation options
      navigation.navigate('InstallEsim', {
        orderId: order.id,
        smdp: order.smdp,
        activationCode: order.activationCode,
      });

    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>Plan: {plan.name}</Text>
      <Text>Price: ${plan.retail_price}</Text>
      <Button title="Purchase" onPress={purchaseEsim} />
    </View>
  );
};

// Helper function for polling (updated to include token)
const pollOrderStatus = async (orderId: string, token: string) => {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes

  while (attempts < maxAttempts) {
    const response = await fetch(
      `https://getlumbus.com/api/orders/${orderId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    const order = await response.json();

    if (order.status === 'completed' && order.hasActivationDetails) {
      return order;
    }

    if (order.status === 'failed') {
      throw new Error('eSIM provisioning failed');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Timeout waiting for eSIM');
};
```

---

## Testing

### Development Server

```bash
# Start local server
npm run dev

# Use ngrok for mobile testing
npx ngrok http 3000

# Update API base URL in app
const API_URL = 'https://abc123.ngrok.io/api';
```

### Stripe Test Mode

Use test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0027 6000 3184

---

## Support

- **API Issues:** Check `/api/health` endpoint
- **Payment Issues:** Check Stripe Dashboard
- **eSIM Issues:** Contact eSIM Access support
- **Email Issues:** Check Resend Dashboard

---

**Last Updated:** October 18, 2025
**API Version:** 1.0
**Mobile App Compatibility:** React Native (Expo)
