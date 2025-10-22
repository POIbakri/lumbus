'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Cookie preferences
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('lumbus_cookie_consent');
    if (!consent) {
      // Small delay to avoid flash on page load
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('lumbus_cookie_consent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const acceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('lumbus_cookie_consent', JSON.stringify(consent));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const rejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('lumbus_cookie_consent', JSON.stringify(consent));
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-6 bg-white/95 backdrop-blur-sm border-t-4 border-foreground shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
      <div className="container mx-auto max-w-6xl">
        {!showPreferences ? (
          // Main banner
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" aria-hidden="true">🍪</span>
                <h3 className="font-black text-base sm:text-lg uppercase">We Value Your Privacy</h3>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground/70 leading-relaxed">
                We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic.
                By clicking "Accept All", you consent to our use of cookies. Learn more in our{' '}
                <Link href="/privacy" className="text-primary hover:underline font-black">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
              <Button
                onClick={() => setShowPreferences(true)}
                variant="outline"
                className="w-full sm:w-auto font-black uppercase text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3.5 border-2 border-foreground hover:bg-foreground/5 rounded-lg whitespace-nowrap"
              >
                Preferences
              </Button>
              <Button
                onClick={rejectAll}
                className="w-full sm:w-auto bg-yellow text-foreground hover:bg-yellow/90 font-black uppercase text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg shadow-lg border-2 border-foreground/20 whitespace-nowrap"
              >
                Reject All
              </Button>
              <Button
                onClick={acceptAll}
                className="w-full sm:w-auto bg-primary text-foreground hover:bg-primary/90 font-black uppercase text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg shadow-lg whitespace-nowrap"
              >
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          // Preferences panel
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base sm:text-lg uppercase">Cookie Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-foreground/60 hover:text-foreground font-black text-xl"
                aria-label="Close preferences"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {/* Necessary Cookies */}
              <div className="p-3 sm:p-4 bg-mint/30 rounded-lg border-2 border-mint">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm uppercase">Necessary Cookies</span>
                    <span className="text-xs bg-foreground text-white px-2 py-0.5 rounded-full font-black">
                      Always Active
                    </span>
                  </div>
                </div>
                <p className="text-xs font-bold text-foreground/70">
                  These cookies are essential for the website to function properly. They enable core features like security, authentication, and basic functionality.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="p-3 sm:p-4 bg-white rounded-lg border-2 border-foreground/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm uppercase">Analytics Cookies</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs font-bold text-foreground/70">
                  Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="p-3 sm:p-4 bg-white rounded-lg border-2 border-foreground/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm uppercase">Marketing Cookies</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs font-bold text-foreground/70">
                  Used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                onClick={rejectAll}
                className="w-full sm:flex-1 bg-yellow text-foreground hover:bg-yellow/90 font-black uppercase text-xs sm:text-sm px-4 py-3 rounded-lg shadow-lg border-2 border-foreground/20"
              >
                Reject All
              </Button>
              <Button
                onClick={acceptSelected}
                className="w-full sm:flex-1 bg-primary text-foreground hover:bg-primary/90 font-black uppercase text-xs sm:text-sm px-6 py-3 rounded-lg shadow-lg"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
