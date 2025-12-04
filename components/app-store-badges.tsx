'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { APP_STORE_LINKS } from '@/lib/app-store-config';

interface AppStoreBadgesProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function AppStoreBadges({ className = '', variant = 'default' }: AppStoreBadgesProps) {
  const isCompact = variant === 'compact';

  // Responsive badge classes for all screen sizes
  const badgeClass = isCompact
    ? 'group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-black hover:bg-gray-900 rounded-lg sm:rounded-xl border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] hover:shadow-lg min-w-[130px] sm:min-w-[140px]'
    : 'group flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-black hover:bg-gray-900 rounded-xl border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] hover:shadow-xl min-w-[140px] sm:min-w-[160px]';

  return (
    <div className={`flex flex-row gap-2 sm:gap-3 items-center justify-center flex-wrap ${className}`}>
      {/* App Store Badge */}
      <Link
        href={APP_STORE_LINKS.ios}
        target="_blank"
        rel="noopener noreferrer"
        className={badgeClass}
        aria-label="Download on the App Store"
        onClick={() => track('App Store Click', { store: 'ios' })}
      >
        {/* Apple Logo */}
        <svg className={`${isCompact ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-7 sm:h-7'} text-white flex-shrink-0`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div className="flex flex-col min-w-0">
          <span className={`${isCompact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'} text-gray-400 leading-tight`}>Download on the</span>
          <span className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-semibold text-white leading-tight`}>App Store</span>
        </div>
      </Link>

      {/* Google Play Badge */}
      <Link
        href={APP_STORE_LINKS.android}
        target="_blank"
        rel="noopener noreferrer"
        className={badgeClass}
        aria-label="Get it on Google Play"
        onClick={() => track('App Store Click', { store: 'android' })}
      >
        {/* Google Play Logo */}
        <svg className={`${isCompact ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-7 sm:h-7'} flex-shrink-0`} viewBox="0 0 24 24" fill="none">
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" fill="#00D2FF"/>
          <path d="M17.556 8.235L5.456.923A.997.997 0 0 0 4.51.91l9.283 9.283 3.763-1.958z" fill="#00F076"/>
          <path d="M17.556 15.765l-3.763-1.958L4.51 23.09c.303.14.647.14.946-.013l12.1-7.312z" fill="#FF3A44"/>
          <path d="M21.393 10.996L17.556 8.92l-3.763 3.079 3.763 3.08 3.837-2.078a1.001 1.001 0 0 0 0-2.005z" fill="#FFC107"/>
        </svg>
        <div className="flex flex-col min-w-0">
          <span className={`${isCompact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'} text-gray-400 leading-tight uppercase tracking-wide`}>Get it on</span>
          <span className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-semibold text-white leading-tight`}>Google Play</span>
        </div>
      </Link>
    </div>
  );
}