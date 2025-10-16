'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Nav } from '@/components/nav';
import { Plan } from '@/lib/db';
import { triggerHaptic } from '@/lib/device-detection';
import { getCountryInfo } from '@/lib/countries';
import Link from 'next/link';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    try {
      setPlanLoading(true);

      // Fetch plan from API
      const response = await fetch(`/api/plans/${params.planId}`);
      if (!response.ok) {
        setPlan(null);
        return;
      }

      const data = await response.json();
      setPlan(data.plan);

      // Convert currency
      const currencyResponse = await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: [data.plan.retail_price] }),
      });

      if (currencyResponse.ok) {
        const currencyData = await currencyResponse.json();
        setCurrencySymbol(currencyData.symbol);
        if (currencyData.prices[0]) {
          setConvertedPrice(currencyData.prices[0].converted);
        }
      }
    } catch (error) {
      console.error('Failed to load plan:', error);
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }, [params.planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleCheckout = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!plan) return;

    setLoading(true);
    setError('');
    triggerHaptic('medium');

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black uppercase">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Plan not found</p>
          <Link href="/plans">
            <Button>Back to Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  const countryInfo = getCountryInfo(plan.region_code);
  const displayPrice = convertedPrice !== null ? convertedPrice : plan.retail_price;
  const displayData = plan.data_gb < 1
    ? `${Math.round(plan.data_gb * 1024)} MB`
    : `${plan.data_gb} GB`;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      <div className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 bg-mint overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-primary rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-10 sm:left-20 w-48 sm:w-64 h-48 sm:h-64 bg-cyan rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{animationDelay: '1s'}}></div>

        <div className="container mx-auto relative z-10">
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 font-black uppercase text-xs sm:text-sm hover:text-primary mb-6 sm:mb-8 md:mb-12 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-up"
          >
            ← BACK TO PLANS
          </Link>

          <div className="max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
            <Card className="group bg-white border-2 sm:border-4 border-primary shadow-2xl hover-lift relative overflow-hidden">
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-primary/10 rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-cyan/10 rounded-tr-full"></div>

              <CardHeader className="pb-4 sm:pb-6 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-4xl sm:text-5xl">{countryInfo.flag}</span>
                      <Badge className="bg-foreground text-white font-black uppercase text-xs sm:text-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full shadow-xl">
                        {plan.region_code}
                      </Badge>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-foreground/70">
                      {countryInfo.name}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">
                      {currencySymbol}{displayPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase leading-tight">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 md:space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div className="group/stat p-3 sm:p-4 md:p-6 lg:p-8 bg-yellow rounded-xl sm:rounded-2xl border-2 sm:border-4 border-foreground/5 hover-lift shadow-lg">
                    <div className="text-xs font-black uppercase text-muted-foreground mb-1 sm:mb-2">Data</div>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground">{displayData}</div>
                  </div>
                  <div className="group/stat p-3 sm:p-4 md:p-6 lg:p-8 bg-cyan rounded-xl sm:rounded-2xl border-2 sm:border-4 border-foreground/5 hover-lift shadow-lg">
                    <div className="text-xs font-black uppercase text-muted-foreground mb-1 sm:mb-2">Valid for</div>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground">{plan.validity_days} days</div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-black uppercase text-base sm:text-lg md:text-xl">WHAT'S INCLUDED:</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl">✓</span>
                      <span className="font-bold text-sm sm:text-base">{displayData} high-speed data</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl">✓</span>
                      <span className="font-bold text-sm sm:text-base">Valid for {plan.validity_days} days</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl">✓</span>
                      <span className="font-bold text-sm sm:text-base">Instant activation</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl">✓</span>
                      <span className="font-bold text-sm sm:text-base">No contracts or commitments</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t-2 border-primary pt-4 sm:pt-6">
                  <h3 className="font-black uppercase text-base sm:text-lg md:text-xl mb-3 sm:mb-4">COMPLETE YOUR PURCHASE</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label htmlFor="email" className="block font-bold uppercase text-xs sm:text-sm mb-2">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold"
                        disabled={loading}
                      />
                      <p className="text-xs font-bold uppercase text-muted-foreground mt-2">
                        We'll send your eSIM here
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 sm:p-4 bg-destructive/20 text-destructive rounded-lg font-bold text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      onClick={handleCheckout}
                      disabled={loading || !email}
                      className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 text-base sm:text-lg py-5 sm:py-6 md:py-7 font-black"
                    >
                      {loading ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                    </Button>

                    <p className="text-xs text-center font-bold uppercase text-muted-foreground">
                      Secure payment via Stripe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
