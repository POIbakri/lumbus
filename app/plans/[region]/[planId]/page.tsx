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
import { ProductSchema, BreadcrumbSchema } from '@/components/structured-data';
import { PaymentLogosCompact } from '@/components/payment-logos';
import Link from 'next/link';
import { useRegion } from '@/contexts/regions-context';

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
  const [discountCode, setDiscountCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showCodes, setShowCodes] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralSuccess, setReferralSuccess] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  // Use the RegionsProvider cache for region info
  const { regionInfo } = useRegion(plan?.region_code || '');

  const loadPlan = useCallback(async () => {
    try {
      setPlanLoading(true);

      // Try to load from cache first
      const cacheKey = `lumbus_plan_${params.planId}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const cacheExpiry = 10 * 60 * 1000; // 10 minutes

      if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < cacheExpiry) {
          // Use cached data
          const cachedPlan = JSON.parse(cachedData);
          setPlan(cachedPlan);

          // Convert currency
          const currencyResponse = await fetch('/api/currency/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prices: [cachedPlan.retail_price] }),
          });

          if (currencyResponse.ok) {
            const currencyData = await currencyResponse.json();
            setCurrencySymbol(currencyData.symbol);
            if (currencyData.prices[0]) {
              setConvertedPrice(currencyData.prices[0].converted);
            }
          }

          setPlanLoading(false);
          return;
        }
      }

      // Fetch fresh plan from API
      const response = await fetch(`/api/plans/${params.planId}`);
      if (!response.ok) {
        setPlan(null);
        return;
      }

      const data = await response.json();
      setPlan(data.plan);

      // Cache the plan data
      localStorage.setItem(cacheKey, JSON.stringify(data.plan));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

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
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }, [params.planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Get or create a temporary user ID for validation
  useEffect(() => {
    // Try to get existing user from session, or create a temp ID
    const tempUserId = localStorage.getItem('temp_user_id') || crypto.randomUUID();
    localStorage.setItem('temp_user_id', tempUserId);
    setUserId(tempUserId);
  }, []);

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setCodeError('Please enter a discount code');
      return;
    }

    if (!userId) {
      setCodeError('Please wait...');
      return;
    }

    setValidatingCode(true);
    setCodeError('');
    setCodeSuccess('');
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setDiscountPercent(data.discountPercent);
        setCodeError('');
        setCodeSuccess(`${data.discountPercent}% discount applied! You save ${currencySymbol}${((basePrice * data.discountPercent) / 100).toFixed(2)}`);
        // Clear referral code if discount code is valid (discount overrides referral)
        if (referralCode) {
          setReferralCode('');
          setReferralError('');
          setReferralSuccess('');
          setReferralValid(false);
        }
      } else {
        setDiscountPercent(0);
        setCodeSuccess('');
        setCodeError(data.error || 'Invalid discount code');
      }
    } catch (error) {
      setDiscountPercent(0);
      setCodeSuccess('');
      setCodeError('Failed to validate code. Please try again.');
    } finally {
      setValidatingCode(false);
    }
  };

  const validateReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralError('Please enter a referral code');
      return;
    }

    if (referralCode.trim().length !== 8) {
      setReferralError('Referral codes must be exactly 8 characters');
      return;
    }

    setReferralValidating(true);
    setReferralError('');
    setReferralSuccess('');
    try {
      const response = await fetch('/api/referral-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: referralCode.trim(),
          userId: userId || undefined,
          email: email || undefined,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setReferralValid(true);
        setReferralError('');
        setReferralSuccess(data.benefits.message);
        // Apply 10% referral discount
        setDiscountPercent(10);
        // Clear discount code if referral is valid (user must choose one)
        if (discountCode) {
          setDiscountCode('');
          setCodeError('');
          setCodeSuccess('');
        }
      } else {
        setReferralValid(false);
        setReferralSuccess('');
        setReferralError(data.error || 'Invalid referral code');
      }
    } catch (error) {
      setReferralValid(false);
      setReferralSuccess('');
      setReferralError('Failed to validate code. Please try again.');
    } finally {
      setReferralValidating(false);
    }
  };

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
          discountCode: discountCode.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Check if this is a free order (100% discount)
      if (data.isFree) {
        // For free orders, redirect directly to success page
        triggerHaptic('heavy');
        window.location.href = data.url;
      } else {
        // For paid orders, redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
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
  const basePrice = convertedPrice !== null ? convertedPrice : plan.retail_price;

  // Calculate discounted price
  const discount = discountPercent > 0 ? (basePrice * discountPercent) / 100 : 0;
  const displayPrice = basePrice - discount;
  const displayData = formatDataAmount(plan.data_gb);

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      {plan && (
        <>
          <ProductSchema plan={plan} />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: 'https://getlumbus.com' },
              { name: 'eSIM Plans', url: 'https://getlumbus.com/plans' },
              { name: `${regionInfo?.isMultiCountry ? 'Multi-Country' : getCountryInfo(plan.region_code).name} eSIM`, url: `https://getlumbus.com/plans/${plan.region_code}/${plan.id}` },
            ]}
          />
        </>
      )}

      {/* Navigation */}
      <Nav />

      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 bg-mint overflow-hidden">
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
                      {discountPercent > 0 && (
                        <div className="text-sm sm:text-base md:text-lg font-black text-muted-foreground line-through">
                          {currencySymbol}{basePrice.toFixed(2)}
                        </div>
                      )}
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-none">
                        {currencySymbol}{displayPrice.toFixed(2)}
                      </div>
                      {discountPercent > 0 && (
                        <div className="inline-block mt-1 sm:mt-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-white text-xs sm:text-sm font-black rounded shadow-lg animate-pulse-slow">
                          {discountPercent}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase leading-tight">{plan.name.replace(/^[\"']|[\"']$/g, '')}</CardTitle>

                {/* Coverage Information for Regional Plans */}
                {regionInfo && regionInfo.isMultiCountry && regionInfo.subLocationList && regionInfo.subLocationList.length > 0 && (
                  <div className="mt-4 border-2 border-dashed border-primary/30 rounded-lg sm:rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowCountries(!showCountries)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-mint hover:bg-mint/70 transition-colors font-black uppercase text-xs sm:text-sm flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">🌍</span>
                        <span>Show all countries ({regionInfo.subLocationList.length})</span>
                      </span>
                      <span className="text-base sm:text-lg">{showCountries ? '−' : '+'}</span>
                    </button>

                    {showCountries && (
                      <div className="p-3 sm:p-4 bg-white max-h-64 sm:max-h-80 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {regionInfo.subLocationList.map((country) => (
                            <div
                              key={country.code}
                              className="flex items-center gap-2 p-2 rounded-lg bg-mint/20 border border-mint"
                            >
                              <span className="text-base sm:text-lg">{getCountryInfo(country.code).flag || '🏳️'}</span>
                              <span className="font-bold text-xs sm:text-sm">{country.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

                {/* Referral CTA Banner - ABOVE checkout form */}
                <div className="bg-gradient-to-r from-yellow via-cyan to-yellow border-4 border-foreground rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl mb-6 sm:mb-8 animate-pulse-slow">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-2">💰</div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase mb-2 text-foreground leading-tight">
                      GOT REFERRED? ENTER CODE FOR 10% OFF + 1GB FREE!
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-foreground/80 mb-3">
                      Both you and your friend get 1GB FREE data!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-foreground/70">
                      <span>🎁</span>
                      <span>10% OFF + 1GB FREE</span>
                      <span>•</span>
                      <span>FIRST-TIME BUYERS</span>
                      <span>🚀</span>
                    </div>
                  </div>
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

                    {/* Discount & Referral Codes Section */}
                    <div className="border-2 border-dashed border-primary/30 rounded-lg sm:rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowCodes(!showCodes)}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-yellow/20 hover:bg-yellow/30  font-black uppercase text-xs sm:text-sm flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base sm:text-lg">🎟️</span>
                          <span>Have a discount or referral code?</span>
                        </span>
                        <span className="text-base sm:text-lg">{showCodes ? '−' : '+'}</span>
                      </button>

                      {showCodes && (
                        <div className="p-3 sm:p-4 space-y-3 bg-white">
                          <div>
                            <label htmlFor="discountCode" className="block font-bold uppercase text-xs mb-2">
                              Discount Code
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="discountCode"
                                type="text"
                                value={discountCode}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  setDiscountCode(value);
                                  setCodeError('');
                                  setCodeSuccess('');
                                  if (!value.trim()) {
                                    setDiscountPercent(0);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    validateDiscountCode();
                                  }
                                }}
                                placeholder="SUMMER20"
                                className="flex-1 px-3 py-2.5 text-sm border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold uppercase"
                                disabled={loading || validatingCode}
                              />
                              <Button
                                type="button"
                                onClick={validateDiscountCode}
                                disabled={loading || validatingCode || !discountCode.trim()}
                                className="px-4 py-2.5 bg-primary text-white font-black uppercase text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {validatingCode ? '...' : 'APPLY'}
                              </Button>
                            </div>
                            {validatingCode && (
                              <p className="mt-2 text-xs sm:text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                                Validating...
                              </p>
                            )}
                            {codeError && (
                              <p className="mt-2 text-xs sm:text-sm font-bold text-destructive flex items-center gap-1.5">
                                <span className="text-sm sm:text-base">✗</span>
                                {codeError}
                              </p>
                            )}
                            {codeSuccess && (
                              <div className="mt-2 p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/30">
                                <p className="text-xs sm:text-sm font-black text-primary flex items-center gap-1.5">
                                  <span className="text-sm sm:text-base">✓</span>
                                  <span>{codeSuccess}</span>
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label htmlFor="referralCode" className="block font-bold uppercase text-xs mb-2">
                              Referral Code (First-time buyers only)
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="referralCode"
                                type="text"
                                value={referralCode}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                                  setReferralCode(value);
                                  setReferralError('');
                                  setReferralSuccess('');
                                  if (!value.trim()) {
                                    setReferralValid(false);
                                    // Clear discount if referral code is cleared
                                    if (discountPercent === 10 && !discountCode) {
                                      setDiscountPercent(0);
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    validateReferralCode();
                                  }
                                }}
                                placeholder="ABC12345"
                                maxLength={8}
                                className="flex-1 px-3 py-2.5 text-sm border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold uppercase"
                                disabled={loading || referralValidating || discountPercent > 0}
                              />
                              <Button
                                type="button"
                                onClick={validateReferralCode}
                                disabled={loading || referralValidating || !referralCode.trim() || referralCode.length !== 8 || discountPercent > 0}
                                className="px-4 py-2.5 bg-primary text-white font-black uppercase text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {referralValidating ? '...' : 'VERIFY'}
                              </Button>
                            </div>
                            {discountPercent > 0 && (
                              <p className="mt-2 text-xs font-bold text-muted-foreground">
                                ⚠️ Discount code is active. Remove it to use a referral code instead.
                              </p>
                            )}
                            {referralValidating && (
                              <p className="mt-2 text-xs sm:text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                                Verifying referral code...
                              </p>
                            )}
                            {referralError && (
                              <p className="mt-2 text-xs sm:text-sm font-bold text-destructive flex items-start gap-1.5">
                                <span className="text-sm sm:text-base">✗</span>
                                <span>{referralError}</span>
                              </p>
                            )}
                            {referralSuccess && (
                              <div className="mt-2 p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/30">
                                <p className="text-xs sm:text-sm font-black text-primary flex items-start gap-1.5">
                                  <span className="text-sm sm:text-base">✓</span>
                                  <span>{referralSuccess}</span>
                                </p>
                              </div>
                            )}
                            {!referralSuccess && !referralError && !discountPercent && (
                              <p className="mt-1 text-xs font-bold text-muted-foreground">
                                Get 10% OFF + 1GB FREE data! Your friend gets 1GB FREE too!
                              </p>
                            )}
                          </div>

                          <div className="p-2 sm:p-3 bg-cyan/10 rounded-lg border border-cyan/20">
                            <p className="text-xs font-bold text-foreground/80">
                              💡 <strong>Note:</strong> Discount codes apply instantly. Referral codes give 10% OFF + 1GB FREE data (first-time buyers only). You can only use one type of code per order.
                            </p>
                          </div>
                        </div>
                      )}
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

                    {/* Payment Trust Badges */}
                    <div className="py-4">
                      <PaymentLogosCompact />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        By proceeding, you agree to our{' '}
                        <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">
                          Terms & Conditions
                        </Link>
                        ,{' '}
                        <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">
                          Privacy Policy
                        </Link>
                        {' '}and{' '}
                        <Link href="/refund-policy" target="_blank" className="text-primary hover:underline font-bold">
                          Refund Policy
                        </Link>
                      </p>
                    </div>
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
