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
                <p className="font-black text-sm sm:text-base md:text-lg">📱 {APP_DOWNLOAD_CTA.compact.title}</p>
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
              <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2">
                📱 {APP_DOWNLOAD_CTA.dashboard.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                {APP_DOWNLOAD_CTA.dashboard.subtitle}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 sm:mb-4">
                {APP_FEATURES.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center sm:items-start gap-2">
                    <span className="text-base sm:text-lg">{feature.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">{feature.title}</span>
                  </div>
                ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
            {APP_DOWNLOAD_CTA.banner.features.map((feature, index) => (
              <Card key={index} className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-3 sm:p-4 text-center">
                  <p className="font-bold text-xs sm:text-sm">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* App Store Badges */}
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <AppStoreBadges showQR={true} className="justify-center" />

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
          <span className="text-2xl">📱</span>
        </Button>
      )}
    </div>
  );
}