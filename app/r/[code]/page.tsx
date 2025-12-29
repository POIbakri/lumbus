'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { APP_STORE_LINKS } from '@/lib/app-store-config';

function getDeviceType(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export default function ReferralPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'tracking' | 'redirecting' | 'error'>('tracking');
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const discountAmount = 10; // 10% discount

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  useEffect(() => {
    const trackAndRedirect = async () => {
      try {
        const code = params.code as string;

        // Extract UTM parameters (if any)
        const trackParams = {
          ref_code: code,
          utm_source: searchParams.get('utm_source') || 'referral',
          utm_medium: searchParams.get('utm_medium') || 'friend-link',
          utm_campaign: searchParams.get('utm_campaign') || undefined,
          utm_content: searchParams.get('utm_content') || undefined,
          utm_term: searchParams.get('utm_term') || undefined,
          landing_path: window.location.pathname + window.location.search,
        };

        // Track the click
        const response = await fetch('/api/track/click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackParams),
        });

        if (!response.ok) {
          throw new Error('Failed to track referral');
        }

        // Set status to redirecting
        setStatus('redirecting');

        // Redirect after a short delay
        setTimeout(() => {
          /*
           * =============================================================================
           * TODO: Re-enable deep linking once mobile app handles the ref/[code] route
           * =============================================================================
           *
           * MOBILE APP REQUIREMENTS:
           * Add a route handler in expo-router: app/ref/[code].tsx
           * Example implementation:
           *
           *   import { useLocalSearchParams, router } from 'expo-router';
           *   import { useEffect } from 'react';
           *   import AsyncStorage from '@react-native-async-storage/async-storage';
           *
           *   export default function ReferralDeepLink() {
           *     const { code } = useLocalSearchParams();
           *     useEffect(() => {
           *       AsyncStorage.setItem('referral_code', code as string);
           *       router.replace('/');
           *     }, [code]);
           *     return null;
           *   }
           *
           * =============================================================================
           * HOW TO REVERT (when mobile app is ready):
           * =============================================================================
           *
           * 1. Replace this entire setTimeout callback with:
           *
           *   const device = getDeviceType();
           *   const code = params.code as string;
           *
           *   if (device === 'ios' || device === 'android') {
           *     const deepLink = `lumbus://ref/${code}`;
           *     const storeLink = device === 'ios' ? APP_STORE_LINKS.ios : APP_STORE_LINKS.android;
           *
           *     const fallbackTimeout = setTimeout(() => {
           *       window.location.href = storeLink;
           *     }, 1500);
           *
           *     window.location.href = deepLink;
           *
           *     document.addEventListener('visibilitychange', () => {
           *       if (document.hidden) {
           *         clearTimeout(fallbackTimeout);
           *       }
           *     });
           *   } else {
           *     window.location.href = '/';
           *   }
           *
           * 2. Update the error handler catch block to also use deep linking
           *
           * 3. Update UI text (around line 161) from "Redirecting..." back to:
           *    {deviceType === 'desktop' ? 'Redirecting...' : 'Opening Lumbus app...'}
           *
           * =============================================================================
           */

          // For now, redirect all devices to web home page
          // The referral code is already tracked via /api/track/click and stored in cookie
          window.location.href = '/';
        }, 2500);
      } catch (error) {
        setStatus('error');
        // Redirect to home after error
        // TODO: When re-enabling deep links, also update this to try deep link first
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    trackAndRedirect();
  }, [params.code, searchParams]);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative pt-20 sm:pt-28 md:pt-36 pb-20 sm:pb-32 px-4 bg-mint overflow-hidden min-h-screen flex items-center">
        {/* Floating Background Elements */}
        <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-cyan/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {status === 'tracking' && (
              <div className="">
                <div className="relative inline-block mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 sm:border-8 border-primary/20 border-t-primary rounded-full "></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">YOU'VE BEEN REFERRED!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70 mb-6 sm:mb-8">
                  Your friend wants to give you a special gift...
                </p>
                <div className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-primary/10 border-2 sm:border-4 border-primary">
                  <p className="text-4xl sm:text-5xl font-black text-primary">{discountAmount}% OFF</p>
                  <p className="text-base sm:text-lg font-bold uppercase tracking-wide mt-2">Your First Order</p>
                </div>
              </div>
            )}

            {status === 'redirecting' && (
              <div className="">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">DISCOUNT READY!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70 mb-6 sm:mb-8">
                  Download the app to claim your {discountAmount}% discount
                </p>
                <div className="max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border-2 sm:border-4 border-primary shadow-2xl">
                  <p className="text-base sm:text-lg font-bold mb-4">
                    Here&apos;s what you get:
                  </p>
                  <div className="space-y-2 sm:space-y-3 text-left">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <p className="font-bold text-sm sm:text-base"><span className="text-primary">{discountAmount}% off</span> your first eSIM</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <p className="font-bold text-sm sm:text-base"><span className="text-primary">1GB FREE</span> bonus data</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <p className="font-bold text-sm sm:text-base">Browse <span className="text-primary">150+ country</span> data plans</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base md:text-lg font-bold opacity-60 mt-6 sm:mt-8">
                  Redirecting...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">OOPS!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70 mb-4">
                  Something went wrong processing your referral
                </p>
                <p className="text-sm sm:text-base md:text-lg font-bold opacity-60">
                  Don&apos;t worry, redirecting you to the app anyway...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
