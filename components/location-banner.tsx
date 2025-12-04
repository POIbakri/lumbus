'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { detectUserLocation, getFlagEmoji, LocationInfo } from '@/lib/location-detection';
import { useDeviceDetection } from '@/lib/device-detection';
import { getCountryInfo } from '@/lib/countries';

export function LocationBanner() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const deviceInfo = useDeviceDetection();

  useEffect(() => {
    async function loadLocation() {
      try {
        // Use the same currency detection API as destinations page
        const response = await fetch('/api/currency/detect');
        if (response.ok) {
          const data = await response.json();
          if (data.country) {
            // Use the same country mapping as destinations page
            const countryInfo = getCountryInfo(data.country);

            setLocation({
              country: countryInfo.name,
              countryCode: data.country,
              region: '',
              city: '',
              timezone: '',
              detected: true,
            });
          } else {
            // Fallback to Cloudflare detection
            const locationData = await detectUserLocation();
            setLocation(locationData);
          }
        } else {
          // Fallback to Cloudflare detection
          const locationData = await detectUserLocation();
          setLocation(locationData);
        }
      } catch (error) {
        console.error('Location detection error:', error);
        // Fallback to Cloudflare detection
        const locationData = await detectUserLocation();
        setLocation(locationData);
      } finally {
        setLoading(false);
      }
    }
    loadLocation();
  }, []);

  if (loading) {
    return (
      <div className="">
        <Card className="bg-mint border-2 border-primary/30">
          <CardContent className="py-6">
            <div className="h-6 bg-foreground/10 rounded w-3/4 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the country code directly, not regional mapping
  const primaryRegion = location?.countryCode || 'GLOBAL';

  return (
    <Card className="bg-mint border-4 border-primary shadow-2xl relative overflow-hidden mb-12">
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-white/20 opacity-50 group-hover:opacity-100 pointer-events-none"></div>

      {/* Floating Elements */}
      {location?.detected && (
        <div className="absolute top-2 right-2 text-4xl">
          {getFlagEmoji(location.countryCode)}
        </div>
      )}
      <div className="absolute bottom-2 left-2" style={{animationDelay: '0.5s'}}>
        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
      </div>

      <CardContent className="py-8 px-6 relative z-10">
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-black uppercase mb-3 text-foreground">
            Ready to Get Connected?
          </h3>

          <p className="text-base md:text-lg font-bold mb-6 opacity-80">
            {location?.detected && location.country ? (
              <>Need an eSIM for <span className="text-primary font-black">{location.country}</span> or another destination? </>
            ) : (
              <>Find the perfect eSIM plan for your destination. </>
            )}
            {deviceInfo.supportsEsim ? (
              <>Your device supports eSIM - get connected in seconds.</>
            ) : (
              <>Check if your device supports eSIM and get connected instantly.</>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {location?.detected && location.country && (
              <Link href={`/plans?region=${primaryRegion.toLowerCase()}`}>
                <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base px-8 py-4 shadow-xl">
                  <span className="flex items-center gap-2">
                    {getFlagEmoji(primaryRegion)} VIEW {location.country.toUpperCase()} PLANS
                  </span>
                </Button>
              </Link>
            )}
            <Link href="/destinations">
              <Button className={`btn-lumbus font-black text-base px-8 py-4 ${location?.detected ? 'bg-white text-foreground border-2 border-foreground/20 hover:bg-foreground/5' : 'bg-foreground text-white hover:bg-foreground/90 shadow-xl'}`}>
                BROWSE ALL DESTINATIONS
              </Button>
            </Link>
          </div>

          {deviceInfo.platform && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm font-bold opacity-60">
              <span>Device: {deviceInfo.platform.toUpperCase()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">{deviceInfo.supportsEsim ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> eSIM Ready</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg> Check Compatibility</>}</span>
              {deviceInfo.supportsUniversalLink && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> One-Tap Install</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
