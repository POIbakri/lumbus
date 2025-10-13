/**
 * Location detection for personalized plan suggestions
 * Uses IP-based geolocation API
 */

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  detected: boolean;
}

/**
 * Detect user location via IP geolocation
 * Uses ipapi.co free tier (no API key required)
 */
export async function detectUserLocation(): Promise<LocationInfo> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to detect location');
    }

    const data = await response.json();

    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'US',
      region: data.region || '',
      city: data.city || '',
      timezone: data.timezone || 'UTC',
      detected: true,
    };
  } catch (error) {
    console.error('Location detection error:', error);

    // Fallback to browser timezone-based guess
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = guessCountryFromTimezone(timezone);

    return {
      country: 'Unknown',
      countryCode,
      region: '',
      city: '',
      timezone,
      detected: false,
    };
  }
}

/**
 * Map region code to full region name
 */
export function getRegionName(regionCode: string): string {
  const regions: Record<string, string> = {
    'US': 'United States',
    'EU': 'Europe',
    'UK': 'United Kingdom',
    'JP': 'Japan',
    'CN': 'China',
    'AU': 'Australia',
    'CA': 'Canada',
    'GLOBAL': 'Global Coverage',
    'ASIA': 'Asia',
    'LATAM': 'Latin America',
    'AFRICA': 'Africa',
    'MENA': 'Middle East & North Africa',
  };

  return regions[regionCode] || regionCode;
}

/**
 * Get relevant region codes based on country code
 */
export function getRelevantRegions(countryCode: string): string[] {
  const countryToRegions: Record<string, string[]> = {
    // North America
    'US': ['US', 'GLOBAL'],
    'CA': ['US', 'CA', 'GLOBAL'],
    'MX': ['LATAM', 'US', 'GLOBAL'],

    // Europe
    'GB': ['UK', 'EU', 'GLOBAL'],
    'FR': ['EU', 'GLOBAL'],
    'DE': ['EU', 'GLOBAL'],
    'ES': ['EU', 'GLOBAL'],
    'IT': ['EU', 'GLOBAL'],
    'NL': ['EU', 'GLOBAL'],
    'BE': ['EU', 'GLOBAL'],
    'CH': ['EU', 'GLOBAL'],
    'AT': ['EU', 'GLOBAL'],
    'SE': ['EU', 'GLOBAL'],
    'NO': ['EU', 'GLOBAL'],
    'DK': ['EU', 'GLOBAL'],
    'FI': ['EU', 'GLOBAL'],
    'PL': ['EU', 'GLOBAL'],
    'IE': ['UK', 'EU', 'GLOBAL'],

    // Asia
    'JP': ['JP', 'ASIA', 'GLOBAL'],
    'CN': ['CN', 'ASIA', 'GLOBAL'],
    'KR': ['ASIA', 'GLOBAL'],
    'TH': ['ASIA', 'GLOBAL'],
    'SG': ['ASIA', 'GLOBAL'],
    'HK': ['ASIA', 'CN', 'GLOBAL'],
    'TW': ['ASIA', 'GLOBAL'],
    'IN': ['ASIA', 'GLOBAL'],
    'ID': ['ASIA', 'GLOBAL'],
    'MY': ['ASIA', 'GLOBAL'],
    'PH': ['ASIA', 'GLOBAL'],
    'VN': ['ASIA', 'GLOBAL'],

    // Oceania
    'AU': ['AU', 'GLOBAL'],
    'NZ': ['AU', 'GLOBAL'],

    // Latin America
    'BR': ['LATAM', 'GLOBAL'],
    'AR': ['LATAM', 'GLOBAL'],
    'CL': ['LATAM', 'GLOBAL'],
    'CO': ['LATAM', 'GLOBAL'],
    'PE': ['LATAM', 'GLOBAL'],

    // Middle East & Africa
    'AE': ['MENA', 'GLOBAL'],
    'SA': ['MENA', 'GLOBAL'],
    'ZA': ['AFRICA', 'GLOBAL'],
    'EG': ['MENA', 'GLOBAL'],
    'IL': ['MENA', 'GLOBAL'],
  };

  return countryToRegions[countryCode] || ['GLOBAL'];
}

/**
 * Simple timezone to country code mapping (fallback)
 */
function guessCountryFromTimezone(timezone: string): string {
  if (timezone.startsWith('America/')) {
    if (timezone.includes('New_York') || timezone.includes('Chicago') || timezone.includes('Los_Angeles')) {
      return 'US';
    }
    if (timezone.includes('Toronto')) return 'CA';
    if (timezone.includes('Mexico')) return 'MX';
    if (timezone.includes('Sao_Paulo')) return 'BR';
    return 'US';
  }

  if (timezone.startsWith('Europe/')) {
    if (timezone.includes('London')) return 'GB';
    if (timezone.includes('Paris')) return 'FR';
    if (timezone.includes('Berlin')) return 'DE';
    return 'EU';
  }

  if (timezone.startsWith('Asia/')) {
    if (timezone.includes('Tokyo')) return 'JP';
    if (timezone.includes('Shanghai') || timezone.includes('Hong_Kong')) return 'CN';
    if (timezone.includes('Seoul')) return 'KR';
    if (timezone.includes('Singapore')) return 'SG';
    return 'ASIA';
  }

  if (timezone.startsWith('Australia/')) return 'AU';

  return 'US'; // Default fallback
}

/**
 * Get flag emoji for country code
 */
export function getFlagEmoji(countryCode: string): string {
  if (countryCode === 'GLOBAL') return '🌍';
  if (countryCode === 'EU') return '🇪🇺';
  if (countryCode === 'ASIA') return '🌏';
  if (countryCode === 'LATAM') return '🌎';
  if (countryCode === 'AFRICA') return '🌍';
  if (countryCode === 'MENA') return '🌍';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
