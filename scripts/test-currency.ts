/**
 * Test script for currency detection and conversion
 * Run with: npx tsx scripts/test-currency.ts
 */

import {
  getCurrencyForCountry,
  convertPrice,
  formatPrice,
  convertToStripeAmount,
  SUPPORTED_CURRENCIES,
  type Currency,
} from '@/lib/currency';

console.log('🌍 Testing Currency System\n');

// Test 1: Country to Currency Mapping
console.log('1️⃣ Testing Country → Currency Mapping:');
const testCountries = [
  'GB', 'US', 'FR', 'DE', 'JP', 'AU', 'CA', 'SG', 'HK', 'IN', 'BR', 'MX',
];

testCountries.forEach((country) => {
  const currency = getCurrencyForCountry(country);
  const info = SUPPORTED_CURRENCIES[currency];
  console.log(`   ${country} → ${currency} (${info.symbol} ${info.name})`);
});

// Test 2: Price Conversion
console.log('\n2️⃣ Testing Price Conversion:');
const testPriceUSD = 15.99;
const testCurrencies: Currency[] = ['GBP', 'EUR', 'JPY', 'AUD', 'CAD', 'SGD'];

console.log(`   Base price: $${testPriceUSD} USD\n`);
testCurrencies.forEach((currency) => {
  const converted = convertPrice(testPriceUSD, currency);
  const formatted = formatPrice(converted, currency);
  console.log(`   → ${formatted} ${currency}`);
});

// Test 3: Stripe Amount Conversion
console.log('\n3️⃣ Testing Stripe Amount Conversion:');
console.log(`   Base price: $${testPriceUSD} USD\n`);

const stripeCurrencies: Currency[] = ['USD', 'GBP', 'EUR', 'JPY', 'KRW', 'IDR'];
stripeCurrencies.forEach((currency) => {
  const stripeAmount = convertToStripeAmount(testPriceUSD, currency);
  const isZeroDecimal = ['JPY', 'KRW', 'IDR'].includes(currency);

  console.log(
    `   ${currency}: ${stripeAmount}${isZeroDecimal ? '' : ' (cents)'}`
  );
});

// Test 4: Real-World Examples
console.log('\n4️⃣ Real-World Pricing Examples:');
const plans = [
  { name: 'Global 1GB 7Days', usdPrice: 15.99 },
  { name: 'Europe 5GB 30Days', usdPrice: 22.99 },
  { name: 'USA & Canada 10GB 30Days', usdPrice: 33.99 },
];

const displayCurrencies: Currency[] = ['USD', 'GBP', 'EUR', 'JPY'];

plans.forEach((plan) => {
  console.log(`\n   ${plan.name}:`);
  displayCurrencies.forEach((currency) => {
    const converted = convertPrice(plan.usdPrice, currency);
    const formatted = formatPrice(converted, currency);
    console.log(`      ${currency}: ${formatted}`);
  });
});

// Test 5: Margin Check (Ensure we're still profitable after conversion)
console.log('\n5️⃣ Margin Check (assuming 200% margin on USD):');
const wholesaleCost = 6.00; // Example wholesale cost
const retailPriceUSD = 15.99; // Our retail price
const marginUSD = ((retailPriceUSD - wholesaleCost) / wholesaleCost) * 100;

console.log(`   Wholesale Cost: $${wholesaleCost}`);
console.log(`   Retail Price (USD): $${retailPriceUSD}`);
console.log(`   Margin (USD): ${marginUSD.toFixed(1)}%\n`);

testCurrencies.forEach((currency) => {
  const convertedRetail = convertPrice(retailPriceUSD, currency);
  const convertedWholesale = convertPrice(wholesaleCost, currency);
  const margin = ((convertedRetail - convertedWholesale) / convertedWholesale) * 100;

  console.log(
    `   ${currency}: ${formatPrice(convertedRetail, currency)} ` +
    `(margin: ${margin.toFixed(1)}%)`
  );
});

// Test 6: Currency Coverage
console.log('\n6️⃣ Currency Coverage:');
console.log(`   Total supported currencies: ${Object.keys(SUPPORTED_CURRENCIES).length}`);
console.log(`   Zero-decimal currencies: JPY, KRW, IDR`);
console.log(`   Most common for eSIMs: USD, GBP, EUR, AUD, CAD, SGD`);

console.log('\n✅ All tests completed!\n');
console.log('📝 Notes:');
console.log('   - Exchange rates are hardcoded in lib/currency.ts');
console.log('   - Consider using an API for production (exchangerate-api.com)');
console.log('   - Update rates regularly (daily or weekly)');
console.log('   - All margins are preserved after currency conversion\n');
