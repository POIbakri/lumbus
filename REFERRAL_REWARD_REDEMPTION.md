# 📱 Referral Reward Redemption System - Complete Implementation Guide

## Overview
The referral reward system now includes **manual redemption** with data credits that can be used for eSIM purchases. Users earn 1GB free data for each successful referral, which they must manually claim through the dashboard.

## ✅ What We Built

### 1. **Data Wallet Component** (`/components/data-wallet.tsx`)
- Displays available balance and pending rewards
- Manual "Claim Reward" button with celebration animation
- Transaction history with tabs (All/Credits/Debits)
- Real-time updates after redemption
- Responsive design with loading states

### 2. **Wallet Management System** (`/lib/wallet.ts`)
- `calculateDataCreditDiscount()` - Calculates how many credits to apply at checkout
- `applyDataCredits()` - Deducts credits and records transaction
- `refundDataCredits()` - Returns credits on order refund
- Conversion rate: 1GB = $2 USD

### 3. **Database Schema** (`/supabase/migrations/017_add_data_credit_tracking.sql`)
```sql
-- Track credit usage on orders
ALTER TABLE public.orders
ADD COLUMN data_credits_used_mb INTEGER DEFAULT 0,
ADD COLUMN data_credit_discount_usd DECIMAL(10,2) DEFAULT 0;
```

### 4. **Checkout Integration** (`/app/api/checkout/session/route.ts`)
- Automatically checks wallet balance
- Applies credits as discount (up to 100% of order value)
- Shows credit usage in order description
- Bypasses Stripe for 100% credit-covered orders

### 5. **Webhook Processing** (`/app/api/stripe/webhook/route.ts`)
- Applies data credits after successful payment
- Refunds credits if order is cancelled/refunded
- Records all transactions for audit trail

---

## 🔄 Complete User Flow

### **Step 1: Friend Makes Purchase**
When a referred friend completes their first purchase:
```typescript
// Automatic in webhook
const reward = await createReferralReward(
  orderId,
  referrerUserId,
  referredUserId,
  'FREE_DATA',
  1024 // 1GB in MB
);
// Status: PENDING
```

### **Step 2: User Sees Pending Reward**
Dashboard shows pending rewards card:
```
🎁 Pending Rewards (1)
━━━━━━━━━━━━━━━━━━━━
1.0 GB Free Data
Earned 2 hours ago
[✨ Claim Reward]
```

### **Step 3: Manual Redemption**
User clicks "Claim Reward" button:
```typescript
POST /api/rewards/redeem
{
  "rewardId": "reward-123"
}

// Backend process:
1. Mark reward as APPLIED
2. Add 1024 MB to user_data_wallet
3. Record transaction
4. Return success
```

### **Step 4: Wallet Updated**
```
💳 Your Data Wallet
━━━━━━━━━━━━━━━━━━━
Available: 1.0 GB
Value: ~$2.00
```

### **Step 5: Automatic Application at Checkout**
When user buys a new eSIM:
```typescript
// Checkout automatically checks wallet
const credits = await calculateDataCreditDiscount(userId, orderAmount);
// If user has 1GB (worth $2) and order is $12.99
// Result: Apply $2 discount, final price $10.99
```

---

## 📱 Mobile App Implementation

### **1. Get Wallet Data**
```typescript
// API Call
const getWalletData = async () => {
  const response = await fetch('https://getlumbus.com/api/rewards/wallet', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
};

// Response
{
  "balance_mb": 1024,
  "balance_gb": "1.00",
  "pending_rewards": [{
    "id": "reward-123",
    "reward_value": 1024,
    "created_at": "2024-01-15T10:30:00Z"
  }],
  "applied_rewards": [],
  "recent_transactions": []
}
```

### **2. Display Wallet UI**
```typescript
const WalletScreen = () => {
  const [wallet, setWallet] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  const redeemReward = async (rewardId) => {
    setRedeeming(true);

    const response = await fetch('https://getlumbus.com/api/rewards/redeem', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rewardId }),
    });

    if (response.ok) {
      // Show celebration animation
      showCelebration();
      // Refresh wallet data
      await loadWalletData();
    }

    setRedeeming(false);
  };

  return (
    <View>
      {/* Balance Card */}
      <Card>
        <Text style={styles.title}>Your Data Wallet</Text>
        <Text style={styles.balance}>{wallet?.balance_gb} GB</Text>
        {wallet?.balance_mb > 0 && (
          <Text style={styles.info}>
            Automatically applied at checkout
          </Text>
        )}
      </Card>

      {/* Pending Rewards */}
      {wallet?.pending_rewards.map(reward => (
        <Card key={reward.id}>
          <Text>{(reward.reward_value / 1024).toFixed(1)} GB</Text>
          <Button
            onPress={() => redeemReward(reward.id)}
            disabled={redeeming}
          >
            {redeeming ? 'Claiming...' : 'Claim Reward'}
          </Button>
        </Card>
      ))}
    </View>
  );
};
```

### **3. Checkout with Credits**
Credits are automatically applied server-side. Mobile app just needs to show the discount:

```typescript
// During checkout, credits are auto-applied
// Response will include discount info
const checkoutResponse = await createCheckout(planId);

// If user has credits:
{
  "sessionId": "cs_123",
  "url": "https://checkout.stripe.com/...",
  "dataCreditsUsed": 1024,
  "discountApplied": 2.00,
  "originalPrice": 12.99,
  "finalPrice": 10.99
}
```

---

## 🎨 UI Components Needed for Mobile

### **1. Wallet Balance Widget**
```
┌──────────────────────┐
│ 💳 Data Wallet       │
│ ━━━━━━━━━━━━━━━━━━  │
│ 1.5 GB Available     │
│ ≈ $3.00 value        │
└──────────────────────┘
```

### **2. Pending Reward Card**
```
┌──────────────────────┐
│ 🎁 New Reward!       │
│ 1.0 GB Free Data     │
│ From: John's referral│
│ [Claim Now]          │
└──────────────────────┘
```

### **3. Celebration Animation**
When claiming:
- Confetti animation
- Success haptic feedback
- Balance update animation
- Toast notification: "1GB added to wallet!"

### **4. Transaction History**
```
┌──────────────────────┐
│ Recent Activity      │
│ ━━━━━━━━━━━━━━━━━━  │
│ + 1.0 GB  Referral   │
│   2 hours ago        │
│ - 0.5 GB  Purchase   │
│   Yesterday          │
└──────────────────────┘
```

---

## 🔧 Configuration

### **Conversion Rates**
Currently hardcoded in `/lib/wallet.ts`:
```typescript
const MB_TO_USD_RATE = 0.002; // $0.002 per MB = $2 per GB
```

### **Reward Amount**
Set in `/lib/commission.ts`:
```typescript
const DEFAULT_REWARD_CONFIG = {
  REFERRAL_GIVE_MB: 1024, // 1 GB
  REFERRAL_MONTHLY_CAP: 10,
};
```

---

## 🧪 Testing the System

### **Test Flow**
1. **Create Test Referral**: Link two test users
2. **Make Purchase**: Complete order with referred user
3. **Check Pending**: Verify reward appears as PENDING
4. **Redeem**: Click "Claim Reward"
5. **Check Wallet**: Verify balance updated
6. **Make Purchase**: Buy new eSIM and verify credit applied

### **API Testing**
```bash
# Get wallet data
curl -H "Authorization: Bearer TOKEN" \
  https://getlumbus.com/api/rewards/wallet

# Redeem reward
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardId":"REWARD_ID"}' \
  https://getlumbus.com/api/rewards/redeem
```

---

## 🚨 Important Notes

1. **Manual Redemption Required**: Users must click "Claim" - rewards don't auto-apply
2. **Credits Auto-Apply at Checkout**: Once in wallet, credits automatically apply
3. **Partial Payment Supported**: Can use credits + money for orders
4. **Refunds Return Credits**: Cancelled orders refund data credits
5. **No Expiry**: Data credits never expire (currently)
6. **Conversion Rate**: 1GB = $2 USD (configurable)

---

## 📊 Analytics to Track

1. **Redemption Rate**: % of pending rewards claimed
2. **Time to Redeem**: Average time from earning to claiming
3. **Credit Usage Rate**: % of credits used vs sitting idle
4. **Average Wallet Balance**: Track hoarding behavior
5. **Conversion Impact**: Orders with credits vs without

---

## 🔜 Future Enhancements

1. **Push Notifications**: Alert when new reward available
2. **Auto-Redemption Option**: Setting to auto-claim rewards
3. **Credit Expiry**: Add expiration to prevent hoarding
4. **Variable Rates**: Different credit values for different actions
5. **Credit Gifting**: Allow users to share credits
6. **Tiered Rewards**: More GB for milestone referrals

---

## 📝 Database Queries for Monitoring

```sql
-- Check pending rewards
SELECT COUNT(*), SUM(reward_value)
FROM referral_rewards
WHERE status = 'PENDING';

-- Check wallet balances
SELECT COUNT(*), SUM(balance_mb), AVG(balance_mb)
FROM user_data_wallet
WHERE balance_mb > 0;

-- Check credit usage
SELECT COUNT(*), SUM(data_credits_used_mb), SUM(data_credit_discount_usd)
FROM orders
WHERE data_credits_used_mb > 0;
```

---

**System Status**: ✅ FULLY OPERATIONAL

The manual redemption system is now complete with:
- Beautiful UI with animations
- Secure redemption flow
- Automatic credit application at checkout
- Full transaction tracking
- Refund support

Mobile app just needs to replicate the UI and call the existing APIs!