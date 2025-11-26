'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AppStoreBadges } from './app-store-badges';
import { APP_DOWNLOAD_CTA } from '@/lib/app-store-config';
import { Button } from '@/components/ui/button';

export function AppPromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
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
  }, [isVisible, hasInteracted]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('app-promo-dismissed', 'true');
    localStorage.setItem('app-promo-dismissed-time', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-in-out"
         style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}>
      <div className="bg-gradient-to-r from-primary via-cyan to-yellow p-[1px] sm:p-[2px]">
        <div className="bg-white">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 md:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 text-center sm:text-left">
                <span className="text-2xl sm:text-3xl md:text-4xl animate-bounce hidden sm:block">📱</span>
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

// Floating mobile-only app promotion button
export function AppPromoFloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if user has interacted with it before
    const lastInteraction = localStorage.getItem('app-promo-float-interaction');
    if (lastInteraction) {
      const daysSinceInteraction = (Date.now() - parseInt(lastInteraction)) / (1000 * 60 * 60 * 24);
      if (daysSinceInteraction < 3) {
        return;
      }
    }

    // Show after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleInteraction = () => {
    localStorage.setItem('app-promo-float-interaction', Date.now().toString());
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:hidden">
      {isExpanded ? (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary p-4 w-72 transform transition-all duration-300 scale-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-black text-sm uppercase">{APP_DOWNLOAD_CTA.secondary}</h3>
              <p className="text-xs text-gray-600 mt-1">Better experience on our app</p>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AppStoreBadges variant="compact" />
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">⚡ Instant activation</span>
            <span className="text-xs bg-cyan/10 px-2 py-1 rounded-full">📊 Track usage</span>
            <span className="text-xs bg-yellow/10 px-2 py-1 rounded-full">🎁 App-only deals</span>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleInteraction}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-primary to-cyan hover:scale-110 transform transition-all duration-300 animate-pulse"
          aria-label="Download our app"
        >
          <span className="text-2xl">📱</span>
        </Button>
      )}
    </div>
  );
}