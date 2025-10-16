import { NextRequest, NextResponse } from 'next/server';
import {
  detectCountryFromRequest,
  getCurrencyForCheckout,
  convertPrice,
  formatPrice,
  SUPPORTED_CURRENCIES,
  type Currency,
} from '@/lib/currency';

/**
 * API endpoint to detect user's currency and convert prices
 * Used by frontend to display prices in local currency
 */
export async function GET(req: NextRequest) {
  try {
    const country = detectCountryFromRequest(req.headers);
    const currency = getCurrencyForCheckout(req.headers);
    const currencyInfo = SUPPORTED_CURRENCIES[currency];

    return NextResponse.json({
      country,
      currency,
      symbol: currencyInfo.symbol,
      name: currencyInfo.name,
    });
  } catch (error) {
    console.error('Currency detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect currency' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to convert prices from USD to user's currency
 * POST body: { prices: number[] } - array of USD prices
 * Returns: { currency, symbol, converted: number[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prices } = body;

    if (!Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'prices must be an array of numbers' },
        { status: 400 }
      );
    }

    const currency = getCurrencyForCheckout(req.headers);
    const currencyInfo = SUPPORTED_CURRENCIES[currency];

    const converted = prices.map((usdPrice) => {
      const convertedPrice = convertPrice(usdPrice, currency);
      return {
        usd: usdPrice,
        converted: convertedPrice,
        formatted: formatPrice(convertedPrice, currency),
      };
    });

    return NextResponse.json({
      currency,
      symbol: currencyInfo.symbol,
      name: currencyInfo.name,
      prices: converted,
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert prices' },
      { status: 500 }
    );
  }
}
