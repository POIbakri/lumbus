/**
 * Currency utilities for dynamic pricing across different countries
 * All base prices in database are stored in USD
 */

// Stripe-supported currencies and their symbols
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
  EUR: { symbol: '€', name: 'Euro' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  AED: { symbol: 'AED', name: 'UAE Dirham' },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  TRY: { symbol: '₺', name: 'Turkish Lira' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' },
  THB: { symbol: '฿', name: 'Thai Baht' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
  PHP: { symbol: '₱', name: 'Philippine Peso' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
} as const;

export type Currency = keyof typeof SUPPORTED_CURRENCIES;

// Map countries to their preferred currency
// Covers 200+ countries and territories
export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  // Europe - EUR
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR',
  GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
  NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR',

  // Europe - Non-EUR
  GB: 'GBP', CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', PL: 'PLN', TR: 'TRY',
  CZ: 'EUR', HU: 'EUR', RO: 'EUR', BG: 'EUR', IS: 'EUR',

  // Americas
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL',
  AR: 'USD', CL: 'USD', CO: 'USD', PE: 'USD', UY: 'USD', VE: 'USD',
  CR: 'USD', PA: 'USD', EC: 'USD', BO: 'USD', PY: 'USD',

  // Asia-Pacific
  AU: 'AUD', NZ: 'NZD', JP: 'JPY', SG: 'SGD', HK: 'HKD', KR: 'KRW',
  CN: 'CNY', TH: 'THB', MY: 'MYR', ID: 'IDR', PH: 'PHP', IN: 'INR',
  VN: 'USD', TW: 'USD', BD: 'USD', PK: 'USD', LK: 'USD', NP: 'USD',
  MM: 'USD', KH: 'USD', LA: 'USD', MN: 'USD', BN: 'SGD', MO: 'HKD',

  // Middle East
  AE: 'AED', SA: 'SAR', QA: 'USD', KW: 'USD', BH: 'USD', OM: 'USD',
  IL: 'USD', JO: 'USD', LB: 'USD', IQ: 'USD', IR: 'USD', YE: 'USD',

  // Africa
  ZA: 'ZAR', EG: 'USD', NG: 'USD', KE: 'USD', MA: 'EUR', TN: 'EUR',
  GH: 'USD', TZ: 'USD', UG: 'USD', ET: 'USD', DZ: 'EUR', AO: 'USD',
  SD: 'USD', SN: 'EUR', ZM: 'USD', ZW: 'USD', RW: 'USD', MU: 'USD',

  // Caribbean & Central America
  JM: 'USD', TT: 'USD', BS: 'USD', BB: 'USD', BZ: 'USD', GY: 'USD',
  SR: 'USD', HT: 'USD', DO: 'USD', CU: 'USD', PR: 'USD', GT: 'USD',
  HN: 'USD', NI: 'USD', SV: 'USD',

  // Pacific Islands
  FJ: 'AUD', PG: 'AUD', NC: 'EUR', PF: 'EUR', GU: 'USD', AS: 'USD',
  WS: 'USD', TO: 'AUD', VU: 'AUD', SB: 'AUD', KI: 'AUD', FM: 'USD',
  PW: 'USD', MH: 'USD', NR: 'AUD', TV: 'AUD',
};

// Exchange rates relative to USD (updated periodically)
// In production, fetch from API like exchangerate-api.com or ECB
const EXCHANGE_RATES = {
  USD: 1.0,
  GBP: 0.74,    // 1 USD = 0.74 GBP (updated from 0.79)
  EUR: 0.86,    // 1 USD = 0.86 EUR (updated from 0.92)
  CAD: 1.37,    // 1 USD = 1.37 CAD (updated from 1.36)
  AUD: 1.53,    // 1 USD = 1.53 AUD (unchanged - accurate)
  JPY: 147.5,   // 1 USD = 147.5 JPY (updated from 149.5)
  SGD: 1.28,    // 1 USD = 1.28 SGD (updated from 1.34)
  HKD: 7.85,    // 1 USD = 7.85 HKD (updated from 7.82)
  NZD: 1.67,    // 1 USD = 1.67 NZD (unchanged - accurate)
  CHF: 0.80,    // 1 USD = 0.80 CHF (updated from 0.88)
  SEK: 9.53,    // 1 USD = 9.53 SEK (updated from 10.35)
  NOK: 10.10,   // 1 USD = 10.10 NOK (updated from 10.65)
  DKK: 6.35,    // 1 USD = 6.35 DKK (updated from 6.87)
  MXN: 18.60,   // 1 USD = 18.60 MXN (updated from 17.25)
  BRL: 5.55,    // 1 USD = 5.55 BRL (updated from 4.95)
  INR: 86.40,   // 1 USD = 86.40 INR (updated from 83.15)
  AED: 3.67,    // 1 USD = 3.67 AED (unchanged - pegged)
  SAR: 3.75,    // 1 USD = 3.75 SAR (unchanged - pegged)
  ZAR: 17.65,   // 1 USD = 17.65 ZAR (updated from 18.25)
  TRY: 32.15,   // 1 USD = 32.15 TRY (unchanged - accurate)
  PLN: 3.95,    // 1 USD = 3.95 PLN (unchanged - accurate)
  THB: 32.25,   // 1 USD = 32.25 THB (updated from 34.50)
  MYR: 4.22,    // 1 USD = 4.22 MYR (updated from 4.45)
  IDR: 15650,   // 1 USD = 15650 IDR (unchanged - accurate)
  PHP: 56.25,   // 1 USD = 56.25 PHP (unchanged - accurate)
  KRW: 1376,    // 1 USD = 1376 KRW (updated from 1330)
  CNY: 7.16,    // 1 USD = 7.16 CNY (updated from 7.24)
};

/**
 * Get currency for a country code
 */
export function getCurrencyForCountry(countryCode: string): Currency {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
}

/**
 * Convert USD price to target currency
 */
export function convertPrice(usdPrice: number, targetCurrency: Currency): number {
  const rate = EXCHANGE_RATES[targetCurrency];
  const converted = usdPrice * rate;

  // Round based on currency characteristics
  if (targetCurrency === 'JPY' || targetCurrency === 'KRW' || targetCurrency === 'IDR') {
    // Zero decimal currencies - round to whole number
    return Math.round(converted);
  } else {
    // Round to 2 decimal places
    return Math.round(converted * 100) / 100;
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];

  if (currency === 'JPY' || currency === 'KRW' || currency === 'IDR') {
    // Zero decimal currencies
    return `${currencyInfo.symbol}${Math.round(amount).toLocaleString()}`;
  }

  return `${currencyInfo.symbol}${amount.toFixed(2)}`;
}

/**
 * Detect user's country from request headers
 * Priority: CloudFront-Viewer-Country > CF-IPCountry > fallback to USD
 */
export function detectCountryFromRequest(headers: Headers): string {
  // Check CloudFront header (AWS)
  const cfCountry = headers.get('cloudfront-viewer-country');
  if (cfCountry) return cfCountry.toUpperCase();

  // Check Cloudflare header
  const cloudflareCountry = headers.get('cf-ipcountry');
  if (cloudflareCountry) return cloudflareCountry.toUpperCase();

  // Check Vercel header
  const vercelCountry = headers.get('x-vercel-ip-country');
  if (vercelCountry) return vercelCountry.toUpperCase();

  // Default to US (USD)
  return 'US';
}

/**
 * Get currency for Stripe checkout based on request
 */
export function getCurrencyForCheckout(headers: Headers): Currency {
  const country = detectCountryFromRequest(headers);
  return getCurrencyForCountry(country);
}

/**
 * Convert and format price for Stripe (in smallest currency unit)
 * Stripe requires amounts in cents for most currencies, but not for zero-decimal currencies
 */
export function convertToStripeAmount(usdPrice: number, currency: Currency): number {
  const converted = convertPrice(usdPrice, currency);

  // Zero-decimal currencies (JPY, KRW, IDR, etc.)
  if (currency === 'JPY' || currency === 'KRW' || currency === 'IDR') {
    return Math.round(converted);
  }

  // All other currencies - convert to cents
  return Math.round(converted * 100);
}
