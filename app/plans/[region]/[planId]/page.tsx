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

// Format data amounts to clean values
function formatDataAmount(dataGB: number): string {
  if (dataGB >= 1) {
    return `${dataGB} GB`;
  }

  const dataMB = dataGB * 1024;

  // Round to nearest sensible value
  if (dataMB <= 110) return '100 MB';
  if (dataMB <= 250) return '200 MB';
  if (dataMB <= 550) return '500 MB';

  // For other values, round to nearest 50MB
  return `${Math.round(dataMB / 50) * 50} MB`;
}

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
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full  mx-auto mb-4"></div>
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
  const displayData = formatDataAmount(plan.data_gb);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      <div className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 bg-mint overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-primary rounded-full blur-3xl opacity-10 "></div>
        <div className="absolute bottom-20 left-10 sm:left-20 w-48 sm:w-64 h-48 sm:h-64 bg-cyan rounded-full blur-3xl opacity-10 " style={{animationDelay: '1s'}}></div>

        <div className="container mx-auto relative z-10 max-w-4xl">
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 font-black uppercase text-xs sm:text-sm hover:text-primary mb-4 sm:mb-6 md:mb-8 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-lg     "
          >
            ← BACK TO PLANS
          </Link>

          <div className="max-w-3xl mx-auto " style={{animationDelay: '0.1s'}}>
            <Card className="group bg-white border-2 sm:border-3 md:border-4 border-primary shadow-2xl  relative overflow-hidden">
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100   pointer-events-none"></div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 bg-primary/10 rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-cyan/10 rounded-tr-full"></div>

              <CardHeader className="pb-3 sm:pb-4 md:pb-6 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
                  {/* Flag and badge row */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-3xl sm:text-4xl md:text-5xl">{countryInfo.flag}</span>
                    <Badge className="bg-foreground text-white font-black uppercase text-xs sm:text-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full shadow-xl">
                      {plan.region_code}
                    </Badge>
                  </div>

                  {/* Country name and price row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="text-xs sm:text-sm md:text-base font-bold text-foreground/70">
                      {countryInfo.name}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-none">
                        {currencySymbol}{displayPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase leading-tight">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 relative z-10 px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                  <div className="group/stat p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-yellow rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-foreground/5  shadow-lg">
                    <div className="text-xs sm:text-sm font-black uppercase text-muted-foreground mb-1 sm:mb-2">Data</div>
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-foreground">{displayData}</div>
                  </div>
                  <div className="group/stat p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-cyan rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-foreground/5  shadow-lg">
                    <div className="text-xs sm:text-sm font-black uppercase text-muted-foreground mb-1 sm:mb-2">Valid for</div>
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-foreground">{plan.validity_days} days</div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <h3 className="font-black uppercase text-sm sm:text-base md:text-lg lg:text-xl">WHAT'S INCLUDED:</h3>
                  <ul className="space-y-1.5 sm:space-y-2 md:space-y-3">
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-lg sm:text-xl md:text-2xl shrink-0">✓</span>
                      <span className="font-bold text-xs sm:text-sm md:text-base">{displayData} high-speed data</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-lg sm:text-xl md:text-2xl shrink-0">✓</span>
                      <span className="font-bold text-xs sm:text-sm md:text-base">Valid for {plan.validity_days} days</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-lg sm:text-xl md:text-2xl shrink-0">✓</span>
                      <span className="font-bold text-xs sm:text-sm md:text-base">Instant activation</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <span className="text-lg sm:text-xl md:text-2xl shrink-0">✓</span>
                      <span className="font-bold text-xs sm:text-sm md:text-base">No contracts or commitments</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t-2 border-primary pt-4 sm:pt-5 md:pt-6">
                  <h3 className="font-black uppercase text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4">COMPLETE YOUR PURCHASE</h3>
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
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-foreground/20 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary font-bold "
                        disabled={loading}
                      />
                      <div className="mt-2 p-2 sm:p-3 bg-mint rounded-lg border border-primary/20">
                        <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-1">
                          📧 After payment, you'll receive:
                        </p>
                        <ul className="text-xs sm:text-sm font-bold text-foreground/70 space-y-0.5">
                          <li>✓ Your eSIM activation details</li>
                          <li>✓ Account setup link (set your password)</li>
                        </ul>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 sm:p-4 bg-destructive/20 text-destructive rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      onClick={handleCheckout}
                      disabled={loading || !email}
                      className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 text-sm sm:text-base md:text-lg py-5 sm:py-6 md:py-7 font-black shadow-xl  "
                    >
                      {loading ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                    </Button>

                    <p className="text-xs sm:text-sm text-center font-bold uppercase text-muted-foreground">
                      🔒 Secure payment via Stripe
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
