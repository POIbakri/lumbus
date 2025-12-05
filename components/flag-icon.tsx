'use client';

import * as Flags from 'country-flag-icons/react/3x2';
import { hasFlag } from 'country-flag-icons';

interface FlagIconProps {
  countryCode: string;
  className?: string;
}

// Custom SVG flags for regions and special codes
const RegionalFlags: Record<string, React.FC<{ className?: string }>> = {
  // Global
  'GLOBAL': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),

  // Europe (EU flag - blue with stars)
  'EU': ({ className }) => (
    <svg className={className} viewBox="0 0 810 540">
      <rect fill="#039" width="810" height="540"/>
      <g fill="#FC0">
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          const cx = 405 + 140 * Math.cos(angle);
          const cy = 270 + 140 * Math.sin(angle);
          return (
            <polygon
              key={i}
              points={`${cx},${cy-20} ${cx+6},${cy-6} ${cx+19},${cy-6} ${cx+9},${cy+4} ${cx+12},${cy+18} ${cx},${cy+10} ${cx-12},${cy+18} ${cx-9},${cy+4} ${cx-19},${cy-6} ${cx-6},${cy-6}`}
            />
          );
        })}
      </g>
    </svg>
  ),
  'EU-30': ({ className }) => RegionalFlags['EU']({ className }),
  'EU-39': ({ className }) => RegionalFlags['EU']({ className }),
  'EU-42': ({ className }) => RegionalFlags['EU']({ className }),
  'EUROPE': ({ className }) => RegionalFlags['EU']({ className }),

  // Asia (stylized)
  'ASIA': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#E53935" width="36" height="24"/>
      <circle cx="18" cy="12" r="6" fill="#FFD600"/>
    </svg>
  ),
  'ASIA-17': ({ className }) => RegionalFlags['ASIA']({ className }),
  'ASIA-20': ({ className }) => RegionalFlags['ASIA']({ className }),
  'AS-7': ({ className }) => RegionalFlags['ASIA']({ className }),
  'AS-12': ({ className }) => RegionalFlags['ASIA']({ className }),
  'AS-20': ({ className }) => RegionalFlags['ASIA']({ className }),
  'AS-21': ({ className }) => RegionalFlags['ASIA']({ className }),
  'SOUTHEAST-ASIA': ({ className }) => RegionalFlags['ASIA']({ className }),

  // Africa
  'AFRICA': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#43A047" width="36" height="8"/>
      <rect fill="#FFD600" width="36" height="8" y="8"/>
      <rect fill="#E53935" width="36" height="8" y="16"/>
    </svg>
  ),
  'AFRICA-20': ({ className }) => RegionalFlags['AFRICA']({ className }),
  'AFRICA-32': ({ className }) => RegionalFlags['AFRICA']({ className }),

  // Middle East
  'MIDDLE-EAST': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#1E88E5" width="36" height="24"/>
      <polygon fill="#FFD600" points="18,4 20,10 26,10 21,14 23,20 18,16 13,20 15,14 10,10 16,10"/>
    </svg>
  ),
  'MENA': ({ className }) => RegionalFlags['MIDDLE-EAST']({ className }),
  'ME-6': ({ className }) => RegionalFlags['MIDDLE-EAST']({ className }),
  'ME-12': ({ className }) => RegionalFlags['MIDDLE-EAST']({ className }),

  // Americas
  'AMERICAS': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#1565C0" width="36" height="24"/>
      <rect fill="#E53935" width="36" height="4" y="10"/>
      <rect fill="#FFFFFF" width="36" height="2" y="11"/>
    </svg>
  ),
  'NORTH-AMERICA': ({ className }) => RegionalFlags['AMERICAS']({ className }),
  'NA-3': ({ className }) => RegionalFlags['AMERICAS']({ className }),
  'SOUTH-AMERICA': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#43A047" width="36" height="24"/>
      <polygon fill="#FFD600" points="18,2 36,12 18,22 0,12"/>
      <circle cx="18" cy="12" r="5" fill="#1565C0"/>
    </svg>
  ),
  'LATAM': ({ className }) => RegionalFlags['SOUTH-AMERICA']({ className }),
  'SA-18': ({ className }) => RegionalFlags['SOUTH-AMERICA']({ className }),

  // Caribbean
  'CARIBBEAN': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#00ACC1" width="36" height="24"/>
      <circle cx="12" cy="12" r="4" fill="#FFD600"/>
      <path fill="#43A047" d="M20,8 Q28,6 32,12 Q28,18 20,16 Q24,12 20,8"/>
    </svg>
  ),
  'CB-25': ({ className }) => RegionalFlags['CARIBBEAN']({ className }),

  // Oceania / Pacific
  'OCEANIA': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#1565C0" width="36" height="24"/>
      <g fill="#FFFFFF">
        <polygon points="18,6 19,9 22,9 19.5,11 20.5,14 18,12 15.5,14 16.5,11 14,9 17,9"/>
        <polygon points="10,14 10.7,16 13,16 11.2,17.2 11.8,19.5 10,18 8.2,19.5 8.8,17.2 7,16 9.3,16" transform="scale(0.7) translate(4,4)"/>
        <polygon points="26,10 26.7,12 29,12 27.2,13.2 27.8,15.5 26,14 24.2,15.5 24.8,13.2 23,12 25.3,12" transform="scale(0.6) translate(10,2)"/>
      </g>
    </svg>
  ),
  'PACIFIC': ({ className }) => RegionalFlags['OCEANIA']({ className }),
  'AUNZ-2': ({ className }) => RegionalFlags['OCEANIA']({ className }),

  // USA & Canada
  'USCA-2': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#1565C0" width="36" height="24"/>
      <rect fill="#E53935" width="36" height="3" y="3"/>
      <rect fill="#FFFFFF" width="36" height="3" y="6"/>
      <rect fill="#E53935" width="36" height="3" y="9"/>
      <rect fill="#FFFFFF" width="36" height="3" y="12"/>
      <rect fill="#E53935" width="36" height="3" y="15"/>
      <rect fill="#FFFFFF" width="36" height="3" y="18"/>
      <rect fill="#E53935" width="36" height="3" y="21"/>
      <rect fill="#1565C0" width="14" height="12"/>
      <polygon fill="#FFFFFF" points="7,6 7.5,7.5 9,7.5 7.8,8.3 8.2,9.8 7,9 5.8,9.8 6.2,8.3 5,7.5 6.5,7.5"/>
    </svg>
  ),

  // Greater China
  'CN-3': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#DE2910" width="36" height="24"/>
      <polygon fill="#FFDE00" points="6,4 7.2,7.7 11,7.7 7.9,10 9.1,13.7 6,11.4 2.9,13.7 4.1,10 1,7.7 4.8,7.7"/>
      <polygon fill="#FFDE00" points="13,2 13.4,3.2 14.7,3.2 13.6,4 14,5.2 13,4.4 12,5.2 12.4,4 11.3,3.2 12.6,3.2"/>
      <polygon fill="#FFDE00" points="16,4 16.4,5.2 17.7,5.2 16.6,6 17,7.2 16,6.4 15,7.2 15.4,6 14.3,5.2 15.6,5.2"/>
      <polygon fill="#FFDE00" points="16,8 16.4,9.2 17.7,9.2 16.6,10 17,11.2 16,10.4 15,11.2 15.4,10 14.3,9.2 15.6,9.2"/>
      <polygon fill="#FFDE00" points="13,11 13.4,12.2 14.7,12.2 13.6,13 14,14.2 13,13.4 12,14.2 12.4,13 11.3,12.2 12.6,12.2"/>
    </svg>
  ),

  // Global
  'GL-139': ({ className }) => RegionalFlags['GLOBAL']({ className }),

  // CIS / Central Asia
  'CIS': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#5C6BC0" width="36" height="24"/>
      <circle cx="18" cy="12" r="6" fill="none" stroke="#FFD600" strokeWidth="2"/>
      <circle cx="18" cy="12" r="3" fill="#FFD600"/>
    </svg>
  ),

  // Balkans
  'BALKANS': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#1565C0" width="36" height="8"/>
      <rect fill="#FFFFFF" width="36" height="8" y="8"/>
      <rect fill="#E53935" width="36" height="8" y="16"/>
    </svg>
  ),

  // Gulf
  'GULF': ({ className }) => (
    <svg className={className} viewBox="0 0 36 24">
      <rect fill="#43A047" width="36" height="24"/>
      <rect fill="#FFFFFF" width="36" height="8" y="8"/>
      <polygon fill="#E53935" points="0,0 12,12 0,24"/>
    </svg>
  ),
  'GCC': ({ className }) => RegionalFlags['GULF']({ className }),
};

export function FlagIcon({ countryCode, className = 'w-6 h-4' }: FlagIconProps) {
  const upperCode = countryCode?.toUpperCase() || 'GLOBAL';

  // Check for regional/special flags first
  const RegionalFlag = RegionalFlags[upperCode];
  if (RegionalFlag) {
    return <RegionalFlag className={`${className} inline-block rounded-sm`} />;
  }

  // Check if valid country code for country-flag-icons
  if (upperCode.length === 2 && hasFlag(upperCode)) {
    const FlagComponent = Flags[upperCode as keyof typeof Flags];
    if (FlagComponent) {
      return <FlagComponent className={`${className} inline-block rounded-sm`} />;
    }
  }

  // Fallback to globe icon
  return RegionalFlags['GLOBAL']({ className: `${className} inline-block text-gray-400` });
}

// Helper to check if a flag exists
export function hasFlagIcon(countryCode: string): boolean {
  const upperCode = countryCode?.toUpperCase() || '';
  return upperCode in RegionalFlags || (upperCode.length === 2 && hasFlag(upperCode));
}
