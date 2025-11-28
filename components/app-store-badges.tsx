'use client';

import Link from 'next/link';
import Image from 'next/image';
import { track } from '@vercel/analytics';
import { APP_STORE_LINKS } from '@/lib/app-store-config';

const BADGE_PRESETS = {
  default: {
    container: 'h-[58px] w-[220px]',
    sizes: '(min-width: 640px) 220px, 200px',
  },
  compact: {
    container: 'h-[46px] w-[180px]',
    sizes: '(min-width: 640px) 180px, 160px',
  },
} as const;

const BADGE_CHROME =
  'relative flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black px-5 shadow-[0_14px_30px_rgba(0,0,0,0.35)]';

interface AppStoreBadgesProps {
  className?: string;
  variant?: 'default' | 'compact';
  showQR?: boolean;
}

export function AppStoreBadges({ className = '', variant = 'default', showQR = false }: AppStoreBadgesProps) {
  const preset = BADGE_PRESETS[variant];
  const shellClass = `${BADGE_CHROME} ${preset.container}`;

  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center ${className}`}>
      {/* App Store Badge */}
      <Link
        href={APP_STORE_LINKS.ios}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:opacity-90 transition-opacity"
        aria-label="Download on the App Store"
        onClick={() => track('App Store Click', { store: 'ios' })}
      >
        <div className={shellClass}>
          <Image
            src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1276560000"
            alt="Download on the App Store"
            fill
            sizes={preset.sizes}
            className="object-contain"
            priority
          />
        </div>
      </Link>

      {/* Google Play Badge */}
      <Link
        href={APP_STORE_LINKS.android}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:opacity-90 transition-opacity"
        aria-label="Get it on Google Play"
        onClick={() => track('App Store Click', { store: 'android' })}
      >
        <div className={shellClass}>
          <Image
            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
            alt="Get it on Google Play"
            fill
            sizes={preset.sizes}
            className="object-contain"
            priority
          />
        </div>
      </Link>

      {/* Optional QR Code */}
      {showQR && (
        <div className="ml-auto hidden lg:block">
          <div className="bg-white p-2 rounded-lg border-2 border-gray-200">
            <Image
              src="/app-qr-code.png" // You'll need to generate and add this QR code
              alt="Scan to download app"
              width={100}
              height={100}
              className="w-24 h-24"
            />
            <p className="text-xs text-center mt-1 text-gray-600">Scan to download</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SVG version for better performance and customization
export function AppStoreBadgesInline({ className = '', variant = 'default' }: AppStoreBadgesProps) {
  const preset = BADGE_PRESETS[variant];
  const shellClass = `${BADGE_CHROME} ${preset.container}`;

  return (
    <div className={`flex flex-wrap gap-4 items-center ${className}`}>
      {/* App Store Badge SVG */}
      <Link
        href={APP_STORE_LINKS.ios}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:opacity-90 transition-opacity"
        aria-label="Download on the App Store"
        onClick={() => track('App Store Click', { store: 'ios' })}
      >
        <div className={shellClass}>
          <svg viewBox="0 0 120 40" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="40" rx="8" fill="black" />
            <path
              d="M24.769 20.3a4.949 4.949 0 0 1 2.357-4.152 5.065 5.065 0 0 0-3.991-2.157c-1.68-.178-3.307 1.005-4.164 1.005-.872 0-2.19-.986-3.608-.958a5.315 5.315 0 0 0-4.473 2.728c-1.934 3.349-.491 8.27 1.361 10.976.927 1.325 2.01 2.806 3.428 2.753 1.387-.057 1.905-.884 3.58-.884 1.658 0 2.145.884 3.591.851 1.488-.024 2.426-1.331 3.32-2.669a10.96 10.96 0 0 0 1.518-3.093 4.782 4.782 0 0 1-2.919-4.4zm-2.732-8.09a4.872 4.872 0 0 0 1.115-3.49 4.957 4.957 0 0 0-3.208 1.66 4.636 4.636 0 0 0-1.143 3.36 4.1 4.1 0 0 0 3.236-1.53z"
              fill="white"
            />
            <text x="38" y="15" fill="white" fontSize="8" fontFamily="system-ui, -apple-system, sans-serif">
              Download on the
            </text>
            <text x="38" y="28" fill="white" fontSize="12" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600">
              App Store
            </text>
          </svg>
        </div>
      </Link>

      {/* Google Play Badge SVG */}
      <Link
        href={APP_STORE_LINKS.android}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:opacity-90 transition-opacity"
        aria-label="Get it on Google Play"
        onClick={() => track('App Store Click', { store: 'android' })}
      >
        <div className={shellClass}>
          <svg viewBox="0 0 135 40" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="135" height="40" rx="8" fill="black" />
            <path d="M14.13 10.92L24.5 20l-10.37 9.08c-.33-.37-.53-.88-.53-1.44V12.36c0-.56.2-1.07.53-1.44z" fill="url(#play-gradient-1)" />
            <path d="M30.38 25.38l-5.88-5.38 5.88-5.38c.87.5 1.47 1.44 1.47 2.52v5.72c0 1.08-.6 2.02-1.47 2.52z" fill="url(#play-gradient-2)" />
            <path d="M14.13 10.92c.31-.34.71-.56 1.16-.62l14.09 14.7-14.09 12.38c-.45-.06-.85-.28-1.16-.62z" fill="url(#play-gradient-3)" />
            <path d="M24.5 20L15.29 11.3c.14-.02.28-.03.43-.03.41 0 .81.11 1.16.31L30.38 20l-13.5 8.42c-.35.2-.75.31-1.16.31-.15 0-.29-.01-.43-.03L24.5 20z" fill="url(#play-gradient-4)" />
            <defs>
              <linearGradient id="play-gradient-1" x1="21.8" y1="10.29" x2="5.02" y2="27.07" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00a0ff" />
                <stop offset=".007" stopColor="#00a1ff" />
                <stop offset=".26" stopColor="#00beff" />
                <stop offset=".512" stopColor="#00d2ff" />
                <stop offset=".76" stopColor="#00dfff" />
                <stop offset="1" stopColor="#00e3ff" />
              </linearGradient>
              <linearGradient id="play-gradient-2" x1="33.83" y1="20" x2="9.64" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffe000" />
                <stop offset=".409" stopColor="#ffbd00" />
                <stop offset=".775" stopColor="#ffa500" />
                <stop offset="1" stopColor="#ff9c00" />
              </linearGradient>
              <linearGradient id="play-gradient-3" x1="24.83" y1="22.3" x2="2.07" y2="45.06" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff3a44" />
                <stop offset="1" stopColor="#c31162" />
              </linearGradient>
              <linearGradient id="play-gradient-4" x1="7.3" y1="0.18" x2="17.46" y2="10.34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#32a071" />
                <stop offset=".069" stopColor="#2da771" />
                <stop offset=".476" stopColor="#15cf74" />
                <stop offset=".801" stopColor="#06e775" />
                <stop offset="1" stopColor="#00f076" />
              </linearGradient>
            </defs>
            <text x="45" y="15" fill="white" fontSize="8" fontFamily="system-ui, -apple-system, sans-serif">
              GET IT ON
            </text>
            <text x="45" y="28" fill="white" fontSize="12" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600">
              Google Play
            </text>
          </svg>
        </div>
      </Link>
    </div>
  );
}