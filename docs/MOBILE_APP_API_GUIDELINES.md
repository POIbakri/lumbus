# Mobile App API Integration Guidelines

## Critical Issues & Solutions

### 1. ❌ **Region API Rate Limiting (FIXED)**

**Problem:** Previously, fetching region data could trigger rate limiting
**Solution:** Server-side caching implemented

**Mobile App Implementation:**
```typescript
// ✅ CORRECT - Use batch endpoint for all regions
const response = await fetch('https://getlumbus.com/api/regions');
const { regions } = await response.json();
// Cache this locally for the session

// ✅ CORRECT - Single region lookup (now cached server-side)
const response = await fetch('https://getlumbus.com/api/regions/MV');
```

**DO NOT:**
```typescript
// ❌ WRONG - Multiple parallel region requests
regions.forEach(async (code) => {
  await fetch(`/api/regions/${code}`); // This used to cause rate limiting
});
```

### 2. ⚠️ **Order Provisioning Issues**

**Problem:** Orders can get stuck in 'provisioning' status if webhooks fail

**Mobile App Solution:**

```typescript
interface OrderStatus {
  id: string;
  status: 'pending' | 'paid' | 'provisioning' | 'completed' | 'failed';
  hasActivationDetails: boolean;
  smdp?: string;
  activationCode?: string;
}

// Polling strategy for order status
async function pollOrderStatus(orderId: string, token: string): Promise<OrderStatus> {
  const MAX_ATTEMPTS = 30; // 5 minutes max
  const POLL_INTERVAL = 10000; // Start with 10 seconds

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(
      `https://getlumbus.com/api/orders/${orderId}?token=${token}`
    );

    const order = await response.json();

    // Success - we have activation details
    if (order.hasActivationDetails && order.status === 'completed') {
      return order;
    }

    // Failed order
    if (order.status === 'failed') {
      throw new Error('Order processing failed');
    }

    // Exponential backoff after 10 attempts
    const delay = attempt < 10 ? POLL_INTERVAL : POLL_INTERVAL * 2;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // After 5 minutes, show manual recovery option
  throw new Error('ORDER_STUCK');
}
```

### 3. 📱 **Mobile App Best Practices**

#### A. Cache Management
```typescript
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 30 * 60 * 1000; // 30 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const apiCache = new ApiCache();

// Use for regions, plans, etc.
async function getRegions() {
  const cached = apiCache.get('regions');
  if (cached) return cached;

  const response = await fetch('https://getlumbus.com/api/regions');
  const data = await response.json();
  apiCache.set('regions', data);
  return data;
}
```

#### B. Error Handling
```typescript
async function apiCall(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);

    // Handle rate limiting
    if (response.status === 503) {
      const error = await response.json();
      if (error.code === 'RATE_LIMITED') {
        // Show user-friendly message
        throw new Error('Service is busy. Please try again in a moment.');
      }
    }

    // Handle other errors
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Network error
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }
    throw error;
  }
}
```

#### C. Order Recovery Flow
```typescript
// When an order is stuck
function handleStuckOrder(orderId: string) {
  // 1. Show user message
  showAlert({
    title: 'Processing Your eSIM',
    message: 'Your eSIM is being prepared. This may take a few minutes.',
    actions: [
      {
        text: 'Check Status',
        action: () => checkOrderManually(orderId)
      },
      {
        text: 'Contact Support',
        action: () => openSupport(orderId)
      }
    ]
  });

  // 2. Continue polling in background
  continueBackgroundPolling(orderId);

  // 3. Store order for recovery on next app launch
  saveOrderForRecovery(orderId);
}
```

### 4. 🔥 **Critical API Endpoints**

| Endpoint | Caching | Rate Limit | Mobile Strategy |
|----------|---------|------------|-----------------|
| `/api/regions` | 30 min | Protected | Cache locally for session |
| `/api/regions/[code]` | 30 min | Protected | Use batch endpoint instead |
| `/api/plans` | No | 100/min | Implement client-side cache |
| `/api/orders/[id]` | No | No limit | Poll with exponential backoff |
| `/api/checkout/session` | No | 10/min | Debounce user actions |

### 5. 🚨 **Error Codes to Handle**

```typescript
enum ApiErrorCode {
  RATE_LIMITED = 'RATE_LIMITED',        // 503 - Too many requests
  ORDER_STUCK = 'ORDER_STUCK',          // Order in provisioning > 5 min
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE', // eSIM provider issue
  PAYMENT_FAILED = 'PAYMENT_FAILED',    // Stripe payment issue
  INVALID_PACKAGE = 'INVALID_PACKAGE',  // eSIM package unavailable
}

// Handle each appropriately
switch(error.code) {
  case ApiErrorCode.RATE_LIMITED:
    // Wait and retry with exponential backoff
    break;
  case ApiErrorCode.ORDER_STUCK:
    // Show recovery options
    break;
  case ApiErrorCode.INSUFFICIENT_BALANCE:
    // Notify support team, show alternative plans
    break;
}
```

### 6. 📊 **Monitoring & Analytics**

Track these metrics in your mobile app:

```typescript
// Track API performance
analytics.track('api_call', {
  endpoint: '/api/orders',
  response_time: 1234,
  status: 200,
  cached: false,
  error: null
});

// Track order issues
analytics.track('order_stuck', {
  order_id: 'xxx',
  duration_seconds: 300,
  recovery_method: 'manual_poll'
});

// Track rate limiting
analytics.track('rate_limited', {
  endpoint: '/api/regions',
  retry_after: 60
});
```

### 7. ✅ **Implementation Checklist**

- [ ] Implement local caching for regions data
- [ ] Use batch API endpoints when available
- [ ] Add exponential backoff for polling
- [ ] Handle stuck orders with user feedback
- [ ] Implement proper error handling for all API calls
- [ ] Add analytics tracking for API issues
- [ ] Store failed orders for recovery on next launch
- [ ] Test with poor network conditions
- [ ] Test with server downtime scenarios
- [ ] Add user-friendly error messages

### 8. 🆘 **Support Integration**

When orders fail or get stuck:

```typescript
function generateSupportTicket(orderId: string, error: string) {
  return {
    order_id: orderId,
    timestamp: new Date().toISOString(),
    error_type: error,
    device_info: {
      platform: Platform.OS,
      version: Platform.Version,
      app_version: APP_VERSION,
    },
    network_info: {
      type: NetInfo.type,
      isConnected: NetInfo.isConnected,
    }
  };
}
```

### 9. 🔐 **Security Notes**

- **Never** store API keys in mobile app
- **Always** use secure tokens for order access
- **Validate** all API responses before processing
- **Implement** certificate pinning for production
- **Use** encrypted storage for sensitive data

## Questions? Contact backend team for clarification.