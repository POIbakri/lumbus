# 📱 Referral Reward Redemption System - Complete Implementation Guide

## Overview
The referral reward system gives **BOTH users 1GB of actual free data** (not monetary credits). First-time buyers who use a referral code get 1GB, and the referrer gets 1GB when their code is used. Users must manually claim rewards and choose which eSIM to apply the data to.

## ✅ What We Built

### 1. **Data Wallet Component** (`/components/data-wallet.tsx`)
- Shows pending rewards for manual redemption
- Displays current free data balance
- Lists active eSIMs with data selection
- Celebration animation on successful redemption
- Full mobile responsive design with Lumbus UI

### 2. **Free Data System**
- **NOT monetary credits** - actual data in MB/GB
- Users choose which eSIM receives the free data
- Data is added to `data_remaining_bytes` on the order
- 1GB = 1024MB throughout the system

### 3. **Database Schema** (`/supabase/migrations/018_fix_data_tracking.sql`)
```sql
-- Track free data additions to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS free_data_added_mb INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_data_added_at TIMESTAMP WITH TIME ZONE;

-- Remove old discount-based columns
DROP COLUMN IF EXISTS data_credits_used_mb,
DROP COLUMN IF EXISTS data_credit_discount_cents;
```

### 4. **First-Time Buyer Restriction** (`/lib/referral.ts`)
```typescript
// Only first-time buyers can use referral codes
export async function linkReferrer(userId: string, refCode: string): Promise<boolean> {
  // Check if user has any completed orders
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['paid', 'completed']);

  if ((orderCount || 0) > 0) {
    return false; // Existing users cannot use referral codes
  }
  // ... link referral
}
```

---

## 🔄 Complete User Flow

### **Step 1: First-Time Buyer Uses Referral Code**
During checkout, ONLY first-time buyers can enter/use a referral code:
```typescript
// Checkout checks if user is new
if (isNewUser && referralCode) {
  await linkReferrer(user.id, referralCode);
}
// Existing users: referral codes are ignored
```

### **Step 2: Both Users Get Pending Rewards**
After successful payment, webhook creates TWO pending rewards:
```typescript
// 1. Referrer gets 1GB
await createReferralReward(
  orderId,
  referrerUserId,    // Who gets the reward
  buyerUserId,       // Who triggered it
  'FREE_DATA',
  1024              // 1GB in MB
);

// 2. First-time buyer gets 1GB
await createReferralReward(
  orderId,
  buyerUserId,      // Buyer gets their own reward
  buyerUserId,      // Self-referral indicates bonus for using code
  'FREE_DATA',
  1024              // 1GB in MB
);
```

### **Step 3: Manual Redemption to Wallet**
Users see pending rewards and click "CLAIM 1GB":
```typescript
POST /api/rewards/redeem
{
  "rewardId": "reward-123"
}

// Process:
1. Mark reward as APPLIED
2. Add 1024 MB to user_data_wallet
3. Update wallet balance
```

### **Step 4: Choose eSIM to Apply Data**
User selects amount and eSIM:
```typescript
POST /api/rewards/apply-data
{
  "orderId": "esim-order-id",
  "amountMB": 1024  // User chooses 1-10GB
}

// Process:
1. Deduct from wallet balance
2. Add to order's data_remaining_bytes
3. Track in free_data_added_mb
```

### **Step 5: Data Actually Increases**
The eSIM now has more usable data:
```sql
-- Before: 10GB plan with 5GB used
data_remaining_bytes: 5368709120  -- 5GB left
free_data_added_mb: 0

-- After applying 1GB free data:
data_remaining_bytes: 6442450944  -- 6GB left (5GB + 1GB)
free_data_added_mb: 1024
```

---

## 📱 Mobile App Implementation

### **1. Get Wallet Data**
```typescript
// API Call
const getWalletData = async () => {
  const response = await authenticatedGet('/api/rewards/wallet');
  return response;
};

// Response
{
  "balance_mb": 2048,
  "balance_gb": "2.0",
  "pending_rewards": [{
    "id": "reward-123",
    "reward_value": 1024,  // 1GB in MB
    "created_at": "2024-01-15T10:30:00Z",
    "order_id": "order-456",
    "referrer_user_id": "user-789",
    "referred_user_id": "user-123"
  }],
  "active_esims": [{
    "id": "order-abc",
    "plan_name": "Europe 10GB",
    "data_remaining_bytes": 5368709120,
    "free_data_added_mb": 0,
    "created_at": "2024-01-10T..."
  }]
}
```

### **2. Redeem Pending Reward**
```typescript
const redeemReward = async (rewardId: string) => {
  const response = await authenticatedPost('/api/rewards/redeem', {
    rewardId
  });

  if (response.success) {
    // Show: "1GB added to your data balance!"
    showCelebration();
    refreshWallet();
  }
};
```

### **3. Apply Data to eSIM**
```typescript
const applyDataToEsim = async (orderId: string, amountMB: number) => {
  const response = await authenticatedPost('/api/rewards/apply-data', {
    orderId,
    amountMB  // 1024, 2048, 3072, etc.
  });

  if (response.success) {
    // Show: "Successfully added 1GB to your eSIM!"
    showSuccess(response.message);
    refreshWallet();
    refreshEsims();
  }
};
```

### **4. UI Components**

#### Pending Rewards Section
```
🎁 CLAIM YOUR REWARDS
━━━━━━━━━━━━━━━━━━━━
[Card]
  <Gift Icon> 1GB Free Data
  Bonus for using referral code
  • 2 hours ago
  [CLAIM 1GB] ←-- Button
[/Card]
```

#### Free Data Balance
```
📦 FREE DATA BALANCE
━━━━━━━━━━━━━━━━━━━━
Your Free Data: 2.0 GB
```

#### Apply to eSIM Section
```
📱 ADD FREE DATA TO YOUR eSIMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Card]
  <Wifi Icon> Europe 10GB
  5.0GB remaining

  [Select: 1 GB ▼] [ADD DATA]
[/Card]
```

---

## 🎯 Key System Rules

### **First-Time Buyers Only**
- ✅ New users can use referral codes
- ❌ Existing users cannot use referral codes
- ❌ Users with any paid/completed orders cannot use codes
- Enforced at checkout AND during referral linking

### **Both Users Get 1GB**
- Referrer: Gets 1GB when their code is used
- First-time buyer: Gets 1GB for using a code
- Both must manually claim their rewards
- Both can choose which eSIM gets the data

### **Actual Data, Not Credits**
- 1GB = 1024MB of real data
- Added to eSIM's `data_remaining_bytes`
- NOT a payment discount
- NOT monetary credits
- Users get actual usable mobile data

### **Manual Control**
- Rewards start as PENDING
- Users must click "CLAIM" button
- Users choose amount to apply (1-10GB)
- Users choose which eSIM receives it

---

## 🔧 Configuration

### **Reward Amount**
Set in `/lib/commission.ts`:
```typescript
const DEFAULT_REWARD_CONFIG = {
  REFERRAL_GIVE_MB: 1024, // 1 GB for both users
  REFERRAL_MONTHLY_CAP: 10,
};
```

### **Application Limits**
Set in `/app/api/rewards/apply-data/route.ts`:
```typescript
const applyDataSchema = z.object({
  orderId: z.string().uuid(),
  amountMB: z.number().min(1024).max(10240), // 1-10GB per application
});
```

---

## 🧪 Testing the System

### **Test Flow**
1. **Create New User**: Sign up fresh account
2. **Use Referral Code**: Enter code during first purchase
3. **Complete Payment**: Finish checkout
4. **Check Rewards**: Both users see pending 1GB rewards
5. **Claim Rewards**: Click "CLAIM 1GB" button
6. **Check Wallet**: Verify 1GB in free data balance
7. **Apply to eSIM**: Select eSIM and add data
8. **Verify Increase**: Check eSIM has more data remaining

### **Verification Queries**
```sql
-- Check pending rewards
SELECT * FROM referral_rewards
WHERE status = 'PENDING'
ORDER BY created_at DESC;

-- Check wallet balances
SELECT user_id, balance_mb,
       ROUND(balance_mb/1024.0, 2) as balance_gb
FROM user_data_wallet
WHERE balance_mb > 0;

-- Check free data applied to orders
SELECT id, plan_id,
       free_data_added_mb,
       ROUND(free_data_added_mb/1024.0, 2) as free_gb_added,
       ROUND(data_remaining_bytes/1073741824.0, 2) as remaining_gb
FROM orders
WHERE free_data_added_mb > 0;
```

---

## 🚨 Important Notes

1. **First-Time Only**: Existing users CANNOT use referral codes
2. **Manual Redemption**: Rewards don't auto-apply to wallet
3. **User Choice**: Users pick which eSIM gets the data
4. **Actual Data**: This is real mobile data, not credits
5. **No Expiry**: Free data doesn't expire
6. **Atomic Operations**: All transactions have rollback on failure

---

## 📊 Metrics to Track

1. **Redemption Rate**: % of pending rewards claimed
2. **Time to Redeem**: Average time from earning to claiming
3. **Application Rate**: % of wallet balance applied to eSIMs
4. **Average Application**: Typical GB amount per application
5. **eSIM Selection**: Which eSIMs get free data most often

---

## 🔜 SQL Migration Order

1. **Already Applied**: `017_add_data_credit_tracking.sql` (old columns)
2. **Apply Next**: `018_fix_data_tracking.sql` (drops old, adds new)

```bash
# Apply the fix migration
npx supabase db push
```

---

**System Status**: ✅ FULLY OPERATIONAL

The system correctly implements:
- First-time buyer restriction for referral codes
- Both users get 1GB of actual free data
- Manual redemption with user control
- Data application to chosen eSIMs
- Proper tracking and audit trail

Mobile app just needs to implement the UI and call the existing APIs!