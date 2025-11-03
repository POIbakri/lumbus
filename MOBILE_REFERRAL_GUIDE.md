# 📱 Mobile App Referral System - Simple Implementation

## Overview
The mobile app referral system is **simpler** than the web version. No verification button needed - just collect the code and auto-apply.

---

## 🎯 Recommended Flow

### **1. User Receives Referral Link**
```
Shared link: https://lumbus.com/r/ABC12345
or
Deep link: lumbus://ref/ABC12345
```

### **2. App Opens → Auto-Extract Code**
```typescript
// React Native deep link handler
import { Linking } from 'react-native';

useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const url = event.url;

    // Extract referral code from URL
    const match = url.match(/\/r\/([A-Z0-9]{8})/);
    if (match) {
      const code = match[1];
      // Store in context/state
      setReferralCode(code);
      // Show banner
      setShowReferralBanner(true);
    }
  };

  Linking.addEventListener('url', handleDeepLink);

  // Check initial URL (app opened from closed state)
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });
}, []);
```

### **3. Signup/Login Screen**
```typescript
// If user is NEW (signing up)
const handleSignup = async () => {
  // 1. Create user account
  const user = await createAccount(email, password);

  // 2. Link referral code if present
  if (referralCode) {
    const result = await linkReferralCode(user.id, referralCode);
    if (result.success) {
      showToast('🎉 ' + result.message);
    }
  }

  // 3. Continue to plan selection
  navigation.navigate('Plans');
};

// API function
const linkReferralCode = async (userId: string, code: string) => {
  const response = await authenticatedPost('/api/referrals/link', {
    userId,
    referralCode: code
  });
  return response;
};
```

### **4. Plan Selection Screen**
```typescript
// Show sticky banner if referral is active
{hasReferralCode && (
  <View style={styles.referralBanner}>
    <Text style={styles.bannerEmoji}>🎉</Text>
    <Text style={styles.bannerText}>
      You're getting 10% OFF + 1GB FREE!
    </Text>
  </View>
)}

// Show discounted prices
<Text style={styles.originalPrice}>
  ${plan.price}
</Text>
<Text style={styles.discountedPrice}>
  ${(plan.price * 0.9).toFixed(2)} {/* 10% off */}
</Text>
```

### **5. Checkout**
```typescript
const handleCheckout = async () => {
  // Just pass the referral code - backend handles everything
  const response = await authenticatedPost('/api/checkout/session', {
    planId: selectedPlan.id,
    email: user.email,
    referralCode: referralCode || undefined, // Optional - backend checks profile too
  });

  // Open Stripe checkout or payment sheet
  if (response.url) {
    Linking.openURL(response.url);
  }
};
```

---

## 🔄 Alternative: Manual Entry (Fallback)

### **Signup Screen with Optional Referral Input**
```typescript
const [referralCode, setReferralCode] = useState('');
const [referralStatus, setReferralStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

// Auto-validate when user enters 8 characters
useEffect(() => {
  if (referralCode.length === 8) {
    validateReferralCode(referralCode);
  }
}, [referralCode]);

const validateReferralCode = async (code: string) => {
  const response = await fetch('/api/referral-codes/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, userId: tempUserId })
  });

  const data = await response.json();
  setReferralStatus(data.valid ? 'valid' : 'invalid');
};

return (
  <View>
    <TextInput
      placeholder="Have a referral code?"
      value={referralCode}
      onChangeText={(text) => setReferralCode(text.toUpperCase())}
      maxLength={8}
      autoCapitalize="characters"
    />

    {referralStatus === 'valid' && (
      <Text style={styles.success}>
        ✓ 10% OFF + 1GB FREE applied!
      </Text>
    )}

    {referralStatus === 'invalid' && (
      <Text style={styles.error}>
        ✗ Invalid code
      </Text>
    )}
  </View>
);
```

---

## 📊 API Endpoints for Mobile

**NOTE:** Mobile app only handles referral code entry and discount application. Reward claiming (1GB free data) is done on the web dashboard for simplicity.

### **1. Validate Referral Code** (Optional - for real-time feedback)
```typescript
POST /api/referral-codes/validate
{
  "code": "ABC12345",
  "userId": "uuid",      // Optional
  "email": "user@email"  // Optional
}

Response:
{
  "valid": true,
  "benefits": {
    "discount": 10,
    "freeDataMB": 1024,
    "message": "You'll get 10% OFF your purchase!"
  }
}
```

### **2. Link Referral Code** (Required - links code to user)
```typescript
POST /api/referrals/link
{
  "userId": "uuid",
  "referralCode": "ABC12345"
}

Response:
{
  "success": true,
  "message": "10% OFF applied to your first purchase!"
}
```

### **3. Checkout** (Discount auto-applied)
```typescript
POST /api/checkout/session
{
  "planId": "uuid",
  "email": "user@email.com",
  "referralCode": "ABC12345"  // Optional - can also omit and let backend check profile
}

Response:
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

### **4. Get Orders** (To show user their purchases)
```typescript
GET /api/user/orders

Response:
{
  "orders": [{
    "id": "uuid",
    "plan_name": "USA 10GB",
    "status": "completed",
    "amount_cents": 1800,  // $18 after 10% discount
    "created_at": "2024-01-15T10:30:00Z"
  }]
}
```

---

## 🌐 Reward Claiming (Web Dashboard Only)

Users claim their 1GB free data rewards on the web dashboard at `https://lumbus.com/dashboard`:

### **What Users See:**
1. Banner: "🎁 You have 1GB free data to claim!"
2. Click "CLAIM 1GB" button
3. Choose which eSIM to add data to
4. Data added to eSIM automatically

### **Why Web Only:**
- ✅ Simpler mobile app
- ✅ Better UX on larger screen
- ✅ Easier to manage multiple eSIMs
- ✅ Full data wallet UI already built on web
- ✅ Less confusion - mobile focuses on purchasing

---

## 🎨 UI Components

### **Referral Banner Component**
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReferralBannerProps {
  show: boolean;
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({ show }) => {
  if (!show) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Referral Active!</Text>
        <Text style={styles.subtitle}>10% OFF + 1GB FREE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Yellow/gold background
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
```

### **Price Display Component**
```typescript
interface PriceDisplayProps {
  originalPrice: number;
  hasDiscount: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  originalPrice,
  hasDiscount
}) => {
  const discountedPrice = hasDiscount ? originalPrice * 0.9 : originalPrice;

  return (
    <View style={styles.priceContainer}>
      {hasDiscount && (
        <Text style={styles.originalPrice}>
          ${originalPrice.toFixed(2)}
        </Text>
      )}
      <Text style={styles.finalPrice}>
        ${discountedPrice.toFixed(2)}
      </Text>
      {hasDiscount && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>10% OFF</Text>
        </View>
      )}
    </View>
  );
};
```

---

## 🔐 Security Notes

1. **Validation happens server-side** - Never trust client-side validation
2. **First-time buyer check** - Backend verifies user has no orders
3. **Monthly cap enforced** - Backend checks referrer hasn't exceeded limit
4. **Self-referral prevented** - Backend checks user isn't using own code

---

## 📱 Complete Mobile Flow Example

```typescript
// App.tsx or RootNavigator.tsx

const App = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Handle deep links
  useEffect(() => {
    const handleURL = (event: { url: string }) => {
      const match = event.url.match(/\/r\/([A-Z0-9]{8})/);
      if (match) {
        setReferralCode(match[1]);
        Alert.alert(
          '🎉 Referral Code Applied!',
          'You\'ll get 10% OFF + 1GB FREE on your first purchase!',
          [{ text: 'Got it!' }]
        );
      }
    };

    Linking.addEventListener('url', handleURL);
    Linking.getInitialURL().then((url) => {
      if (url) handleURL({ url });
    });

    return () => Linking.removeAllListeners('url');
  }, []);

  // Link referral after signup
  const handleSignupComplete = async (newUser: User) => {
    setUser(newUser);

    if (referralCode) {
      try {
        const response = await fetch('/api/referrals/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: newUser.id,
            referralCode: referralCode
          })
        });

        const data = await response.json();
        if (data.success) {
          Toast.show({
            text: data.message,
            type: 'success'
          });
        }
      } catch (error) {
        // Silent fail - don't block user flow
        console.log('Referral link failed:', error);
      }
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              initialParams={{ referralCode }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Plans" component={PlansScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

---

## ✅ Checklist for Mobile Implementation

**Mobile App (Purchase Flow):**
- [ ] Handle deep links (`lumbus://ref/CODE`)
- [ ] Show referral banner when code is active
- [ ] Auto-link code after user signup
- [ ] Display discounted prices (10% off)
- [ ] Pass referral code to checkout API
- [ ] Show success message after purchase with link to web dashboard

**Web Dashboard (Reward Claiming):**
- [x] Show pending rewards (already built!)
- [x] Implement reward redemption UI (already built!)
- [x] Allow applying free data to eSIMs (already built!)

---

## 🎯 Key Differences from Web

| Feature | Web | Mobile |
|---------|-----|--------|
| Code Entry | Manual with VERIFY button | Auto-detect from deep link OR manual |
| Validation | On button click | Automatic (on blur or 8 chars) |
| Discount Display | After verification | Immediate on plan page |
| User Flow | Plan → Enter code → Verify → Checkout | Deep link → Signup → Auto-applied |
| Complexity | 5 steps | 2 steps |

---

## 🚀 Result: Much Simpler!

Mobile users just:
1. Click referral link
2. Sign up
3. ✅ Done! Discount auto-applied

No verification button, no extra steps, no confusion! 🎉
