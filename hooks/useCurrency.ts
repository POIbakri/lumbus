import { useState, useEffect } from 'react';

interface CurrencyInfo {
  country: string;
  currency: string;
  symbol: string;
  name: string;
}

interface ConvertedPrice {
  usd: number;
  converted: number;
  formatted: string;
}

/**
 * Hook to detect user's currency and convert prices
 * Automatically detects on mount based on user's location
 */
export function useCurrency() {
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectCurrency() {
      try {
        const response = await fetch('/api/currency/detect');
        if (!response.ok) {
          throw new Error('Failed to detect currency');
        }
        const data = await response.json();
        setCurrencyInfo(data);
      } catch (err) {
        console.error('Currency detection error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to USD
        setCurrencyInfo({
          country: 'US',
          currency: 'USD',
          symbol: '$',
          name: 'US Dollar',
        });
      } finally {
        setLoading(false);
      }
    }

    detectCurrency();
  }, []);

  /**
   * Convert a single USD price to user's currency
   */
  const convertPrice = async (usdPrice: number): Promise<number> => {
    if (!currencyInfo) return usdPrice;

    try {
      const response = await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: [usdPrice] }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      return data.prices[0].converted;
    } catch (err) {
      console.error('Price conversion error:', err);
      return usdPrice;
    }
  };

  /**
   * Convert multiple USD prices to user's currency
   */
  const convertPrices = async (
    usdPrices: number[]
  ): Promise<ConvertedPrice[]> => {
    if (!currencyInfo) {
      return usdPrices.map((usd) => ({
        usd,
        converted: usd,
        formatted: `$${usd.toFixed(2)}`,
      }));
    }

    try {
      const response = await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: usdPrices }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      return data.prices;
    } catch (err) {
      console.error('Price conversion error:', err);
      return usdPrices.map((usd) => ({
        usd,
        converted: usd,
        formatted: `$${usd.toFixed(2)}`,
      }));
    }
  };

  /**
   * Format a price in user's currency
   */
  const formatPrice = (amount: number): string => {
    if (!currencyInfo) return `$${amount.toFixed(2)}`;
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  return {
    currency: currencyInfo?.currency || 'USD',
    symbol: currencyInfo?.symbol || '$',
    country: currencyInfo?.country || 'US',
    name: currencyInfo?.name || 'US Dollar',
    loading,
    error,
    convertPrice,
    convertPrices,
    formatPrice,
  };
}

/**
 * Simple hook that just returns currency info without conversion functions
 * Useful for displaying currency symbol/name without needing to convert prices
 */
export function useCurrencyInfo() {
  const { currency, symbol, country, name, loading, error } = useCurrency();
  return { currency, symbol, country, name, loading, error };
}
