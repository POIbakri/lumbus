# 🎯 Lumbus eSIM - React Native App Build Plan

## **Tech Stack (Optimized for Speed & Reliability)**

```
✅ Expo (managed workflow) - Zero native configuration needed
✅ TypeScript - Type safety, catch errors early
✅ React Navigation v6 - Industry standard navigation
✅ Supabase JS Client - Your existing auth & database
✅ Stripe React Native - Official Stripe SDK
✅ React Query - API caching & state management
✅ NativeWind (Tailwind) - Same styling as website
✅ expo-qrcode-svg - QR code generation for eSIM
✅ expo-sharing - Share eSIM details
```

---

## **Project Structure**

```
lumbus-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup screen
│   ├── (tabs)/                   # Bottom tabs for authenticated users
│   │   ├── browse.tsx           # Browse plans
│   │   ├── dashboard.tsx        # Current usage & orders
│   │   └── account.tsx          # Account settings
│   ├── plan/[id].tsx            # Plan detail & checkout
│   ├── esim/
│   │   ├── install.tsx          # eSIM installation (QR code)
│   │   ├── manual.tsx           # Manual installation guide
│   │   └── help.tsx             # Installation help by device
│   └── _layout.tsx              # Root layout with auth check
├── components/
│   ├── PlanCard.tsx             # Reusable plan card
│   ├── UsageChart.tsx           # Data usage visualization
│   ├── StripeCheckout.tsx       # Stripe payment sheet
│   ├── QRCodeDisplay.tsx        # eSIM QR code component
│   └── InstallationSteps.tsx   # Step-by-step install guide
├── lib/
│   ├── supabase.ts              # Supabase client config
│   ├── stripe.ts                # Stripe client config
│   └── api.ts                   # API helper functions
├── types/
│   └── index.ts                 # TypeScript types (reuse from web)
└── app.json                     # Expo configuration
```

---

## **Screen Breakdown (9 Screens Total)**

### **1. Login Screen** (`app/(auth)/login.tsx`)
```typescript
Features:
- Email/password input
- "Forgot password?" link
- "Sign up" link
- Supabase auth.signInWithPassword()
- Auto-redirect to dashboard on success
- Error handling with clear messages

Design:
- Clean white background
- Lumbus logo at top
- Large input fields (mobile-optimized)
- Primary green button
- Loading state during auth
```

### **2. Signup Screen** (`app/(auth)/signup.tsx`)
```typescript
Features:
- Email/password input
- Terms acceptance checkbox
- Supabase auth.signUp()
- Email verification flow
- Auto-login after signup

Validation:
- Email format check
- Password strength indicator
- Matching password confirmation
```

### **3. Browse Plans** (`app/(tabs)/browse.tsx`)
```typescript
Features:
- Search bar (filter by country/region)
- Region tabs (Europe, Asia, Americas, etc.)
- Plan cards in grid (2 columns)
- Pull-to-refresh
- Infinite scroll (pagination)

API Call:
GET https://getlumbus.com/api/plans

Card Shows:
- Country flag + name
- Data amount (1GB, 3GB, etc.)
- Validity period
- Price (prominent)
- "Buy Now" button
```

### **4. Plan Detail & Checkout** (`app/plan/[id].tsx`)
```typescript
Features:
- Plan details (data, validity, coverage)
- Price breakdown
- Apply discount/referral code input
- Stripe Payment Sheet (native)
- Purchase button
- Loading states

Flow:
1. Tap plan card → Navigate here
2. User reviews plan
3. Optionally enters promo code
4. Taps "Purchase"
5. Stripe sheet appears (native UI)
6. Payment processes
7. Success → Navigate to eSIM installation
8. Order shows as "Provisioning"

API Calls:
- GET /api/plans/[id]
- POST /api/checkout/session (get Stripe client secret)
- Stripe presentPaymentSheet()
```

### **5. Dashboard** (`app/(tabs)/dashboard.tsx`)
```typescript
Features:
- Current active plan section:
  - Data usage circular progress
  - Days remaining
  - Plan name & country
  - Install eSIM button (if not installed)
  - QR code to install eSIM
  - Top-up button

- Order history list:
  - Past orders with status
  - Date, plan name, amount
  - Tap to view eSIM details
  - Re-download QR code

API Calls:
- GET /api/user/orders (filtered by user_id)
- Real-time updates via Supabase subscription

Sections:
┌─────────────────────────────┐
│  🌍 Active Plan             │
│  Europe eSIM - 3GB          │
│  ○ 2.1GB / 3GB used         │
│  📅 5 days remaining        │
│                             │
│  [Install eSIM]  [Top Up]  │
│                             │
│  Status: Provisioning       │
│  or                         │
│  Status: Ready to Install   │
│  [View QR Code]             │
└─────────────────────────────┘

┌─────────────────────────────┐
│  📋 Order History           │
│  ─────────────────────      │
│  🇫🇷 France 1GB  $4.99      │
│  Oct 15, 2025 • Completed   │
│  [View eSIM]                │
│  ─────────────────────      │
│  🇪🇸 Spain 3GB   $12.99     │
│  Oct 1, 2025 • Completed    │
│  [View eSIM]                │
└─────────────────────────────┘
```

### **6. eSIM Installation - QR Code** (`app/esim/install.tsx`)
```typescript
Features:
- Large QR code display (scannable)
- eSIM activation code below QR (for copy)
- "Copy Activation Code" button
- "Share" button (share QR as image)
- Installation status indicator
- Step-by-step instructions below

Layout:
┌─────────────────────────────┐
│  📱 Install Your eSIM       │
│  ─────────────────────      │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   [QR CODE HERE]    │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Activation Code:           │
│  LPA:1$rsp.truphone...      │
│  [Copy Code]  [Share]       │
│                             │
│  ─────────────────────      │
│  📖 How to Install:         │
│                             │
│  1️⃣ Open Settings on       │
│     your phone              │
│  2️⃣ Tap "Mobile Data" or   │
│     "Cellular"              │
│  3️⃣ Select "Add eSIM"      │
│  4️⃣ Scan this QR code      │
│  5️⃣ Follow the prompts     │
│                             │
│  [Need Help?]               │
│  [Manual Entry Instead]     │
└─────────────────────────────┘

Components:
- QRCode component from expo-qrcode-svg
- Share button uses expo-sharing
- Copy button uses expo-clipboard
- Navigate to help screen if needed
- Navigate to manual entry if camera doesn't work

Data from API:
- Order details with qr_code, iccid, activation_code
- GET /api/orders/[id] or from Supabase subscription
```

### **7. eSIM Manual Installation** (`app/esim/manual.tsx`)
```typescript
Features:
- Step-by-step manual entry instructions
- All required fields displayed (can copy each)
- Device-specific instructions (iOS vs Android)
- Visual guide with screenshots

Layout:
┌─────────────────────────────┐
│  ⚙️ Manual eSIM Setup       │
│  ─────────────────────      │
│                             │
│  If you can't scan the QR   │
│  code, enter these details  │
│  manually:                  │
│                             │
│  SM-DP+ Address:            │
│  ┌─────────────────────┐   │
│  │ rsp.truphone.com    │   │
│  └─────────────────────┘   │
│  [Copy]                     │
│                             │
│  Activation Code:           │
│  ┌─────────────────────┐   │
│  │ ABC123XYZ...        │   │
│  └─────────────────────┘   │
│  [Copy]                     │
│                             │
│  Confirmation Code:         │
│  ┌─────────────────────┐   │
│  │ (if required)       │   │
│  └─────────────────────┘   │
│  [Copy]                     │
│                             │
│  ─────────────────────      │
│  📱 Installation Steps:     │
│                             │
│  iOS:                       │
│  1. Settings → Cellular     │
│  2. Add Cellular Plan       │
│  3. Enter Details Manually  │
│  4. Paste SM-DP+ address    │
│  5. Paste Activation Code   │
│                             │
│  Android:                   │
│  1. Settings → Network      │
│  2. Mobile Network          │
│  3. Download SIM            │
│  4. Enter SM-DP+ address    │
│  5. Enter Activation Code   │
│                             │
│  [View Device Help]         │
└─────────────────────────────┘
```

### **8. Device-Specific Help** (`app/esim/help.tsx`)
```typescript
Features:
- Accordion/expandable sections for each device type
- Screenshots for each step
- Video tutorials (embedded or links)
- Troubleshooting section

Sections:
- iPhone (iOS 15+)
- iPhone (iOS 16+)
- Samsung Galaxy
- Google Pixel
- Other Android devices
- Common issues & fixes

Layout:
┌─────────────────────────────┐
│  📚 Installation Guide      │
│  ─────────────────────      │
│                             │
│  Select Your Device:        │
│                             │
│  ▼ iPhone                   │
│    For iPhone XS and newer  │
│    [Expand for steps]       │
│                             │
│  ▶ Samsung Galaxy          │
│                             │
│  ▶ Google Pixel            │
│                             │
│  ▶ Other Android           │
│                             │
│  ─────────────────────      │
│  ❓ Troubleshooting         │
│                             │
│  • eSIM not appearing?      │
│  • Can't scan QR code?      │
│  • Installation failed?     │
│  • No network connection?   │
│                             │
│  [Contact Support]          │
└─────────────────────────────┘

Content:
- Store in constants or fetch from API
- Include screenshots (stored in assets)
- Add device detection (iOS vs Android)
- Automatically expand relevant section
```

### **9. Account** (`app/(tabs)/account.tsx`)
```typescript
Features:
- Profile info (email, name)
- Referral code (with share button)
- Settings:
  - Notifications
  - Currency preference
  - Language
- Help & Support
  - eSIM Installation Help
  - FAQs
  - Contact Support
- Logout button

Simple list-based UI
```

---

## **eSIM Flow Integration**

### **Complete User Journey:**

```
1. User Purchases Plan
   ↓
2. Payment Succeeds (Stripe)
   ↓
3. Webhook processes order
   ↓
4. eSIM provisioned via eSIM Access API
   ↓
5. App receives order_status webhook
   ↓
6. Order status updates to "completed"
   ↓
7. App navigates to eSIM Install screen
   ↓
8. User sees QR code + instructions
   ↓
9. User scans QR or enters manually
   ↓
10. eSIM installed on device
    ↓
11. User can view eSIM in dashboard
    ↓
12. Real-time usage tracking begins
```

### **Dashboard eSIM Status States:**

```typescript
type eSIMStatus =
  | 'provisioning'    // Waiting for eSIM from supplier
  | 'ready'           // QR code available, not installed
  | 'installed'       // User confirmed installation
  | 'active'          // eSIM active, using data
  | 'expired'         // Validity period ended
  | 'depleted';       // Data fully used

// UI shows different actions based on status:
switch (status) {
  case 'provisioning':
    return <Text>Your eSIM is being prepared...</Text>;

  case 'ready':
    return (
      <Button onPress={() => router.push('/esim/install')}>
        Install eSIM
      </Button>
    );

  case 'installed':
  case 'active':
    return (
      <>
        <UsageChart data={order.data_usage_bytes} total={order.plan.data_gb} />
        <Button onPress={() => router.push('/esim/install')}>
          View QR Code
        </Button>
      </>
    );

  case 'expired':
  case 'depleted':
    return <Button>Top Up</Button>;
}
```

---

## **API Integration Layer** (`lib/api.ts`)

```typescript
import { supabase } from './supabase';

// All API functions in one file
export const api = {
  // Plans
  async getPlans(region?: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('retail_price', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getPlanById(id: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Orders
  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOrderDetails(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  // Checkout
  async createCheckoutSession(planId: string, discountCode?: string, referralCode?: string) {
    const response = await fetch('https://getlumbus.com/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, discountCode, referralCode }),
    });

    if (!response.ok) throw new Error('Checkout failed');
    return response.json();
  },

  // Validate discount code
  async validateDiscountCode(code: string, userId: string) {
    const response = await fetch('https://getlumbus.com/api/discount-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId }),
    });

    return response.json();
  },

  // Subscribe to order updates (real-time)
  subscribeToOrderUpdates(orderId: string, callback: (order: any) => void) {
    return supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },
};
```

---

## **QR Code Component** (`components/QRCodeDisplay.tsx`)

```typescript
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useRef } from 'react';

interface Props {
  qrCode: string;           // Full LPA string
  activationCode: string;   // Just the activation code part
  iccid: string;           // SIM identifier
}

export function QRCodeDisplay({ qrCode, activationCode, iccid }: Props) {
  const qrRef = useRef<View>(null);

  const copyCode = async () => {
    await Clipboard.setStringAsync(activationCode);
    Alert.alert('Copied!', 'Activation code copied to clipboard');
  };

  const shareQR = async () => {
    try {
      // Capture QR code as image
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      // Share image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share eSIM QR Code',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  return (
    <View className="items-center py-6">
      {/* QR Code */}
      <View ref={qrRef} className="bg-white p-6 rounded-lg shadow-lg">
        <QRCode
          value={qrCode}
          size={250}
          backgroundColor="white"
          color="black"
        />
      </View>

      {/* Activation Code */}
      <View className="mt-6 w-full px-6">
        <Text className="text-sm font-bold text-gray-600 mb-2">
          Activation Code:
        </Text>
        <View className="bg-gray-100 p-4 rounded-lg">
          <Text className="font-mono text-xs" selectable>
            {activationCode}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3 mt-4 px-6">
        <TouchableOpacity
          onPress={copyCode}
          className="flex-1 bg-primary p-4 rounded-lg items-center"
        >
          <Text className="text-white font-black uppercase">Copy Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={shareQR}
          className="flex-1 bg-secondary p-4 rounded-lg items-center"
        >
          <Text className="text-foreground font-black uppercase">Share</Text>
        </TouchableOpacity>
      </View>

      {/* ICCID Reference */}
      <Text className="text-xs text-gray-500 mt-4">
        SIM ID: {iccid}
      </Text>
    </View>
  );
}
```

---

## **Installation Instructions Component** (`components/InstallationSteps.tsx`)

```typescript
import { View, Text, ScrollView, Platform } from 'react-native';

interface Step {
  number: number;
  title: string;
  description: string;
}

export function InstallationSteps() {
  const iosSteps: Step[] = [
    {
      number: 1,
      title: 'Open Settings',
      description: 'Tap the Settings app on your iPhone',
    },
    {
      number: 2,
      title: 'Go to Cellular/Mobile Data',
      description: 'Scroll down and tap "Cellular" or "Mobile Data"',
    },
    {
      number: 3,
      title: 'Add Cellular Plan',
      description: 'Tap "Add Cellular Plan" or "Add eSIM"',
    },
    {
      number: 4,
      title: 'Scan QR Code',
      description: 'Point your camera at the QR code above',
    },
    {
      number: 5,
      title: 'Activate eSIM',
      description: 'Tap "Add Cellular Plan" and follow the prompts',
    },
    {
      number: 6,
      title: 'Label Your Plan',
      description: 'Give your eSIM a name (e.g., "Travel eSIM")',
    },
    {
      number: 7,
      title: 'Turn On Data Roaming',
      description: 'Enable data roaming for your new eSIM',
    },
  ];

  const androidSteps: Step[] = [
    {
      number: 1,
      title: 'Open Settings',
      description: 'Open the Settings app on your Android device',
    },
    {
      number: 2,
      title: 'Network & Internet',
      description: 'Tap "Network & Internet" or "Connections"',
    },
    {
      number: 3,
      title: 'Mobile Network',
      description: 'Tap "Mobile Network" or "SIM Manager"',
    },
    {
      number: 4,
      title: 'Add Carrier/Download SIM',
      description: 'Tap "Add Carrier" or "Download a SIM"',
    },
    {
      number: 5,
      title: 'Scan QR Code',
      description: 'Use your camera to scan the QR code above',
    },
    {
      number: 6,
      title: 'Activate eSIM',
      description: 'Tap "Download" and wait for activation',
    },
    {
      number: 7,
      title: 'Enable Data Roaming',
      description: 'Turn on data roaming for your new eSIM',
    },
  ];

  const steps = Platform.OS === 'ios' ? iosSteps : androidSteps;

  return (
    <View className="px-6 py-4">
      <Text className="text-xl font-black uppercase mb-4">
        📖 Installation Steps ({Platform.OS === 'ios' ? 'iPhone' : 'Android'})
      </Text>

      {steps.map((step) => (
        <View key={step.number} className="flex-row mb-4">
          {/* Step Number */}
          <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-3">
            <Text className="text-white font-black">{step.number}</Text>
          </View>

          {/* Step Content */}
          <View className="flex-1">
            <Text className="font-black text-base mb-1">{step.title}</Text>
            <Text className="text-gray-600 text-sm">{step.description}</Text>
          </View>
        </View>
      ))}

      {/* Tips */}
      <View className="mt-6 bg-yellow/10 border-2 border-yellow p-4 rounded-lg">
        <Text className="font-black mb-2">💡 Tips:</Text>
        <Text className="text-sm text-gray-700">
          • Make sure you have a stable internet connection{'\n'}
          • Keep this screen open during installation{'\n'}
          • Your eSIM will be active immediately after installation{'\n'}
          • You can manage multiple eSIMs on your device
        </Text>
      </View>
    </View>
  );
}
```

---

## **Authentication Flow** (`app/_layout.tsx`)

```typescript
import { useEffect, useState } from 'react';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SIpVDHqtxSfzV1t...'; // Your key

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check existing session
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

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to dashboard if authenticated but in auth screens
      router.replace('/(tabs)/dashboard');
    }
  }, [session, segments, loading]);

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <Text className="text-white text-4xl font-black">LUMBUS</Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </StripeProvider>
  );
}
```

---

## **Stripe Integration** (`components/StripeCheckout.tsx`)

```typescript
import { useState } from 'react';
import { Alert, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';

interface Props {
  planId: string;
  discountCode?: string;
  referralCode?: string;
}

export function StripeCheckout({ planId, discountCode, referralCode }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // 1. Create checkout session (get client secret)
      const { clientSecret, sessionId, orderId } = await api.createCheckoutSession(
        planId,
        discountCode,
        referralCode
      );

      // 2. Initialize Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Lumbus eSIM',
        allowsDelayedPaymentMethods: false,
        returnURL: 'lumbus://payment-complete',
        style: 'alwaysDark', // or 'alwaysLight' or 'automatic'
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        setLoading(false);
        return;
      }

      // 3. Present Payment Sheet (native UI)
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment Cancelled', presentError.message);
        setLoading(false);
        return;
      }

      // 4. Success! Navigate to order/eSIM installation
      Alert.alert(
        'Success! 🎉',
        'Your eSIM will be ready shortly. You\'ll receive an email when it\'s ready to install.',
        [
          {
            text: 'View Order',
            onPress: () => router.push(`/esim/install?orderId=${orderId}`),
          },
        ]
      );
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleCheckout}
      disabled={loading}
      className="bg-primary p-5 rounded-lg items-center shadow-lg"
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className="text-white font-black text-lg uppercase">
          Complete Purchase
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

---

## **Real-Time Order Updates** (`hooks/useOrderUpdates.ts`)

```typescript
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useOrderUpdates(orderId: string) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    api.getOrderDetails(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));

    // Subscribe to real-time updates
    const subscription: RealtimeChannel = api.subscribeToOrderUpdates(
      orderId,
      (updatedOrder) => {
        console.log('Order updated:', updatedOrder);
        setOrder(updatedOrder);

        // Show notification if status changed to 'completed'
        if (updatedOrder.status === 'completed' && order?.status !== 'completed') {
          Alert.alert(
            'eSIM Ready! 🎉',
            'Your eSIM is ready to install. Tap to view installation instructions.',
            [
              {
                text: 'Install Now',
                onPress: () => router.push(`/esim/install?orderId=${orderId}`),
              },
            ]
          );
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  return { order, loading };
}
```

---

## **Complete eSIM Installation Screen** (`app/esim/install.tsx`)

```typescript
import { View, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { InstallationSteps } from '@/components/InstallationSteps';
import { ActivityIndicator } from 'react-native';

export default function ESIMInstallScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.getOrderDetails(orderId as string),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#00D9A0" />
        <Text className="mt-4 text-gray-600 font-bold">Loading eSIM details...</Text>
      </View>
    );
  }

  if (!order || order.status === 'provisioning') {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">⏳</Text>
        <Text className="text-2xl font-black mb-2">Preparing Your eSIM</Text>
        <Text className="text-gray-600 text-center">
          We're activating your eSIM. This usually takes 1-2 minutes.
          We'll notify you when it's ready!
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary p-4 rounded-lg"
        >
          <Text className="text-white font-black uppercase">Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order.qr_code || !order.activation_code) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">⚠️</Text>
        <Text className="text-2xl font-black mb-2">eSIM Not Available</Text>
        <Text className="text-gray-600 text-center mb-6">
          There was an issue generating your eSIM. Please contact support.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/account')}
          className="bg-primary p-4 rounded-lg"
        >
          <Text className="text-white font-black uppercase">Contact Support</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b-4 border-primary">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-black">← Back</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-black uppercase">Install Your eSIM</Text>
        <Text className="text-gray-600 font-bold mt-1">
          {order.plans?.name || 'eSIM Plan'}
        </Text>
      </View>

      {/* QR Code Display */}
      <QRCodeDisplay
        qrCode={order.qr_code}
        activationCode={order.activation_code}
        iccid={order.iccid}
      />

      {/* Installation Steps */}
      <InstallationSteps />

      {/* Help Buttons */}
      <View className="px-6 py-6 gap-3">
        <TouchableOpacity
          onPress={() => router.push('/esim/manual')}
          className="border-2 border-primary p-4 rounded-lg items-center"
        >
          <Text className="text-primary font-black uppercase">
            Manual Entry Instructions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/esim/help')}
          className="border-2 border-gray-300 p-4 rounded-lg items-center"
        >
          <Text className="text-gray-700 font-black uppercase">
            Device-Specific Help
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Need Help?',
              'Contact our support team at support@getlumbus.com or visit our help center.',
              [
                { text: 'Email Support', onPress: () => {/* Open email */} },
                { text: 'Visit Help Center', onPress: () => {/* Open browser */} },
                { text: 'Close', style: 'cancel' },
              ]
            );
          }}
          className="border-2 border-gray-300 p-4 rounded-lg items-center"
        >
          <Text className="text-gray-700 font-black uppercase">
            Contact Support
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

---

## **Setup Steps (Execute in Order)**

### **Step 1: Initialize Project** (5 min)
```bash
# Create new Expo app with TypeScript
npx create-expo-app@latest lumbus-mobile --template expo-template-blank-typescript

cd lumbus-mobile

# Install core dependencies
npx expo install expo-router react-native-safe-area-context react-native-screens
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npx expo install @stripe/stripe-react-native
npx expo install @tanstack/react-query
npx expo install react-native-svg expo-qrcode-svg
npx expo install expo-image
npx expo install nativewind tailwindcss
npx expo install expo-clipboard expo-sharing react-native-view-shot
npx expo install expo-linking # For deep linking
```

### **Step 2: Configure Supabase** (2 min)
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://qflokprwpxeynodcndbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbG9rcHJ3cHhleW5vZGNuZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTQ1MDMsImV4cCI6MjA3NjE3MDUwM30.ef9h1oSJ7eYizwPrMfeXGi57j5FKjsnBol2ww2EzpXg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### **Step 3: Configure Stripe** (2 min)
```typescript
// In app/_layout.tsx, wrap with StripeProvider
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SIpVDHqtxSfzV1toTSKPTl35biMGkzD0PoqUwTZg2hKWAOWSWNQpfQkZuZvDA8i0fsTegIi6pHXNrstIkn625FL00AYqdFng2';

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {/* Your app */}
    </StripeProvider>
  );
}
```

### **Step 4: Configure Expo** (3 min)
```json
// app.json
{
  "expo": {
    "name": "Lumbus eSIM",
    "slug": "lumbus-esim",
    "version": "1.0.0",
    "scheme": "lumbus",
    "platforms": ["ios", "android"],
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#00D9A0"
    },
    "ios": {
      "bundleIdentifier": "com.lumbus.esim",
      "buildNumber": "1.0.0",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "We need camera access to scan eSIM QR codes"
      }
    },
    "android": {
      "package": "com.lumbus.esim",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#00D9A0"
      },
      "permissions": ["CAMERA"]
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "extra": {
      "router": {
        "origin": false
      }
    }
  }
}
```

### **Step 5: Build All Screens** (3-4 days)
- Follow the screen breakdown above
- Copy TypeScript types from web app (`/lib/db.ts`)
- Reuse color scheme from website (primary: #00D9A0, etc.)
- Test each screen individually before moving to next

### **Step 6: Testing** (1 day)
```bash
# Test on iOS simulator
npx expo run:ios

# Test on Android emulator
npx expo run:android

# Test on real device (via Expo Go)
npx expo start
# Scan QR code with Expo Go app
```

**Test Checklist:**
- ✅ Login/Signup with real Supabase account
- ✅ Browse plans loads from API
- ✅ Plan detail shows correct data
- ✅ Discount code validation works
- ✅ Stripe checkout completes (use test mode first)
- ✅ eSIM installation screen shows QR code
- ✅ QR code can be scanned by device settings
- ✅ Manual installation instructions clear
- ✅ Dashboard shows orders
- ✅ Usage data displays correctly
- ✅ Real-time order updates work
- ✅ Logout works
- ✅ Deep linking works (lumbus://plan/123)

### **Step 7: Build for App Stores** (1 day)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure builds
eas build:configure

# Build for iOS (submit to App Store)
eas build --platform ios --profile production

# Build for Android (submit to Google Play)
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## **Timeline**

| Task | Time | Status |
|------|------|--------|
| **Setup & Config** | 1 hour | ⚡ Quick |
| **Auth Screens (Login/Signup)** | 4 hours | ⚡ Simple |
| **Browse Plans Screen** | 6 hours | ⚡ Medium |
| **Plan Detail + Checkout** | 8 hours | ⚠️ Most complex (Stripe) |
| **Dashboard Screen** | 6 hours | ⚡ Medium |
| **eSIM Install Screen (QR)** | 6 hours | ⚡ Medium |
| **eSIM Manual Instructions** | 3 hours | ⚡ Simple |
| **Device Help Screen** | 3 hours | ⚡ Simple |
| **Account Screen** | 2 hours | ⚡ Simple |
| **API Integration** | 4 hours | ⚡ Simple (already built) |
| **Real-time Updates** | 3 hours | ⚡ Medium |
| **Testing** | 10 hours | ⚠️ Important |
| **App Store Prep** | 4 hours | ⚡ Screenshots, descriptions |
| **Build & Submit** | 2 hours | ⚡ Automated |

**TOTAL: 62 hours = ~1.5 weeks of focused work**

---

## **Deployment Checklist**

### **Before Launch:**
- ✅ Test on iOS (physical device)
- ✅ Test on Android (physical device)
- ✅ Test payment flow (Stripe test mode → production)
- ✅ Test eSIM QR code scanning
- ✅ Test manual eSIM installation
- ✅ Test all auth flows (signup, login, logout, password reset)
- ✅ Test real-time order updates
- ✅ Prepare app store assets:
  - Icon (1024x1024)
  - Screenshots (iPhone, iPad, Android)
  - App description
  - Privacy policy URL
  - Support URL
- ✅ Set up crash reporting (Sentry)
- ✅ Configure push notifications for order status updates

### **App Store Requirements:**
**iOS:**
- Apple Developer account ($99/year)
- Privacy policy (required)
- Camera usage description (for QR scanning)
- App review (1-2 days typically)

**Android:**
- Google Play Developer account ($25 one-time)
- Privacy policy (required)
- Camera permission for QR scanning
- App review (faster, usually <24 hours)

---

## **Key eSIM Features Summary**

### **✅ What's Included:**
1. **QR Code Display** - Large, scannable QR code for eSIM installation
2. **Copy Activation Code** - One-tap copy for manual entry
3. **Share QR Code** - Share as image to other devices
4. **Step-by-Step Instructions** - Platform-specific (iOS vs Android)
5. **Manual Entry Guide** - For devices that can't scan QR codes
6. **Device-Specific Help** - Detailed guides for popular devices
7. **Real-Time Status Updates** - Know when eSIM is ready to install
8. **Installation Troubleshooting** - Common issues and solutions
9. **Multi-eSIM Support** - View all past eSIMs in order history
10. **Re-download QR Codes** - Access QR codes from past orders

### **📱 Supported Devices:**
- **iOS:** iPhone XS and newer (iOS 12.1+)
- **Android:** Pixel 3+, Samsung Galaxy S20+, and most eSIM-capable devices
- Automatic device detection to show relevant instructions

---

## **🚀 Ready to Build!**

This plan is **100% executable** and includes:
- ✅ Complete eSIM installation flow with QR codes
- ✅ Manual installation instructions
- ✅ Device-specific help guides
- ✅ Real-time order status updates
- ✅ All existing features (browse, checkout, dashboard)
- ✅ Proven technology stack
- ✅ Reuses your existing backend (zero backend work)
- ✅ Production-ready architecture

**Total Development Time: 1.5-2 weeks for a complete, production-ready app.**
