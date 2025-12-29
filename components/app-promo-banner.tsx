'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { AppStoreBadges } from './app-store-badges';
import { APP_DOWNLOAD_CTA } from '@/lib/app-store-config';
import { Button } from '@/components/ui/button';

export function AppPromoBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    // Don't run on admin pages
    if (isAdminPage) return;
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('app-promo-dismissed');
    const dismissedTime = localStorage.getItem('app-promo-dismissed-time');

    // Show banner again after 7 days if previously dismissed
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show banner after user has scrolled 30% of the page
    const handleScroll = () => {
      if (hasInteracted) return;

      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercentage > 30 && !isVisible) {
        setIsVisible(true);
        setHasInteracted(true);
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    // Also show after 10 seconds if user hasn't scrolled
    const timer = setTimeout(() => {
      if (!hasInteracted && !isVisible) {
        setIsVisible(true);
        setHasInteracted(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [isVisible, hasInteracted, isAdminPage]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('app-promo-dismissed', 'true');
    localStorage.setItem('app-promo-dismissed-time', Date.now().toString());
  };

  if (!isVisible || isAdminPage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-in-out md:hidden"
         style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}>
      <div className="bg-gradient-to-r from-primary via-cyan to-yellow p-[1px] sm:p-[2px]">
        <div className="bg-white">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 md:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 text-center sm:text-left">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary animate-bounce hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                <div>
                  <p className="font-black text-sm sm:text-base md:text-lg uppercase">
                    {APP_DOWNLOAD_CTA.primary}
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 hidden sm:block">
                    Track data usage • Instant top-ups • Exclusive app deals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <AppStoreBadges variant="compact" />
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:bg-gray-100 p-1 sm:p-2"
                  aria-label="Dismiss banner"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
