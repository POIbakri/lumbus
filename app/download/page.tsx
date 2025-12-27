'use client';

import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import { APP_STORE_LINKS } from '@/lib/app-store-config';

export default function DownloadPage() {
  const [redirectUrl, setRedirectUrl] = useState<string>('https://getlumbus.com');
  const [platform, setPlatform] = useState<string>('unknown');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || '';

    const isIOS = /iPad|iPhone|iPod/i.test(userAgent) ||
      (userAgent.includes('Mac') && 'ontouchend' in window);
    const isAndroid = /android/i.test(userAgent);

    let url: string;
    let detectedPlatform: string;

    if (isIOS) {
      url = APP_STORE_LINKS.ios;
      detectedPlatform = 'ios';
    } else if (isAndroid) {
      url = APP_STORE_LINKS.android;
      detectedPlatform = 'android';
    } else {
      url = 'https://getlumbus.com';
      detectedPlatform = 'desktop';
    }

    setRedirectUrl(url);
    setPlatform(detectedPlatform);

    // Track the download click - sendBeacon ensures it fires even during navigation
    track('App Download', { platform: detectedPlatform });

    // Small delay to ensure tracking initiates before redirect
    // 150ms is imperceptible to users but gives analytics time to fire
    const timer = setTimeout(() => {
      window.location.href = url;
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Fallback for JS disabled - meta refresh */}
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${APP_STORE_LINKS.ios}`} />
      </noscript>

      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="inline-block rounded-full h-12 w-12 border-b-2 border-primary mb-4 animate-spin"></div>
          <p className="font-bold text-lg">Redirecting to {platform === 'ios' ? 'App Store' : platform === 'android' ? 'Play Store' : 'Lumbus'}...</p>
          <p className="text-sm text-muted-foreground mt-2">
            <a href={redirectUrl} className="underline">Click here if not redirected</a>
          </p>
        </div>
      </div>
    </>
  );
}
