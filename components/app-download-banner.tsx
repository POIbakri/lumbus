'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AppStoreBadges } from './app-store-badges';
import { APP_DOWNLOAD_CTA, APP_FEATURES } from '@/lib/app-store-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AppDownloadBannerProps {
  variant?: 'full' | 'compact' | 'dashboard' | 'sticky';
  dismissible?: boolean;
  className?: string;
}

export function AppDownloadBanner({
  variant = 'full',
  dismissible = false,
  className = ''
}: AppDownloadBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Sticky banner for top/bottom of pages
  if (variant === 'sticky') {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-cyan to-yellow p-[2px] ${className}`}>
        <div className="bg-white">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-center sm:text-left">
                <p className="font-black text-sm sm:text-base md:text-lg flex items-center gap-1"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> {APP_DOWNLOAD_CTA.compact.title}</p>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{APP_DOWNLOAD_CTA.compact.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <AppStoreBadges variant="compact" />
                {dismissible && (
                  <Button
                    onClick={() => setIsVisible(false)}
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-1 sm:p-2"
                    aria-label="Dismiss banner"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard variant
  if (variant === 'dashboard') {
    return (
      <Card className={`bg-gradient-to-br from-primary/5 via-cyan/5 to-yellow/5 border-2 border-primary/20 ${className}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> {APP_DOWNLOAD_CTA.dashboard.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                {APP_DOWNLOAD_CTA.dashboard.subtitle}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  <span className="text-xs sm:text-sm font-medium">Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                  <span className="text-xs sm:text-sm font-medium">Easy Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  <span className="text-xs sm:text-sm font-medium">Smart Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                  <span className="text-xs sm:text-sm font-medium">Exclusive Deals</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <AppStoreBadges />
              {dismissible && (
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-cyan/10 rounded-xl p-3 sm:p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-black text-base sm:text-lg md:text-xl mb-1">{APP_DOWNLOAD_CTA.secondary}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{APP_DOWNLOAD_CTA.compact.subtitle}</p>
          </div>
          <AppStoreBadges variant="compact" />
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-cyan/5 to-yellow/5"></div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-3 sm:mb-4">
              {APP_DOWNLOAD_CTA.banner.title}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              {APP_DOWNLOAD_CTA.banner.subtitle}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 sm:p-4 text-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                <p className="font-bold text-xs sm:text-sm">Instant eSIM activation</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 sm:p-4 text-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                <p className="font-bold text-xs sm:text-sm">Real-time data tracking</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 sm:p-4 text-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                <p className="font-bold text-xs sm:text-sm">Exclusive app-only deals</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 sm:p-4 text-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                <p className="font-bold text-xs sm:text-sm">Smart notifications</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors col-span-2 sm:col-span-1">
              <CardContent className="p-3 sm:p-4 text-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                <p className="font-bold text-xs sm:text-sm">Works in 150+ countries</p>
              </CardContent>
            </Card>
          </div>

          {/* App Store Badges */}
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <AppStoreBadges className="justify-center" />

            {/* Call to action text */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Available for iOS 13+ and Android 8.0+
              </p>
            </div>
          </div>

          {dismissible && (
            <div className="text-center mt-4">
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                Hide this message
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized floating button
export function AppDownloadFloatingButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:hidden">
      {isExpanded ? (
        <Card className="w-72 shadow-2xl border-2 border-primary">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-sm">{APP_DOWNLOAD_CTA.secondary}</h3>
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
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Download app"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
        </Button>
      )}
    </div>
  );
}