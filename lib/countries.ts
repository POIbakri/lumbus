/**
 * Country and region mappings for eSIM plans
 * Based on actual data from database (188 regions, 1700+ plans)
 */

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  continent: string;
}

export interface RegionInfo {
  code: string;
  name: string;
  description: string;
  countries: string[];
  flag: string;
}

// All single countries with their information
export const COUNTRIES: Record<string, CountryInfo> = {
  // Asia - Top regions
  JP: { code: 'JP', name: 'Japan', flag: '🇯🇵', continent: 'Asia' },
  CN: { code: 'CN', name: 'China', flag: '🇨🇳', continent: 'Asia' },
  KR: { code: 'KR', name: 'South Korea', flag: '🇰🇷', continent: 'Asia' },
  ID: { code: 'ID', name: 'Indonesia', flag: '🇮🇩', continent: 'Asia' },
  TH: { code: 'TH', name: 'Thailand', flag: '🇹🇭', continent: 'Asia' },
  MY: { code: 'MY', name: 'Malaysia', flag: '🇲🇾', continent: 'Asia' },
  SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬', continent: 'Asia' },
  VN: { code: 'VN', name: 'Vietnam', flag: '🇻🇳', continent: 'Asia' },
  PH: { code: 'PH', name: 'Philippines', flag: '🇵🇭', continent: 'Asia' },
  HK: { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', continent: 'Asia' },
  MO: { code: 'MO', name: 'Macau', flag: '🇲🇴', continent: 'Asia' },
  LK: { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', continent: 'Asia' },
  IN: { code: 'IN', name: 'India', flag: '🇮🇳', continent: 'Asia' },
  PK: { code: 'PK', name: 'Pakistan', flag: '🇵🇰', continent: 'Asia' },
  BD: { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', continent: 'Asia' },
  KH: { code: 'KH', name: 'Cambodia', flag: '🇰🇭', continent: 'Asia' },
  LA: { code: 'LA', name: 'Laos', flag: '🇱🇦', continent: 'Asia' },
  MN: { code: 'MN', name: 'Mongolia', flag: '🇲🇳', continent: 'Asia' },
  MM: { code: 'MM', name: 'Myanmar', flag: '🇲🇲', continent: 'Asia' },
  NP: { code: 'NP', name: 'Nepal', flag: '🇳🇵', continent: 'Asia' },
  BN: { code: 'BN', name: 'Brunei', flag: '🇧🇳', continent: 'Asia' },
  MV: { code: 'MV', name: 'Maldives', flag: '🇲🇻', continent: 'Asia' },
  TJ: { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', continent: 'Asia' },
  KG: { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', continent: 'Asia' },
  KZ: { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', continent: 'Asia' },
  UZ: { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', continent: 'Asia' },
  AM: { code: 'AM', name: 'Armenia', flag: '🇦🇲', continent: 'Asia' },
  AZ: { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', continent: 'Asia' },
  GE: { code: 'GE', name: 'Georgia', flag: '🇬🇪', continent: 'Asia' },
  AF: { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', continent: 'Asia' },

  // Europe
  FR: { code: 'FR', name: 'France', flag: '🇫🇷', continent: 'Europe' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪', continent: 'Europe' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', continent: 'Europe' },
  UK: { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', continent: 'Europe' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹', continent: 'Europe' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸', continent: 'Europe' },
  CH: { code: 'CH', name: 'Switzerland', flag: '🇨🇭', continent: 'Europe' },
  NL: { code: 'NL', name: 'Netherlands', flag: '🇳🇱', continent: 'Europe' },
  GR: { code: 'GR', name: 'Greece', flag: '🇬🇷', continent: 'Europe' },
  AT: { code: 'AT', name: 'Austria', flag: '🇦🇹', continent: 'Europe' },
  BE: { code: 'BE', name: 'Belgium', flag: '🇧🇪', continent: 'Europe' },
  PT: { code: 'PT', name: 'Portugal', flag: '🇵🇹', continent: 'Europe' },
  SE: { code: 'SE', name: 'Sweden', flag: '🇸🇪', continent: 'Europe' },
  NO: { code: 'NO', name: 'Norway', flag: '🇳🇴', continent: 'Europe' },
  DK: { code: 'DK', name: 'Denmark', flag: '🇩🇰', continent: 'Europe' },
  FI: { code: 'FI', name: 'Finland', flag: '🇫🇮', continent: 'Europe' },
  PL: { code: 'PL', name: 'Poland', flag: '🇵🇱', continent: 'Europe' },
  CZ: { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', continent: 'Europe' },
  HU: { code: 'HU', name: 'Hungary', flag: '🇭🇺', continent: 'Europe' },
  RO: { code: 'RO', name: 'Romania', flag: '🇷🇴', continent: 'Europe' },
  BG: { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', continent: 'Europe' },
  HR: { code: 'HR', name: 'Croatia', flag: '🇭🇷', continent: 'Europe' },
  RS: { code: 'RS', name: 'Serbia', flag: '🇷🇸', continent: 'Europe' },
  SI: { code: 'SI', name: 'Slovenia', flag: '🇸🇮', continent: 'Europe' },
  SK: { code: 'SK', name: 'Slovakia', flag: '🇸🇰', continent: 'Europe' },
  LT: { code: 'LT', name: 'Lithuania', flag: '🇱🇹', continent: 'Europe' },
  LV: { code: 'LV', name: 'Latvia', flag: '🇱🇻', continent: 'Europe' },
  EE: { code: 'EE', name: 'Estonia', flag: '🇪🇪', continent: 'Europe' },
  IE: { code: 'IE', name: 'Ireland', flag: '🇮🇪', continent: 'Europe' },
  CY: { code: 'CY', name: 'Cyprus', flag: '🇨🇾', continent: 'Europe' },
  LU: { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', continent: 'Europe' },
  MT: { code: 'MT', name: 'Malta', flag: '🇲🇹', continent: 'Europe' },
  IS: { code: 'IS', name: 'Iceland', flag: '🇮🇸', continent: 'Europe' },
  AL: { code: 'AL', name: 'Albania', flag: '🇦🇱', continent: 'Europe' },
  BA: { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', continent: 'Europe' },
  MK: { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', continent: 'Europe' },
  ME: { code: 'ME', name: 'Montenegro', flag: '🇲🇪', continent: 'Europe' },
  XK: { code: 'XK', name: 'Kosovo', flag: '🇽🇰', continent: 'Europe' },
  MD: { code: 'MD', name: 'Moldova', flag: '🇲🇩', continent: 'Europe' },
  BY: { code: 'BY', name: 'Belarus', flag: '🇧🇾', continent: 'Europe' },
  UA: { code: 'UA', name: 'Ukraine', flag: '🇺🇦', continent: 'Europe' },
  AD: { code: 'AD', name: 'Andorra', flag: '🇦🇩', continent: 'Europe' },
  MC: { code: 'MC', name: 'Monaco', flag: '🇲🇨', continent: 'Europe' },
  LI: { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', continent: 'Europe' },
  GI: { code: 'GI', name: 'Gibraltar', flag: '🇬🇮', continent: 'Europe' },
  IM: { code: 'IM', name: 'Isle of Man', flag: '🇮🇲', continent: 'Europe' },
  JE: { code: 'JE', name: 'Jersey', flag: '🇯🇪', continent: 'Europe' },
  GG: { code: 'GG', name: 'Guernsey', flag: '🇬🇬', continent: 'Europe' },
  AX: { code: 'AX', name: 'Åland Islands', flag: '🇦🇽', continent: 'Europe' },
  FO: { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴', continent: 'Europe' },
  TR: { code: 'TR', name: 'Turkey', flag: '🇹🇷', continent: 'Europe' },
  EU: { code: 'EU', name: 'European Union', flag: '🇪🇺', continent: 'Europe' },

  // Americas
  US: { code: 'US', name: 'United States', flag: '🇺🇸', continent: 'Americas' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦', continent: 'Americas' },
  MX: { code: 'MX', name: 'Mexico', flag: '🇲🇽', continent: 'Americas' },
  BR: { code: 'BR', name: 'Brazil', flag: '🇧🇷', continent: 'Americas' },
  AR: { code: 'AR', name: 'Argentina', flag: '🇦🇷', continent: 'Americas' },
  CL: { code: 'CL', name: 'Chile', flag: '🇨🇱', continent: 'Americas' },
  CO: { code: 'CO', name: 'Colombia', flag: '🇨🇴', continent: 'Americas' },
  PE: { code: 'PE', name: 'Peru', flag: '🇵🇪', continent: 'Americas' },
  EC: { code: 'EC', name: 'Ecuador', flag: '🇪🇨', continent: 'Americas' },
  UY: { code: 'UY', name: 'Uruguay', flag: '🇺🇾', continent: 'Americas' },
  PY: { code: 'PY', name: 'Paraguay', flag: '🇵🇾', continent: 'Americas' },
  BO: { code: 'BO', name: 'Bolivia', flag: '🇧🇴', continent: 'Americas' },
  CR: { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', continent: 'Americas' },
  PA: { code: 'PA', name: 'Panama', flag: '🇵🇦', continent: 'Americas' },
  GT: { code: 'GT', name: 'Guatemala', flag: '🇬🇹', continent: 'Americas' },
  HN: { code: 'HN', name: 'Honduras', flag: '🇭🇳', continent: 'Americas' },
  NI: { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', continent: 'Americas' },
  SV: { code: 'SV', name: 'El Salvador', flag: '🇸🇻', continent: 'Americas' },
  BZ: { code: 'BZ', name: 'Belize', flag: '🇧🇿', continent: 'Americas' },
  DO: { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', continent: 'Americas' },
  JM: { code: 'JM', name: 'Jamaica', flag: '🇯🇲', continent: 'Americas' },
  TT: { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', continent: 'Americas' },
  BS: { code: 'BS', name: 'Bahamas', flag: '🇧🇸', continent: 'Americas' },
  BB: { code: 'BB', name: 'Barbados', flag: '🇧🇧', continent: 'Americas' },
  GD: { code: 'GD', name: 'Grenada', flag: '🇬🇩', continent: 'Americas' },
  LC: { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', continent: 'Americas' },
  VC: { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', continent: 'Americas' },
  KN: { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', continent: 'Americas' },
  AG: { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', continent: 'Americas' },
  DM: { code: 'DM', name: 'Dominica', flag: '🇩🇲', continent: 'Americas' },
  AI: { code: 'AI', name: 'Anguilla', flag: '🇦🇮', continent: 'Americas' },
  BM: { code: 'BM', name: 'Bermuda', flag: '🇧🇲', continent: 'Americas' },
  KY: { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾', continent: 'Americas' },
  TC: { code: 'TC', name: 'Turks and Caicos', flag: '🇹🇨', continent: 'Americas' },
  VG: { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬', continent: 'Americas' },
  PR: { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', continent: 'Americas' },
  GP: { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', continent: 'Americas' },

  // Oceania
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺', continent: 'Oceania' },
  NZ: { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', continent: 'Oceania' },
  GU: { code: 'GU', name: 'Guam', flag: '🇬🇺', continent: 'Oceania' },

  // Middle East
  AE: { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', continent: 'Middle East' },
  SA: { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', continent: 'Middle East' },
  QA: { code: 'QA', name: 'Qatar', flag: '🇶🇦', continent: 'Middle East' },
  KW: { code: 'KW', name: 'Kuwait', flag: '🇰🇼', continent: 'Middle East' },
  BH: { code: 'BH', name: 'Bahrain', flag: '🇧🇭', continent: 'Middle East' },
  OM: { code: 'OM', name: 'Oman', flag: '🇴🇲', continent: 'Middle East' },
  IL: { code: 'IL', name: 'Israel', flag: '🇮🇱', continent: 'Middle East' },
  JO: { code: 'JO', name: 'Jordan', flag: '🇯🇴', continent: 'Middle East' },
  IQ: { code: 'IQ', name: 'Iraq', flag: '🇮🇶', continent: 'Middle East' },

  // Africa
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦', continent: 'Africa' },
  EG: { code: 'EG', name: 'Egypt', flag: '🇪🇬', continent: 'Africa' },
  MA: { code: 'MA', name: 'Morocco', flag: '🇲🇦', continent: 'Africa' },
  DZ: { code: 'DZ', name: 'Algeria', flag: '🇩🇿', continent: 'Africa' },
  TN: { code: 'TN', name: 'Tunisia', flag: '🇹🇳', continent: 'Africa' },
  KE: { code: 'KE', name: 'Kenya', flag: '🇰🇪', continent: 'Africa' },
  NG: { code: 'NG', name: 'Nigeria', flag: '🇳🇬', continent: 'Africa' },
  TZ: { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', continent: 'Africa' },
  UG: { code: 'UG', name: 'Uganda', flag: '🇺🇬', continent: 'Africa' },
  RW: { code: 'RW', name: 'Rwanda', flag: '🇷🇼', continent: 'Africa' },
  MU: { code: 'MU', name: 'Mauritius', flag: '🇲🇺', continent: 'Africa' },
  SC: { code: 'SC', name: 'Seychelles', flag: '🇸🇨', continent: 'Africa' },
  ZM: { code: 'ZM', name: 'Zambia', flag: '🇿🇲', continent: 'Africa' },
  BW: { code: 'BW', name: 'Botswana', flag: '🇧🇼', continent: 'Africa' },
  MZ: { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', continent: 'Africa' },
  MW: { code: 'MW', name: 'Malawi', flag: '🇲🇼', continent: 'Africa' },
  SZ: { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', continent: 'Africa' },
  SN: { code: 'SN', name: 'Senegal', flag: '🇸🇳', continent: 'Africa' },
  CM: { code: 'CM', name: 'Cameroon', flag: '🇨🇲', continent: 'Africa' },
  CI: { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', continent: 'Africa' },
  GA: { code: 'GA', name: 'Gabon', flag: '🇬🇦', continent: 'Africa' },
  CG: { code: 'CG', name: 'Republic of the Congo', flag: '🇨🇬', continent: 'Africa' },
  TD: { code: 'TD', name: 'Chad', flag: '🇹🇩', continent: 'Africa' },
  CF: { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', continent: 'Africa' },
  BF: { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', continent: 'Africa' },
  ML: { code: 'ML', name: 'Mali', flag: '🇲🇱', continent: 'Africa' },
  NE: { code: 'NE', name: 'Niger', flag: '🇳🇪', continent: 'Africa' },
  LR: { code: 'LR', name: 'Liberia', flag: '🇱🇷', continent: 'Africa' },
  SD: { code: 'SD', name: 'Sudan', flag: '🇸🇩', continent: 'Africa' },
  MG: { code: 'MG', name: 'Madagascar', flag: '🇲🇬', continent: 'Africa' },
  RE: { code: 'RE', name: 'Réunion', flag: '🇷🇪', continent: 'Africa' },
};

// Multi-country and regional packages
export const REGIONS: Record<string, RegionInfo> = {
  'NA-3': {
    code: 'NA-3',
    name: 'North America 3',
    description: 'USA, Canada, Mexico',
    countries: ['US', 'CA', 'MX'],
    flag: '🌎'
  },
  'EU-30': {
    code: 'EU-30',
    name: 'Europe 30',
    description: '30 European countries',
    countries: ['FR', 'DE', 'IT', 'ES', 'GB', 'NL', 'BE', 'AT', 'CH'],
    flag: '🇪🇺'
  },
  'EU-42': {
    code: 'EU-42',
    name: 'Europe 42',
    description: '42 European countries',
    countries: ['FR', 'DE', 'IT', 'ES', 'GB', 'NL', 'BE', 'AT', 'CH'],
    flag: '🇪🇺'
  },
  'USCA-2': {
    code: 'USCA-2',
    name: 'USA & Canada',
    description: 'United States and Canada',
    countries: ['US', 'CA'],
    flag: '🇺🇸'
  },
  'AUNZ-2': {
    code: 'AUNZ-2',
    name: 'Australia & New Zealand',
    description: 'Australia and New Zealand',
    countries: ['AU', 'NZ'],
    flag: '🇦🇺'
  },
  'CN-3': {
    code: 'CN-3',
    name: 'Greater China',
    description: 'China, Hong Kong, Macau',
    countries: ['CN', 'HK', 'MO'],
    flag: '🇨🇳'
  },
  'AS-7': {
    code: 'AS-7',
    name: 'Asia 7',
    description: '7 Asian countries',
    countries: ['JP', 'KR', 'SG', 'TH', 'MY', 'ID', 'PH'],
    flag: '🌏'
  },
  'AS-12': {
    code: 'AS-12',
    name: 'Asia 12',
    description: '12 Asian countries',
    countries: ['JP', 'KR', 'SG', 'TH', 'MY', 'ID', 'PH', 'VN', 'HK', 'TW', 'IN', 'CN'],
    flag: '🌏'
  },
  'AS-20': {
    code: 'AS-20',
    name: 'Asia 20',
    description: '20 Asian countries',
    countries: ['JP', 'KR', 'SG', 'TH', 'MY', 'ID', 'PH', 'VN', 'HK', 'TW', 'IN', 'CN'],
    flag: '🌏'
  },
  'AS-21': {
    code: 'AS-21',
    name: 'Asia 21',
    description: '21 Asian countries',
    countries: ['JP', 'KR', 'SG', 'TH', 'MY', 'ID', 'PH', 'VN', 'HK', 'TW', 'IN', 'CN'],
    flag: '🌏'
  },
  'ME-6': {
    code: 'ME-6',
    name: 'Middle East 6',
    description: '6 Middle Eastern countries',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'],
    flag: '🕌'
  },
  'ME-12': {
    code: 'ME-12',
    name: 'Middle East 12',
    description: '12 Middle Eastern countries',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'EG', 'TR'],
    flag: '🕌'
  },
  'SA-18': {
    code: 'SA-18',
    name: 'South America 18',
    description: '18 South American countries',
    countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'UY', 'PY', 'BO'],
    flag: '🌎'
  },
  'CB-25': {
    code: 'CB-25',
    name: 'Caribbean 25',
    description: '25 Caribbean countries',
    countries: ['JM', 'TT', 'BS', 'BB', 'DO'],
    flag: '🏝️'
  },
  'GL-139': {
    code: 'GL-139',
    name: 'Global 139',
    description: '139 countries worldwide',
    countries: [],
    flag: '🌍'
  },
};

// Get country info with fallback
export function getCountryInfo(code: string): CountryInfo {
  const country = COUNTRIES[code.toUpperCase()];
  if (country) return country;

  // Check if it's a region
  const region = REGIONS[code.toUpperCase()];
  if (region) {
    return {
      code: region.code,
      name: region.name,
      flag: region.flag,
      continent: 'Multi-Country'
    };
  }

  // Fallback for unknown codes
  return {
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    flag: '🌐',
    continent: 'Unknown'
  };
}

// Get all countries grouped by continent
export function getCountriesByContinent(): Record<string, CountryInfo[]> {
  const grouped: Record<string, CountryInfo[]> = {};

  Object.values(COUNTRIES).forEach(country => {
    if (!grouped[country.continent]) {
      grouped[country.continent] = [];
    }
    grouped[country.continent].push(country);
  });

  // Sort countries within each continent
  Object.keys(grouped).forEach(continent => {
    grouped[continent].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}

// Get continent emoji
export function getContinentEmoji(continent: string): string {
  const emojis: Record<string, string> = {
    'Asia': '🌏',
    'Europe': '🇪🇺',
    'Americas': '🌎',
    'Oceania': '🦘',
    'Middle East': '🕌',
    'Africa': '🌍',
    'Multi-Country': '🌐'
  };
  return emojis[continent] || '🌐';
}

// Search countries by name or code
export function searchCountries(query: string): CountryInfo[] {
  const q = query.toLowerCase();
  return Object.values(COUNTRIES).filter(country =>
    country.name.toLowerCase().includes(q) ||
    country.code.toLowerCase().includes(q)
  );
}
