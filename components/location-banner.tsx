'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { detectUserLocation, getRegionName, getRelevantRegions, getFlagEmoji, LocationInfo } from '@/lib/location-detection';
import { useDeviceDetection } from '@/lib/device-detection';

export function LocationBanner() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const deviceInfo = useDeviceDetection();

  useEffect(() => {
    async function loadLocation() {
      const locationData = await detectUserLocation();
      setLocation(locationData);
      setLoading(false);
    }
    loadLocation();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <Card className="bg-mint border-2 border-primary/30">
          <CardContent className="py-6">
            <div className="h-6 bg-foreground/10 rounded w-3/4 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!location || !location.detected) {
    return null;
  }

  const relevantRegions = getRelevantRegions(location.countryCode);
  const primaryRegion = relevantRegions[0];

  return (
    <Card className="bg-mint border-4 border-primary shadow-2xl hover-lift card-stack relative overflow-hidden animate-slide-up touch-ripple mb-12">
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-white/20 opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      {/* Floating Elements */}
      <div className="absolute top-2 right-2 text-4xl animate-bounce-subtle">
        {getFlagEmoji(location.countryCode)}
      </div>
      <div className="absolute bottom-2 left-2 text-2xl animate-bounce-subtle" style={{animationDelay: '0.5s'}}>
        📍
      </div>

      <CardContent className="py-8 px-6 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-block px-4 py-1 bg-primary rounded-full">
              <span className="font-black uppercase text-xs text-white">📍 DETECTED</span>
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-black uppercase mb-3 text-foreground">
            {deviceInfo.isMobile ? 'Perfect Timing!' : `Hello from ${location.country}!`}
          </h3>

          <p className="text-base md:text-lg font-bold mb-6 opacity-80">
            {location.detected && location.city && (
              <>We detected you're in <span className="text-primary font-black">{location.city}, {location.country}</span>. </>
            )}
            {!location.city && location.country && (
              <>We detected you're in <span className="text-primary font-black">{location.country}</span>. </>
            )}
            {deviceInfo.supportsEsim ? (
              <>Your device supports eSIM! Get connected in seconds.</>
            ) : (
              <>Check if your device supports eSIM and get connected instantly.</>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={`/plans?region=${primaryRegion.toLowerCase()}`}>
              <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base px-8 py-4 shadow-xl touch-ripple elastic-bounce pulse-glow">
                <span className="flex items-center gap-2">
                  {getFlagEmoji(primaryRegion)} VIEW {getRegionName(primaryRegion)} PLANS
                </span>
              </Button>
            </Link>
            <Link href="/plans">
              <Button className="btn-lumbus bg-white text-foreground border-2 border-foreground/20 hover:bg-foreground/5 font-black text-base px-8 py-4 touch-ripple">
                BROWSE ALL PLANS
              </Button>
            </Link>
          </div>

          {deviceInfo.platform && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm font-bold opacity-60">
              <span>Device: {deviceInfo.platform.toUpperCase()}</span>
              <span>•</span>
              <span>{deviceInfo.supportsEsim ? '✓ eSIM Ready' : '? Check Compatibility'}</span>
              {deviceInfo.supportsUniversalLink && (
                <>
                  <span>•</span>
                  <span>✓ One-Tap Install</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
