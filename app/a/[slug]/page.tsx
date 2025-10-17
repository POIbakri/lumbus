'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Nav } from '@/components/nav';

export default function AffiliateReferencePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'tracking' | 'redirecting' | 'error'>('tracking');

  useEffect(() => {
    const trackAndRedirect = async () => {
      try {
        const slug = params.slug as string;

        // Extract UTM parameters
        const utmParams = {
          affiliate_slug: slug,
          utm_source: searchParams.get('utm_source') || undefined,
          utm_medium: searchParams.get('utm_medium') || undefined,
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
          body: JSON.stringify(utmParams),
        });

        if (!response.ok) {
          throw new Error('Failed to track click');
        }

        const data = await response.json();
        console.log('Affiliate click tracked:', data.click_id);

        // Set status to redirecting
        setStatus('redirecting');

        // Redirect to plans page after a short delay
        setTimeout(() => {
          router.push('/plans');
        }, 1000);
      } catch (error) {
        console.error('Error tracking affiliate click:', error);
        setStatus('error');
        // Redirect anyway after error
        setTimeout(() => {
          router.push('/plans');
        }, 2000);
      }
    };

    trackAndRedirect();
  }, [params.slug, searchParams, router]);

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 bg-mint overflow-hidden">
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
                    <div className="text-3xl sm:text-4xl ">✨</div>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">WELCOME!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70">
                  Tracking your affiliate link...
                </p>
              </div>
            )}

            {status === 'redirecting' && (
              <div className="">
                <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 ">🎉</div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">ALL SET!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70">
                  Redirecting you to our plans...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="">
                <div className="text-5xl sm:text-6xl mb-6 sm:mb-8">⚠️</div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">OOPS!</h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold opacity-70 mb-4">
                  Something went wrong tracking your link
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
