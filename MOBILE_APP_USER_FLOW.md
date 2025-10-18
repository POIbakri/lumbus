# Lumbus Mobile App - User Flow & Architecture

Visual guide to the mobile app user experience and API integration.

---

## User Journey: Auth-First Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    APP LAUNCH                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │ Has Session?   │
          └────┬───────┬───┘
               │       │
           NO  │       │  YES
               │       │
               ▼       ▼
    ┌──────────────┐  ┌──────────────┐
    │ AUTH SCREENS │  │  MAIN APP    │
    │              │  │  (Tabs)      │
    │ • Sign Up    │  │              │
    │ • Login      │  │ • Home       │
    │              │  │ • My eSIMs   │
    └──────┬───────┘  │ • Referrals  │
           │          │ • Profile    │
           │          └──────────────┘
           │
           └─────────────┐
                         │
                    LOGIN SUCCESS
                         │
                         ▼
              ┌──────────────────┐
              │   HOME SCREEN    │
              │                  │
              │ Browse Plans     │
              │ Search Countries │
              │ View Offers      │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  PLAN DETAILS    │
              │                  │
              │ • Region         │
              │ • Data Amount    │
              │ • Validity       │
              │ • Price          │
              │                  │
              │ [BUY NOW]        │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   CHECKOUT       │
              │                  │
              │ Stripe Payment   │
              │ Apple Pay        │
              │ Google Pay       │
              │                  │
              └────────┬─────────┘
                       │
                 PAYMENT SUCCESS
                       │
                       ▼
              ┌──────────────────┐
              │  PROVISIONING    │
              │                  │
              │ Poll API every   │
              │ 5 seconds until  │
              │ status='completed│
              │                  │
              └────────┬─────────┘
                       │
                ESIM READY
                       │
                       ▼
              ┌──────────────────┐
              │ INSTALL ESIM     │
              │                  │
              │ iOS 17.4+:       │
              │ → Deep Link      │
              │                  │
              │ Older/Android:   │
              │ → Web Page       │
              │                  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  MY ESIMS TAB    │
              │                  │
              │ • View Usage     │
              │ • Top Up         │
              │ • Manage         │
              │                  │
              └──────────────────┘
```

---

## Screen Architecture

### Auth Stack (Not Logged In)

```
AuthStack
├── WelcomeScreen
│   ├── App logo
│   ├── Tagline
│   └── [Sign Up] [Login]
│
├── SignUpScreen
│   ├── Email input
│   ├── Password input
│   ├── [Create Account]
│   └── Already have account? → Login
│
└── LoginScreen
    ├── Email input
    ├── Password input
    ├── [Sign In]
    └── Need account? → Sign Up
```

### Main Stack (Logged In)

```
MainTabs
├── HomeTab
│   ├── HomeScreen (Browse Plans)
│   │   ├── Search bar
│   │   ├── Filter chips (Region, Data, Price)
│   │   ├── Featured plans
│   │   └── All plans grid
│   │
│   ├── PlanDetailsScreen
│   │   ├── Plan info card
│   │   ├── Coverage map
│   │   ├── Features list
│   │   └── [Buy Now] button
│   │
│   ├── CheckoutScreen
│   │   ├── Order summary
│   │   ├── Stripe Payment Sheet
│   │   └── Loading state
│   │
│   └── InstallEsimScreen
│       ├── QR code (fallback)
│       ├── [Install on iPhone] (iOS 17.4+)
│       ├── Manual instructions
│       └── [Done]
│
├── MyEsimsTab
│   ├── DashboardScreen (My eSIMs)
│   │   ├── Active eSIMs list
│   │   │   ├── Plan name
│   │   │   ├── Usage bar
│   │   │   └── [Top Up] button
│   │   └── Past orders
│   │
│   ├── EsimDetailsScreen
│   │   ├── Usage chart
│   │   ├── Data remaining
│   │   ├── Validity countdown
│   │   ├── [Refresh Usage]
│   │   └── [Top Up]
│   │
│   └── TopUpScreen
│       ├── Current eSIM info
│       ├── Available top-up plans
│       └── [Purchase Top-Up]
│
├── ReferralsTab
│   ├── ReferralsScreen
│   │   ├── Your referral code
│   │   ├── Referral link
│   │   ├── [Share] button
│   │   ├── Stats (referrals, rewards)
│   │   └── Recent referrals list
│   │
│   └── WalletScreen
│       ├── Data wallet balance
│       ├── Pending rewards
│       ├── Transaction history
│       └── [Redeem] button
│
└── ProfileTab
    ├── ProfileScreen
    │   ├── User info (email, name)
    │   ├── Settings
    │   ├── Help & Support
    │   ├── About
    │   └── [Log Out]
    │
    └── SupportScreen
        ├── FAQs
        ├── Contact form
        └── Live chat (future)
```

---

## API Integration by Screen

### Authentication Screens

**WelcomeScreen**
- No API calls

**SignUpScreen**
```typescript
// Supabase Auth (not our API)
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});
```

**LoginScreen**
```typescript
// Supabase Auth (not our API)
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

---

### Home Tab Screens

**HomeScreen**
```typescript
// GET /api/plans
const { plans } = await api.getPlans();

// GET /api/plans?region=JP
const { plans } = await api.getPlans({ region: 'JP' });

// GET /api/plans?search=Europe
const { plans } = await api.getPlans({ search: 'Europe' });
```

**PlanDetailsScreen**
```typescript
// GET /api/plans/[planId]
const plan = await api.getPlan(planId);

// GET /api/currency/detect
const { currency } = await api.detectCurrency();
```

**CheckoutScreen**
```typescript
// POST /api/checkout
const { clientSecret, orderId } = await api.createCheckout(
  planId,
  currency
);

// Stripe Payment Sheet (client-side)
const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});
```

**InstallEsimScreen**
```typescript
// GET /api/orders/[orderId]
const order = await api.getOrder(orderId);

// iOS 17.4+ Deep Link
const lpaString = `LPA:1$${order.smdp}$${order.activationCode}`;
const deepLink = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodedLPA}`;
await Linking.openURL(deepLink);

// Fallback: GET /api/qr/[orderId]
const qrUrl = `https://getlumbus.com/api/qr/${orderId}`;
```

---

### My eSIMs Tab Screens

**DashboardScreen**
```typescript
// GET /api/user/orders (TO BE CREATED)
const { orders } = await api.getUserOrders();
```

**EsimDetailsScreen**
```typescript
// GET /api/orders/[orderId]
const order = await api.getOrder(orderId);

// GET /api/orders/[orderId]/usage
const usage = await api.getOrderUsage(orderId);

// Poll every 30 seconds while screen is focused
useEffect(() => {
  const interval = setInterval(() => {
    refreshUsage();
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

**TopUpScreen**
```typescript
// GET /api/plans?region=[current_region]
const { plans } = await api.getPlans({ region: order.plan.region_code });

// POST /api/checkout/session
const { url } = await api.createTopUp(planId, orderId, iccid);
await Linking.openURL(url); // Open Stripe checkout in browser
```

---

### Referrals Tab Screens

**ReferralsScreen**
```typescript
// GET /api/referrals/me
const { ref_code, stats, referral_link } = await api.getReferrals();

// Share referral link
await Share.share({
  message: `Get 10% off your first eSIM with Lumbus! ${referral_link}`,
});
```

**WalletScreen**
```typescript
// GET /api/rewards/wallet
const { balance_mb, pending_rewards, recent_transactions } = await api.getWallet();

// POST /api/rewards/redeem
const result = await api.redeemWallet(orderId, amountMB);
```

---

### Profile Tab Screens

**ProfileScreen**
```typescript
// GET /api/user/me (TO BE CREATED)
const user = await api.getUserProfile();

// Supabase Auth (logout)
await supabase.auth.signOut();
```

**SupportScreen**
```typescript
// POST /api/feedback (TO BE CREATED)
await api.submitFeedback({
  subject: 'App Feedback',
  message: 'Great app!',
});
```

---

## State Management Recommendations

### Option 1: Context API (Simple)

```typescript
// contexts/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Option 2: Zustand (Recommended)

```typescript
// stores/authStore.ts
import create from 'zustand';

export const useAuthStore = create((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
```

```typescript
// stores/plansStore.ts
export const usePlansStore = create((set) => ({
  plans: [],
  loading: false,
  fetchPlans: async (filters) => {
    set({ loading: true });
    const { plans } = await api.getPlans(filters);
    set({ plans, loading: false });
  },
}));
```

---

## Offline Support

### Cache Plans Data

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  PLANS: 'lumbus_plans',
  USER_ORDERS: 'lumbus_user_orders',
};

export const cacheManager = {
  // Set cache with TTL
  set: async (key: string, data: any, ttlMinutes: number = 5) => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  },

  // Get cache if not expired
  get: async (key: string) => {
    const item = await AsyncStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp, ttl } = JSON.parse(item);
    if (Date.now() - timestamp > ttl) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data;
  },

  // Clear all cache
  clear: async () => {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  },
};
```

### Network Detection

```typescript
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};
```

---

## Push Notifications Setup

### Register for Push Notifications

```typescript
// utils/notifications.ts
import * as Notifications from 'expo-notifications';

export const registerForPushNotifications = async () => {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    return null;
  }

  // Get Expo push token
  const token = await Notifications.getExpoPushTokenAsync();

  // Send to backend (TO BE CREATED: POST /api/user/push-token)
  await api.registerPushToken(token.data);

  return token.data;
};
```

### Handle Notifications

```typescript
// App.tsx
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for notifications
const notificationListener = Notifications.addNotificationReceivedListener(
  notification => {
    const { type, orderId } = notification.request.content.data;

    if (type === 'esim_ready') {
      // Navigate to install screen
      navigation.navigate('InstallEsim', { orderId });
    }
  }
);
```

---

## Testing Checklist

### Authentication
- [ ] Sign up with new email
- [ ] Login with existing account
- [ ] Auto-login on app relaunch
- [ ] Logout
- [ ] Session expiry handling

### Browse & Purchase
- [ ] Load all plans
- [ ] Filter by region
- [ ] Search by country name
- [ ] View plan details
- [ ] Checkout with test card
- [ ] Apple Pay (iOS)
- [ ] Google Pay (Android)
- [ ] Payment failure handling

### Order Management
- [ ] View order history
- [ ] View order details
- [ ] Real-time usage refresh
- [ ] Install eSIM (iOS 17.4+ deep link)
- [ ] Install eSIM (web fallback)
- [ ] Poll order status until completed

### Top-Up
- [ ] View available top-up plans
- [ ] Purchase top-up
- [ ] Data added to existing eSIM
- [ ] No reinstallation required

### Referrals & Rewards
- [ ] View referral code
- [ ] Share referral link
- [ ] View referral stats
- [ ] View wallet balance
- [ ] Redeem wallet credit

---

## Performance Benchmarks

### Target Metrics
- **App launch:** < 2 seconds to auth screen
- **Plans load:** < 1 second from cache, < 3 seconds from API
- **Order status poll:** Every 5 seconds, max 5 minutes
- **Usage refresh:** < 2 seconds

### Optimization Tips
1. Use `FlatList` with `windowSize` for long lists
2. Implement pull-to-refresh for data updates
3. Use `React.memo` for plan cards
4. Lazy load images with `react-native-fast-image`
5. Cache API responses with TTL

---

**Last Updated:** October 18, 2025
**App Architecture:** React Native (Expo)
**Backend:** Next.js 15.5.4 API Routes
**Authentication:** Supabase Auth
**Payments:** Stripe Payment Sheet
**eSIM Provider:** eSIM Access API
