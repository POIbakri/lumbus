# Dynamic Currency System

This document explains how Lumbus handles multi-currency pricing for global users.

## Overview

- **Base Currency**: All prices in the database are stored in **USD**
- **Dynamic Conversion**: Prices are automatically converted to the user's local currency at checkout
- **Location Detection**: User's country is detected from request headers (CloudFront, Cloudflare, Vercel)
- **Supported Currencies**: 27+ major currencies including GBP, EUR, CAD, AUD, JPY, SGD, and more

## How It Works

### 1. Price Storage (Database)
All plans in the `plans` table have `retail_price` in USD and `currency` set to "USD":

```sql
SELECT name, retail_price, currency FROM plans LIMIT 3;
-- Global139 1GB 7Days | 15.99 | USD
-- USA & Canada 1GB 7Days | 6.99 | USD
-- Europe 5GB 30Days | 22.99 | USD
```

### 2. Currency Detection (Checkout)
When a user creates a checkout session:

1. **Request headers are checked** for country code:
   - `cloudfront-viewer-country` (AWS CloudFront)
   - `cf-ipcountry` (Cloudflare)
   - `x-vercel-ip-country` (Vercel)

2. **Country is mapped to currency**:
   - `GB` → GBP
   - `FR` → EUR
   - `JP` → JPY
   - `AU` → AUD
   - etc.

3. **Price is converted** using current exchange rates

4. **Stripe checkout is created** with the converted amount in the user's currency

### 3. Currency Conversion
Exchange rates are defined in `lib/currency.ts`:

```typescript
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  GBP: 0.79,    // 1 USD = 0.79 GBP
  EUR: 0.92,    // 1 USD = 0.92 EUR
  JPY: 149.5,   // 1 USD = 149.5 JPY
  // ... etc
};
```

**Example**: A $15.99 USD plan in the UK:
```
$15.99 USD × 0.79 = £12.63 GBP
```

## Frontend Usage

### Using the React Hook

The `useCurrency` hook automatically detects the user's currency and provides conversion functions:

```tsx
'use client';
import { useCurrency } from '@/hooks/useCurrency';

export default function PlanCard({ plan }) {
  const { currency, symbol, formatPrice, loading } = useCurrency();

  if (loading) return <div>Loading...</div>;

  // Convert USD price to user's currency
  const displayPrice = convertPrice(plan.retail_price);

  return (
    <div className="plan-card">
      <h3>{plan.name}</h3>
      <p className="price">{formatPrice(displayPrice)}</p>
      <button>Buy Now</button>
    </div>
  );
}
```

### Displaying Multiple Prices

```tsx
'use client';
import { useCurrency } from '@/hooks/useCurrency';
import { useEffect, useState } from 'react';

export default function PlansList({ plans }) {
  const { convertPrices, symbol, loading } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState([]);

  useEffect(() => {
    async function convert() {
      const usdPrices = plans.map(p => p.retail_price);
      const results = await convertPrices(usdPrices);
      setConvertedPrices(results);
    }
    if (!loading) convert();
  }, [plans, loading, convertPrices]);

  if (loading) return <div>Loading prices...</div>;

  return (
    <div className="plans-grid">
      {plans.map((plan, i) => (
        <div key={plan.id} className="plan-card">
          <h3>{plan.name}</h3>
          <p className="price">{convertedPrices[i]?.formatted}</p>
          <button>Buy Now</button>
        </div>
      ))}
    </div>
  );
}
```

### Just Getting Currency Info

If you only need to display the currency symbol/name without converting:

```tsx
'use client';
import { useCurrencyInfo } from '@/hooks/useCurrency';

export default function Header() {
  const { currency, symbol, name } = useCurrencyInfo();

  return (
    <header>
      <div>Prices shown in {name} ({symbol})</div>
    </header>
  );
}
```

## API Endpoints

### GET /api/currency/detect

Returns the user's detected currency:

```bash
curl https://getlumbus.com/api/currency/detect
```

Response:
```json
{
  "country": "GB",
  "currency": "GBP",
  "symbol": "£",
  "name": "British Pound"
}
```

### POST /api/currency/detect

Converts USD prices to user's currency:

```bash
curl -X POST https://getlumbus.com/api/currency/detect \
  -H "Content-Type: application/json" \
  -d '{"prices": [15.99, 22.99, 33.99]}'
```

Response:
```json
{
  "currency": "GBP",
  "symbol": "£",
  "name": "British Pound",
  "prices": [
    { "usd": 15.99, "converted": 12.63, "formatted": "£12.63" },
    { "usd": 22.99, "converted": 18.16, "formatted": "£18.16" },
    { "usd": 33.99, "converted": 26.85, "formatted": "£26.85" }
  ]
}
```

## Supported Currencies

| Currency | Code | Countries |
|----------|------|-----------|
| US Dollar | USD | United States, Latin America (fallback) |
| British Pound | GBP | United Kingdom |
| Euro | EUR | EU countries, some Eastern Europe |
| Canadian Dollar | CAD | Canada |
| Australian Dollar | AUD | Australia |
| Japanese Yen | JPY | Japan |
| Singapore Dollar | SGD | Singapore |
| Hong Kong Dollar | HKD | Hong Kong |
| New Zealand Dollar | NZD | New Zealand |
| Swiss Franc | CHF | Switzerland |
| Swedish Krona | SEK | Sweden |
| Norwegian Krone | NOK | Norway |
| Danish Krone | DKK | Denmark |
| Mexican Peso | MXN | Mexico |
| Brazilian Real | BRL | Brazil |
| Indian Rupee | INR | India |
| UAE Dirham | AED | United Arab Emirates |
| Saudi Riyal | SAR | Saudi Arabia |
| South African Rand | ZAR | South Africa |
| Turkish Lira | TRY | Turkey |
| Polish Zloty | PLN | Poland |
| Thai Baht | THB | Thailand |
| Malaysian Ringgit | MYR | Malaysia |
| Indonesian Rupiah | IDR | Indonesia |
| Philippine Peso | PHP | Philippines |
| South Korean Won | KRW | South Korea |
| Chinese Yuan | CNY | China |

**Total**: 27 currencies covering 200+ countries

## Updating Exchange Rates

Exchange rates are defined in `lib/currency.ts`. To update them:

1. **Manual Update** (current approach):
   ```typescript
   export const EXCHANGE_RATES: Record<Currency, number> = {
     USD: 1.0,
     GBP: 0.79,  // Update this value
     EUR: 0.92,  // Update this value
     // ...
   };
   ```

2. **Automated Update** (recommended for production):
   Use an API like [exchangerate-api.com](https://exchangerate-api.com) or [ECB](https://www.ecb.europa.eu/stats/eurofxref/):

   ```typescript
   // Example: Fetch rates daily via cron job
   async function updateExchangeRates() {
     const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
     const data = await response.json();
     // Store in database or environment variable
   }
   ```

## Testing

### Test Currency Detection

```bash
# Test from UK (should return GBP)
curl -H "x-vercel-ip-country: GB" http://localhost:3000/api/currency/detect

# Test from Japan (should return JPY)
curl -H "x-vercel-ip-country: JP" http://localhost:3000/api/currency/detect

# Test from Germany (should return EUR)
curl -H "x-vercel-ip-country: DE" http://localhost:3000/api/currency/detect
```

### Test Price Conversion

```bash
# Convert $15.99 to GBP
curl -X POST http://localhost:3000/api/currency/detect \
  -H "Content-Type: application/json" \
  -H "x-vercel-ip-country: GB" \
  -d '{"prices": [15.99]}'

# Expected: £12.63
```

### Test Checkout

```bash
# Create checkout session from UK
curl -X POST http://localhost:3000/api/checkout/session \
  -H "Content-Type: application/json" \
  -H "x-vercel-ip-country: GB" \
  -d '{
    "planId": "your-plan-id",
    "email": "test@example.com"
  }'

# Check Stripe dashboard - session should be in GBP
```

## Best Practices

### 1. Display Currency Prominently
Always show users what currency they're viewing:

```tsx
<div className="currency-badge">
  Prices shown in {currencyName} ({symbol})
</div>
```

### 2. Allow Manual Currency Selection
Consider adding a currency selector for users who want to see prices in a different currency:

```tsx
<select onChange={(e) => setCurrency(e.target.value)}>
  <option value="USD">$ USD</option>
  <option value="GBP">£ GBP</option>
  <option value="EUR">€ EUR</option>
  {/* ... */}
</select>
```

### 3. Show Original USD Price (Optional)
For transparency, you can show the original USD price:

```tsx
<div className="price">
  <span className="converted">{formatPrice(convertedPrice)}</span>
  <span className="original">({formatPrice(usdPrice, 'USD')})</span>
</div>
```

### 4. Update Exchange Rates Regularly
- **Development**: Manual updates are fine
- **Production**: Set up a daily cron job to fetch fresh rates

### 5. Handle Zero-Decimal Currencies
Some currencies (JPY, KRW, IDR) don't use decimal places. The system handles this automatically:

```typescript
// JPY: ¥1,500 (not ¥1,500.00)
// USD: $15.99 (with decimals)
```

## Troubleshooting

### Currency Not Detected
- Check that your deployment platform sets country headers
- Vercel sets `x-vercel-ip-country` automatically
- CloudFront requires configuration
- Fallback is always USD

### Prices Look Wrong
- Verify exchange rates in `lib/currency.ts`
- Check Stripe dashboard for actual charged amount
- Remember: zero-decimal currencies don't use cents

### Currency Mismatch
- User's detected country determines currency
- Cannot be overridden without adding currency selector
- Consider adding currency preference to user profile

## Future Enhancements

1. **Dynamic Exchange Rates**: Fetch from API instead of hardcoded
2. **Currency Preferences**: Let users save preferred currency
3. **Price Alerts**: Notify when exchange rates change significantly
4. **Multi-Currency Display**: Show prices in multiple currencies
5. **Historical Rates**: Track exchange rates over time for analytics

## Related Files

- `lib/currency.ts` - Core currency utilities
- `app/api/checkout/session/route.ts` - Checkout with currency conversion
- `app/api/currency/detect/route.ts` - Currency detection API
- `hooks/useCurrency.ts` - React hook for frontend
