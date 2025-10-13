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

      <div className="relative pt-40 pb-32 px-4 bg-mint overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {status === 'tracking' && (
              <div className="animate-fade-in">
                <div className="relative inline-block mb-8">
                  <div className="w-24 h-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl animate-pulse-slow">✨</div>
                  </div>
                </div>
                <h1 className="heading-xl mb-6">WELCOME!</h1>
                <p className="text-2xl font-bold opacity-70">
                  Tracking your affiliate link...
                </p>
              </div>
            )}

            {status === 'redirecting' && (
              <div className="animate-scale-in">
                <div className="text-6xl mb-8 animate-bounce-slow">🎉</div>
                <h1 className="heading-xl mb-6">ALL SET!</h1>
                <p className="text-2xl font-bold opacity-70">
                  Redirecting you to our plans...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="animate-fade-in">
                <div className="text-6xl mb-8">⚠️</div>
                <h1 className="heading-xl mb-6">OOPS!</h1>
                <p className="text-2xl font-bold opacity-70 mb-4">
                  Something went wrong tracking your link
                </p>
                <p className="text-lg font-bold opacity-60">
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
