# Mobile App Rewards Integration Guide

## Overview
This guide explains how to integrate the reward top-up feature into the mobile app, allowing users to apply their free data balance to their active eSIMs.

## API Endpoints

### 1. Get Wallet Balance
**Endpoint:** `GET /api/rewards/wallet`

**Headers:**
```
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "balance_mb": 1024,
  "balance_gb": "1.0",
  "active_esims": [
    {
      "id": "a63a8bf1-0bba-4f5e-b1cb-faaf67154e1c",
      "plan_name": "United Arab Emirates 10GB 60Days",
      "data_remaining_bytes": 10066329600,
      "free_data_added_mb": 0,
      "created_at": "2024-12-24T15:23:00Z",
      "expires_at": "2025-02-22T15:23:00Z",
      "region_code": "AE"
    }
  ]
}
```

**Notes:**
- `balance_mb` - User's free data balance in MB
- `active_esims` - List of eSIMs eligible for reward top-up (non-expired, original purchases)

---

### 2. Apply Reward Data to eSIM
**Endpoint:** `POST /api/rewards/apply-data`

**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "a63a8bf1-0bba-4f5e-b1cb-faaf67154e1c",
  "amountMB": 1024
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | UUID | Yes | The order ID of the eSIM to top up (from `active_esims[].id`) |
| `amountMB` | number | Yes | Amount in MB to add (must be multiple of 1024, min 1024, max 10240) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully added 1GB to your eSIM!",
  "newWalletBalance": 0,
  "newWalletBalanceGB": "0.0"
}
```

**Error Responses:**

*Insufficient Balance (400):*
```json
{
  "error": "Insufficient free data balance",
  "required": 1024,
  "available": 512
}
```

*eSIM Expired (400):*
```json
{
  "error": "This eSIM has expired and cannot be topped up with rewards."
}
```

*No Compatible Package (400):*
```json
{
  "error": "No 1GB top-up package available for region AE",
  "availablePackages": 0
}
```

*Order Not Found (404):*
```json
{
  "error": "Original eSIM order not found or not eligible"
}
```

*Provider Error (400):*
```json
{
  "error": "eSIM provider rejected the top-up",
  "details": "Error message from provider"
}
```

---

## UI Implementation

### Wallet Display
Show the user's free data balance prominently:
```
FREE DATA BALANCE
1.0 GB
```

### eSIM Selection
List all active eSIMs from the wallet response. For each eSIM, show:
- Plan name
- Data remaining
- Region/country
- Expiry date

### Amount Selection
Allow users to select how much data to add:
- Minimum: 1 GB (1024 MB)
- Maximum: 10 GB or wallet balance (whichever is lower)
- Increments: 1 GB

### Add Data Button
- Disabled when: wallet balance is 0 or eSIM is expired
- Loading state: "ADDING..." while request is in progress
- On success: Refresh wallet data and eSIM list

---

## Example Implementation (React Native)

```typescript
// Types
interface WalletData {
  balance_mb: number;
  balance_gb: string;
  active_esims: ActiveEsim[];
}

interface ActiveEsim {
  id: string;
  plan_name: string;
  data_remaining_bytes: number;
  expires_at: string | null;
  region_code: string | null;
}

// Fetch wallet data
async function getWalletData(): Promise<WalletData> {
  const response = await fetch('/api/rewards/wallet', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  return response.json();
}

// Apply reward data
async function applyRewardData(orderId: string, amountMB: number) {
  const response = await fetch('/api/rewards/apply-data', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, amountMB }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to apply data');
  }

  return result;
}

// Usage
const handleAddData = async (esimId: string, gbAmount: number) => {
  try {
    setLoading(true);
    const result = await applyRewardData(esimId, gbAmount * 1024);

    // Show success message
    Alert.alert('Success', result.message);

    // Refresh wallet and eSIM data
    await refreshData();
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Validation Rules

1. **Amount Validation:**
   - Must be >= 1024 MB (1 GB)
   - Must be <= 10240 MB (10 GB)
   - Must be a multiple of 1024 (the reward unit)

2. **eSIM Eligibility:**
   - Must be an original purchase (`is_topup: false`)
   - Must not be expired
   - Status must be: `completed`, `active`, or `depleted`

3. **Wallet Balance:**
   - User must have sufficient balance (`balance_mb >= amountMB`)

---

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Insufficient balance | "Not enough free data. You need {X}GB but only have {Y}GB." | Disable button or show upgrade prompt |
| eSIM expired | "This eSIM has expired. Purchase a new one to use your free data." | Hide add data option for this eSIM |
| No compatible package | "Free data is not available for this region yet." | Contact support or hide option |
| Provider error | "Unable to add data right now. Please try again later." | Retry button |
| Network error | "Connection error. Please check your internet." | Retry button |

---

## Testing

### Test User Setup
1. Create a test user with `is_test_user: true`
2. Add balance to their wallet via database
3. Purchase an eSIM (will use mock provider)

### Test Scenarios
1. **Happy Path:** User with 1GB balance adds to active eSIM → Success
2. **Insufficient Balance:** User tries to add more than they have → Error
3. **Expired eSIM:** User tries to add to expired eSIM → Error
4. **Multiple eSIMs:** User with 2+ eSIMs can choose which to top up

---

## Notes

- The API automatically selects the best 1GB package for the eSIM's region
- No package selection is needed from the user
- The expiry date of the eSIM is extended when data is added
- A confirmation email is sent after successful top-up
- Orders are tracked with `topup_source: 'reward'` for analytics
