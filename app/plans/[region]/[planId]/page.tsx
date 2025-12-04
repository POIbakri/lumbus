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
import { ProductSchema, BreadcrumbSchema, FAQSchema } from '@/components/structured-data';
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

// Generate plan-specific FAQs
function generatePlanFAQs(countryName: string, dataAmount: string, validityDays: number) {
  return [
    {
      q: `How do I install my ${countryName} eSIM?`,
      a: `Installing your eSIM is simple: 1) After purchase, you'll receive your eSIM via email instantly. 2) On compatible devices, tap the installation link to add it automatically. Or scan the QR code in Settings > Cellular > Add eSIM (iPhone) or Settings > Network > SIMs (Android). 3) Enable data roaming when you arrive in ${countryName}. The whole process takes under 2 minutes!`
    },
    {
      q: `Is ${dataAmount} enough for my trip to ${countryName}?`,
      a: `${dataAmount} is perfect for ${validityDays} days of typical travel use including GPS navigation, messaging apps (WhatsApp, iMessage), social media browsing, and light web surfing. If you plan to stream videos or make frequent video calls, consider a larger data plan. You can always top up if you run low!`
    },
    {
      q: `When does my ${validityDays}-day validity period start?`,
      a: `Your ${validityDays}-day validity period starts when you first connect to a network in ${countryName}, not when you purchase or install the eSIM. This means you can buy and install your eSIM before your trip, and it will only activate when you land and connect.`
    },
    {
      q: `Can I use hotspot/tethering with this eSIM?`,
      a: `Yes! All Lumbus eSIM plans include hotspot/tethering capability. You can share your ${dataAmount} data connection with other devices like laptops or tablets. Just enable the hotspot feature in your phone settings.`
    },
    {
      q: `What happens if I run out of data?`,
      a: `If you use all your ${dataAmount} before the ${validityDays} days expire, you can easily top up through our website or the Lumbus app. Top-ups are instant and will extend your connectivity without needing a new eSIM installation.`
    },
    {
      q: `Will my phone number still work with the eSIM?`,
      a: `Yes! The Lumbus eSIM provides data only, so your original SIM card keeps working for calls and texts. Your phone will use the eSIM for internet data while your regular SIM handles calls and SMS. You can also use WiFi calling and messaging apps like WhatsApp for free calls.`
    }
  ];
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
          <FAQSchema faqs={generatePlanFAQs(countryInfo.name, displayData, plan.validity_days)} />
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
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="font-bold text-xs sm:text-sm md:text-base">{displayData} high-speed data</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="font-bold text-xs sm:text-sm md:text-base">Valid for {plan.validity_days} days</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="font-bold text-xs sm:text-sm md:text-base">Instant activation</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="font-bold text-xs sm:text-sm md:text-base">No contracts or commitments</span>
                    </li>
                  </ul>
                </div>

                {/* Referral CTA Banner - ABOVE checkout form */}
                <div className="bg-gradient-to-r from-yellow via-cyan to-yellow border-4 border-foreground rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl mb-6 sm:mb-8 animate-pulse-slow">
                  <div className="text-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase mb-2 text-foreground leading-tight">
                      GOT REFERRED? ENTER CODE FOR 10% OFF + 1GB FREE!
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-foreground/80 mb-3">
                      Both you and your friend get 1GB FREE data!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-foreground/70">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <span>10% OFF + 1GB FREE</span>
                      <span>•</span>
                      <span>FIRST-TIME BUYERS</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
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
                        <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          After payment, you'll receive:
                        </p>
                        <ul className="text-xs sm:text-sm font-bold text-foreground/70 space-y-0.5">
                          <li className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Your eSIM activation details
                          </li>
                          <li className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Account setup link (set your password)
                          </li>
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
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
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
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                {codeError}
                              </p>
                            )}
                            {codeSuccess && (
                              <div className="mt-2 p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/30">
                                <p className="text-xs sm:text-sm font-black text-primary flex items-center gap-1.5">
                                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
                              <p className="mt-2 text-xs font-bold text-muted-foreground flex items-center gap-1">
                                <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                Discount code is active. Remove it to use a referral code instead.
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
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                <span>{referralError}</span>
                              </p>
                            )}
                            {referralSuccess && (
                              <div className="mt-2 p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/30">
                                <p className="text-xs sm:text-sm font-black text-primary flex items-start gap-1.5">
                                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
                            <p className="text-xs font-bold text-foreground/80 flex items-start gap-1">
                              <svg className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              <span><strong>Note:</strong> Discount codes apply instantly. Referral codes give 10% OFF + 1GB FREE data (first-time buyers only). You can only use one type of code per order.</span>
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

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-black uppercase mb-8 text-center">
            HOW IT WORKS
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-foreground">1</span>
              </div>
              <h3 className="font-black text-base sm:text-lg uppercase mb-2">BUY & RECEIVE</h3>
              <p className="font-bold text-foreground/70 text-sm">
                Purchase your eSIM and receive it instantly via email. No waiting, no shipping.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-foreground">2</span>
              </div>
              <h3 className="font-black text-base sm:text-lg uppercase mb-2">TAP & INSTALL</h3>
              <p className="font-bold text-foreground/70 text-sm">
                Tap the link to install automatically, or scan the QR code. Takes under 2 minutes!
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-yellow flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-foreground">3</span>
              </div>
              <h3 className="font-black text-base sm:text-lg uppercase mb-2">LAND & CONNECT</h3>
              <p className="font-bold text-foreground/70 text-sm">
                When you arrive in {countryInfo.name}, enable data roaming. You're instantly connected!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Lumbus Section */}
      <section className="py-12 sm:py-16 px-4 bg-mint/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-black uppercase mb-8 text-center">
            WHY CHOOSE LUMBUS?
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-foreground/10 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase mb-1">INSTANT DELIVERY</h3>
                  <p className="font-bold text-foreground/70 text-xs sm:text-sm">
                    Get your eSIM immediately after purchase. No waiting for physical delivery.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-foreground/10 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase mb-1">24/7 SUPPORT</h3>
                  <p className="font-bold text-foreground/70 text-xs sm:text-sm">
                    Real humans available around the clock. Get help whenever you need it.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-foreground/10 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase mb-1">BEST PRICES</h3>
                  <p className="font-bold text-foreground/70 text-xs sm:text-sm">
                    Up to 10x cheaper than roaming. Better rates than competitors.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-foreground/10 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase mb-1">SECURE PAYMENT</h3>
                  <p className="font-bold text-foreground/70 text-xs sm:text-sm">
                    Apple Pay, Google Pay, and cards via Stripe. Your data is protected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 px-4 bg-purple/20">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black uppercase mb-4 text-center">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-center text-base font-bold text-foreground/70 mb-8">
            Everything you need to know about this {countryInfo.name} eSIM plan
          </p>

          <div className="space-y-3">
            {generatePlanFAQs(countryInfo.name, displayData, plan.validity_days).map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-foreground/5 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-black text-sm sm:text-base">{faq.q}</h3>
                    <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <svg
                        className={`w-4 h-4 text-foreground transition-transform ${expandedFaq === index ? 'rotate-45' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </div>
                </button>
                {expandedFaq === index && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-foreground/10 pt-3">
                    <p className="font-bold text-foreground/70 text-sm">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 bg-primary">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 text-foreground">
            READY TO GET CONNECTED?
          </h2>
          <p className="text-base sm:text-lg font-bold text-foreground/80 mb-6">
            Get {displayData} of high-speed data in {countryInfo.name} for just {currencySymbol}{displayPrice.toFixed(2)}
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-8 py-5 shadow-xl rounded-xl"
          >
            BUY NOW - {currencySymbol}{displayPrice.toFixed(2)}
          </Button>
        </div>
      </section>
    </div>
  );
}
