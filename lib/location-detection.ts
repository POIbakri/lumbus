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
 * Uses Cloudflare trace (completely free, no limits)
 */
export async function detectUserLocation(): Promise<LocationInfo> {
  try {
    // Use Cloudflare's free trace endpoint (no rate limits!)
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to detect location');
    }

    const text = await response.text();
    const data: Record<string, string> = {};

    // Parse key=value format
    text.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        data[key.trim()] = value.trim();
      }
    });

    const countryCode = data['loc'] || 'US';
    const countryName = getCountryNameFromCode(countryCode);

    return {
      country: countryName,
      countryCode: countryCode,
      region: '',
      city: '',
      timezone: data['timezone'] || 'UTC',
      detected: true,
    };
  } catch (error) {
    console.error('Location detection error:', error);

    // Fallback to browser timezone-based guess
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = guessCountryFromTimezone(timezone);

    return {
      country: getCountryNameFromCode(countryCode),
      countryCode,
      region: '',
      city: '',
      timezone,
      detected: true, // Still show the banner
    };
  }
}

/**
 * Get country name from country code
 */
function getCountryNameFromCode(code: string): string {
  const countries: Record<string, string> = {
    // North America
    'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico', 'GT': 'Guatemala', 'BZ': 'Belize',
    'SV': 'El Salvador', 'HN': 'Honduras', 'NI': 'Nicaragua', 'CR': 'Costa Rica', 'PA': 'Panama',
    'CU': 'Cuba', 'JM': 'Jamaica', 'HT': 'Haiti', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico',
    'TT': 'Trinidad and Tobago', 'BB': 'Barbados', 'BS': 'Bahamas', 'KY': 'Cayman Islands',
    'VG': 'British Virgin Islands',

    // South America
    'BR': 'Brazil', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru',
    'VE': 'Venezuela', 'EC': 'Ecuador', 'BO': 'Bolivia', 'PY': 'Paraguay', 'UY': 'Uruguay',
    'GY': 'Guyana', 'SR': 'Suriname', 'GF': 'French Guiana',

    // Europe - Western
    'GB': 'United Kingdom', 'IE': 'Ireland', 'FR': 'France', 'ES': 'Spain', 'PT': 'Portugal',
    'IT': 'Italy', 'DE': 'Germany', 'NL': 'Netherlands', 'BE': 'Belgium', 'LU': 'Luxembourg',
    'CH': 'Switzerland', 'AT': 'Austria', 'GR': 'Greece', 'MT': 'Malta', 'CY': 'Cyprus',
    'IS': 'Iceland', 'AD': 'Andorra', 'MC': 'Monaco', 'LI': 'Liechtenstein', 'SM': 'San Marino',
    'VA': 'Vatican City',

    // Europe - Northern
    'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'FO': 'Faroe Islands',
    'GL': 'Greenland', 'AX': 'Åland Islands',

    // Europe - Eastern
    'PL': 'Poland', 'CZ': 'Czech Republic', 'SK': 'Slovakia', 'HU': 'Hungary', 'RO': 'Romania',
    'BG': 'Bulgaria', 'UA': 'Ukraine', 'BY': 'Belarus', 'MD': 'Moldova', 'RU': 'Russia',
    'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania',

    // Europe - Southern
    'HR': 'Croatia', 'SI': 'Slovenia', 'BA': 'Bosnia and Herzegovina', 'RS': 'Serbia',
    'ME': 'Montenegro', 'MK': 'North Macedonia', 'AL': 'Albania', 'XK': 'Kosovo',

    // Asia - East
    'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea', 'KP': 'North Korea', 'TW': 'Taiwan',
    'HK': 'Hong Kong', 'MO': 'Macau', 'MN': 'Mongolia',

    // Asia - Southeast
    'TH': 'Thailand', 'VN': 'Vietnam', 'SG': 'Singapore', 'MY': 'Malaysia', 'ID': 'Indonesia',
    'PH': 'Philippines', 'MM': 'Myanmar', 'KH': 'Cambodia', 'LA': 'Laos', 'BN': 'Brunei',
    'TL': 'East Timor',

    // Asia - South
    'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'NP': 'Nepal',
    'BT': 'Bhutan', 'MV': 'Maldives', 'AF': 'Afghanistan',

    // Asia - Central
    'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan', 'TM': 'Turkmenistan', 'TJ': 'Tajikistan',
    'KG': 'Kyrgyzstan',

    // Middle East
    'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'IL': 'Israel', 'PS': 'Palestine',
    'TR': 'Turkey', 'IR': 'Iran', 'IQ': 'Iraq', 'SY': 'Syria', 'LB': 'Lebanon', 'JO': 'Jordan',
    'YE': 'Yemen', 'OM': 'Oman', 'KW': 'Kuwait', 'BH': 'Bahrain', 'QA': 'Qatar',
    'GE': 'Georgia', 'AM': 'Armenia', 'AZ': 'Azerbaijan',

    // Africa - North
    'EG': 'Egypt', 'LY': 'Libya', 'TN': 'Tunisia', 'DZ': 'Algeria', 'MA': 'Morocco',
    'SD': 'Sudan', 'SS': 'South Sudan', 'EH': 'Western Sahara',

    // Africa - West
    'NG': 'Nigeria', 'GH': 'Ghana', 'CI': 'Ivory Coast', 'SN': 'Senegal', 'ML': 'Mali',
    'BF': 'Burkina Faso', 'NE': 'Niger', 'GN': 'Guinea', 'SL': 'Sierra Leone', 'LR': 'Liberia',
    'TG': 'Togo', 'BJ': 'Benin', 'MR': 'Mauritania', 'GM': 'Gambia', 'GW': 'Guinea-Bissau',
    'CV': 'Cape Verde',

    // Africa - East
    'KE': 'Kenya', 'TZ': 'Tanzania', 'UG': 'Uganda', 'RW': 'Rwanda', 'BI': 'Burundi',
    'ET': 'Ethiopia', 'ER': 'Eritrea', 'DJ': 'Djibouti', 'SO': 'Somalia', 'SC': 'Seychelles',
    'MU': 'Mauritius', 'MG': 'Madagascar', 'KM': 'Comoros', 'YT': 'Mayotte', 'RE': 'Réunion',

    // Africa - Central
    'CD': 'DR Congo', 'CG': 'Republic of Congo', 'CM': 'Cameroon', 'CF': 'Central African Republic',
    'TD': 'Chad', 'GA': 'Gabon', 'GQ': 'Equatorial Guinea', 'ST': 'São Tomé and Príncipe',
    'AO': 'Angola',

    // Africa - Southern
    'ZA': 'South Africa', 'ZW': 'Zimbabwe', 'ZM': 'Zambia', 'MW': 'Malawi', 'MZ': 'Mozambique',
    'BW': 'Botswana', 'NA': 'Namibia', 'LS': 'Lesotho', 'SZ': 'Eswatini',

    // Oceania
    'AU': 'Australia', 'NZ': 'New Zealand', 'PG': 'Papua New Guinea', 'FJ': 'Fiji',
    'SB': 'Solomon Islands', 'VU': 'Vanuatu', 'NC': 'New Caledonia', 'PF': 'French Polynesia',
    'WS': 'Samoa', 'KI': 'Kiribati', 'TO': 'Tonga', 'FM': 'Micronesia', 'MH': 'Marshall Islands',
    'PW': 'Palau', 'NR': 'Nauru', 'TV': 'Tuvalu', 'CK': 'Cook Islands', 'NU': 'Niue',
    'TK': 'Tokelau', 'WF': 'Wallis and Futuna', 'AS': 'American Samoa', 'GU': 'Guam',
    'MP': 'Northern Mariana Islands',
  };
  return countries[code] || code;
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
