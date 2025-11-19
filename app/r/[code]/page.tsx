'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Nav } from '@/components/nav';

export default function ReferralPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'tracking' | 'redirecting' | 'error'>('tracking');
  const discountAmount = 10; // 10% discount

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

        const data = await response.json();

        // Set status to redirecting
        setStatus('redirecting');

        // Redirect to plans page after a short delay
        setTimeout(() => {
          router.push('/plans');
        }, 2000);
      } catch (error) {
        setStatus('error');
        // Redirect anyway after error
        setTimeout(() => {
          router.push('/plans');
        }, 2000);
      }
    };

    trackAndRedirect();
  }, [params.code, searchParams, router]);

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-20 sm:pb-32 px-4 bg-mint overflow-hidden">
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
                    <div className="text-3xl sm:text-4xl ">🎁</div>
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
                <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 ">🎉</div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">DISCOUNT APPLIED!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70 mb-6 sm:mb-8">
                  Get {discountAmount}% off your first eSIM purchase
                </p>
                <div className="max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border-2 sm:border-4 border-primary shadow-2xl">
                  <p className="text-base sm:text-lg font-bold mb-4">
                    Plus, when you complete your first purchase:
                  </p>
                  <div className="space-y-2 sm:space-y-3 text-left">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-xl sm:text-2xl">✅</div>
                      <p className="font-bold text-sm sm:text-base">Your friend gets <span className="text-primary">1GB FREE data</span></p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-xl sm:text-2xl">✅</div>
                      <p className="font-bold text-sm sm:text-base">You get your own referral code</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-xl sm:text-2xl">✅</div>
                      <p className="font-bold text-sm sm:text-base">Start earning free data too!</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base md:text-lg font-bold opacity-60 mt-6 sm:mt-8">
                  Redirecting to plans...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="">
                <div className="text-5xl sm:text-6xl mb-6 sm:mb-8">⚠️</div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">OOPS!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70 mb-4">
                  Something went wrong processing your referral
                </p>
                <p className="text-sm sm:text-base md:text-lg font-bold opacity-60">
                  Don't worry, redirecting you anyway...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
