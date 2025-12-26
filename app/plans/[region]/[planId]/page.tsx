'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { FlagIcon } from '@/components/flag-icon';

// Brand color schemes for plan detail page
const pageColorSchemes = [
  { bg: 'from-mint/60 to-white', cardBg: 'bg-mint/20', statBg1: 'bg-white/70', statBg2: 'bg-cyan/30' },
  { bg: 'from-cyan/60 to-white', cardBg: 'bg-cyan/20', statBg1: 'bg-white/70', statBg2: 'bg-mint/30' },
  { bg: 'from-yellow/60 to-white', cardBg: 'bg-yellow/20', statBg1: 'bg-white/70', statBg2: 'bg-mint/30' },
  { bg: 'from-purple/60 to-white', cardBg: 'bg-purple/20', statBg1: 'bg-white/70', statBg2: 'bg-cyan/30' },
];

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
      a: `Installing your eSIM is simple: 1) After purchase, you'll receive your eSIM via email instantly. 2) On compatible devices, tap the installation link to add it automatically. Or scan the QR code in Settings > Cellular > Add eSIM (iPhone) or Settings > Network > SIMs (Android). 3) IMPORTANT: Enable Data Roaming for your eSIM to work when you arrive in ${countryName}. The whole process takes under 2 minutes!`
    },
    {
      q: `Do I need to enable Data Roaming?`,
      a: `Yes! Data Roaming MUST be turned ON for your eSIM to work. For iPhone: Go to Settings > Cellular > tap your eSIM > turn on Data Roaming. For Android: Settings > Network & Internet > SIMs > tap your eSIM > turn on Roaming. Without this setting enabled, your eSIM won't connect to networks in ${countryName}.`
    },
    {
      q: `Is ${dataAmount} enough for my trip to ${countryName}?`,
      a: `${dataAmount} is perfect for ${validityDays} days of typical travel use including GPS navigation, messaging apps (WhatsApp, iMessage), social media browsing, and light web surfing. If you plan to stream videos or make frequent video calls, consider a larger data plan. You can always top up if you run low!`
    },
    {
      q: `When does my ${validityDays}-day validity period start?`,
      a: `Your ${validityDays}-day validity period starts when you first connect to a network in ${countryName} with Data Roaming enabled, not when you purchase or install the eSIM. This means you can buy and install your eSIM before your trip, and it will only activate when you land and enable Data Roaming.`
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

  // Refs to track current code values for stale closure detection
  const discountCodeRef = useRef(discountCode);
  const referralCodeRef = useRef(referralCode);
  // Keep refs in sync with state
  useEffect(() => {
    discountCodeRef.current = discountCode;
  }, [discountCode]);
  useEffect(() => {
    referralCodeRef.current = referralCode;
  }, [referralCode]);

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
    const codeToValidate = discountCode.trim();

    if (!codeToValidate) {
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
          code: codeToValidate,
          userId: userId,
        }),
      });

      const data = await response.json();

      // Check if the code in the input still matches what we validated
      // If user changed the input during validation, ignore this stale result
      // Use ref to get the CURRENT value, not the stale closure value
      const currentCode = discountCodeRef.current.trim();
      if (currentCode !== codeToValidate) {
        // Code was modified during validation - ignore this result
        return;
      }

      if (data.valid) {
        setDiscountPercent(data.discountPercent);
        setCodeError('');
        setCodeSuccess(`${data.discountPercent}% discount applied! You save ${currencySymbol}${((basePrice * data.discountPercent) / 100).toFixed(2)}`);
        // Clear referral code if discount code is valid (discount overrides referral)
        // Use ref to get current value, not stale closure value
        if (referralCodeRef.current) {
          setReferralCode('');
          referralCodeRef.current = '';
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
    const codeToValidate = referralCode.trim();

    if (!codeToValidate) {
      setReferralError('Please enter a referral code');
      return;
    }

    if (codeToValidate.length !== 8) {
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
          code: codeToValidate,
          userId: userId || undefined,
          email: email || undefined,
        }),
      });

      const data = await response.json();

      // Check if the code in the input still matches what we validated
      // If user changed the input during validation, ignore this stale result
      const currentCode = referralCodeRef.current.trim();
      if (currentCode !== codeToValidate) {
        // Code was modified during validation - ignore this result
        return;
      }

      if (data.valid) {
        setReferralValid(true);
        setReferralError('');
        setReferralSuccess(data.benefits.message);
        // Apply 10% referral discount
        setDiscountPercent(10);
        // Clear discount code if referral is valid (user must choose one)
        // Use ref to get current value, not stale closure value
        if (discountCodeRef.current) {
          setDiscountCode('');
          discountCodeRef.current = '';
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

  // Get color scheme based on plan id
  const schemeIndex = plan.id ? plan.id.charCodeAt(0) % pageColorSchemes.length : 0;
  const colors = pageColorSchemes[schemeIndex];

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

      <div className={`relative pt-28 sm:pt-32 md:pt-36 pb-8 sm:pb-12 px-4 bg-gradient-to-b ${colors.bg}`}>
        <div className="container mx-auto max-w-3xl">
          {/* Back Link */}
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-bold text-sm mb-6 sm:mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to plans
          </Link>

          {/* Main Plan Card */}
          <Card className={`${colors.cardBg} border-2 border-foreground/10 shadow-xl overflow-hidden`}>
            <CardContent className="p-5 sm:p-6 md:p-8">
              {/* No Top-ups Badge for non-reloadable plans */}
              {plan.is_reloadable === false && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-red-700 font-bold text-xs uppercase tracking-wide">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    No Top-ups Available
                  </span>
                </div>
              )}

              {/* Header: Flag + Region + Price */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <FlagIcon countryCode={plan.region_code} className="w-12 h-9 sm:w-14 sm:h-10 md:w-16 md:h-12" />
                  <div>
                    <div className="font-black uppercase text-sm sm:text-base md:text-lg text-foreground">
                      {plan.region_code}
                    </div>
                    <div className="text-sm sm:text-base text-foreground/60 font-medium">
                      {countryInfo.name}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {discountPercent > 0 && (
                    <div className="text-sm sm:text-base text-foreground/40 line-through mb-1">
                      {currencySymbol}{basePrice.toFixed(2)}
                    </div>
                  )}
                  <div className={`font-black text-foreground leading-none ${
                    displayPrice >= 100 ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-3xl sm:text-4xl md:text-5xl'
                  }`}>
                    {currencySymbol}{displayPrice.toFixed(2)}
                  </div>
                  {discountPercent > 0 && (
                    <div className="inline-block mt-2 px-3 py-1 bg-primary text-foreground text-xs sm:text-sm font-black rounded-full">
                      {discountPercent}% OFF
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Name */}
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground/80 mb-6">
                {plan.name.replace(/^[\"']|[\"']$/g, '')}
              </h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className={`${colors.statBg1} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center`}>
                  <div className="text-xs sm:text-sm font-bold text-foreground/60 uppercase mb-2">Data</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">{displayData}</div>
                </div>
                <div className={`${colors.statBg2} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center`}>
                  <div className="text-xs sm:text-sm font-bold text-foreground/60 uppercase mb-2">Validity</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">{plan.validity_days} days</div>
                </div>
              </div>

              {/* Coverage Info for Regional Plans */}
              {regionInfo && regionInfo.isMultiCountry && regionInfo.subLocationList && regionInfo.subLocationList.length > 0 && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setShowCountries(!showCountries)}
                    className="w-full px-4 py-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-colors font-bold text-sm flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2 text-foreground/70">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                      {regionInfo.subLocationList.length} countries covered
                    </span>
                    <svg className={`w-5 h-5 text-foreground/50 transition-transform ${showCountries ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showCountries && (
                    <div className="mt-3 p-4 bg-foreground/5 rounded-xl max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {regionInfo.subLocationList.map((country) => (
                          <div
                            key={country.code}
                            className="flex items-center gap-2 py-1.5"
                          >
                            <FlagIcon countryCode={country.code} className="w-5 h-4 sm:w-6 sm:h-4" />
                            <span className="text-sm font-medium text-foreground/80">{country.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* What's Included */}
              <div className="mb-6 p-4 bg-foreground/5 rounded-xl">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-medium text-foreground/80">High-speed data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-medium text-foreground/80">Instant delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-medium text-foreground/80">Hotspot included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-medium text-foreground/80">No contracts</span>
                  </div>
                </div>
              </div>

              {/* Checkout Section */}
              <div className="border-t border-foreground/10 pt-6">
                  <h3 className="font-black uppercase text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-5 flex items-center gap-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    COMPLETE YOUR PURCHASE
                  </h3>

                  <div className="space-y-4 sm:space-y-5">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="email" className="block font-bold text-xs sm:text-sm mb-2 text-foreground/80">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-foreground/20 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold transition-all"
                        disabled={loading}
                      />
                      <p className="mt-2 text-xs sm:text-sm text-foreground/60 flex items-start gap-1.5">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Your eSIM and account setup link will be sent here instantly after payment.</span>
                      </p>
                    </div>

                    {/* Discount/Referral Code Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowCodes(!showCodes)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-yellow/30 hover:bg-yellow/40 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                          <span>Have a discount or referral code?</span>
                        </span>
                        <svg className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform ${showCodes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showCodes && (
                        <div className="mt-3 p-3 sm:p-4 bg-foreground/5 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
                          {/* Discount Code */}
                          <div>
                            <label htmlFor="discountCode" className="block font-bold text-xs sm:text-sm mb-2 text-foreground/70">
                              Discount Code
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="discountCode"
                                type="text"
                                value={discountCode}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  // Check if we had a validated code OR validation is in progress BEFORE clearing state
                                  // This handles the race condition where user modifies code during validation
                                  const hadValidatedCode = !!codeSuccess || validatingCode;

                                  // Update ref SYNCHRONOUSLY so async validation can detect stale results
                                  discountCodeRef.current = value;
                                  setDiscountCode(value);
                                  setCodeError('');
                                  setCodeSuccess('');

                                  // Clear discount when code is modified from validated state, during validation, or emptied
                                  if (hadValidatedCode || !value.trim()) {
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
                                className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-white border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold uppercase"
                                disabled={loading || validatingCode}
                              />
                              <Button
                                type="button"
                                onClick={validateDiscountCode}
                                disabled={loading || validatingCode || !discountCode.trim()}
                                className="px-3 sm:px-4 py-2.5 bg-foreground text-white font-black uppercase text-xs rounded-lg hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                {validatingCode ? '...' : 'APPLY'}
                              </Button>
                            </div>
                            {validatingCode && (
                              <p className="mt-2 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                                Validating...
                              </p>
                            )}
                            {codeError && (
                              <p className="mt-2 text-xs font-bold text-destructive flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                {codeError}
                              </p>
                            )}
                            {codeSuccess && (
                              <p className="mt-2 text-xs font-black text-primary flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {codeSuccess}
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-foreground/10"></div>
                            <span className="text-xs font-bold text-foreground/40">OR</span>
                            <div className="flex-1 h-px bg-foreground/10"></div>
                          </div>

                          {/* Referral Code */}
                          <div>
                            <label htmlFor="referralCode" className="block font-bold text-xs sm:text-sm mb-2 text-foreground/70">
                              Referral Code <span className="font-normal text-foreground/50">(First-time buyers)</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="referralCode"
                                type="text"
                                value={referralCode}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                                  // Check if validation is in progress or we had a validated code
                                  const hadValidatedCode = !!referralSuccess || referralValidating;

                                  // Update ref SYNCHRONOUSLY so async validation can detect stale results
                                  referralCodeRef.current = value;
                                  setReferralCode(value);
                                  setReferralError('');
                                  setReferralSuccess('');

                                  // Clear discount/valid state when code is modified during or after validation
                                  if (hadValidatedCode || !value.trim()) {
                                    setReferralValid(false);
                                    // Clear discount if it was from referral (10%) and no discount code active
                                    if (discountPercent === 10 && !discountCodeRef.current) {
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
                                className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-white border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold uppercase"
                                disabled={loading || referralValidating || discountPercent > 0}
                              />
                              <Button
                                type="button"
                                onClick={validateReferralCode}
                                disabled={loading || referralValidating || !referralCode.trim() || referralCode.length !== 8 || discountPercent > 0}
                                className="px-3 sm:px-4 py-2.5 bg-foreground text-white font-black uppercase text-xs rounded-lg hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                {referralValidating ? '...' : 'APPLY'}
                              </Button>
                            </div>
                            {discountPercent > 0 && codeSuccess && !referralSuccess && (
                              <p className="mt-2 text-xs font-bold text-foreground/50 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Clear discount code to use referral instead.
                              </p>
                            )}
                            {referralValidating && (
                              <p className="mt-2 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                                Verifying...
                              </p>
                            )}
                            {referralError && (
                              <p className="mt-2 text-xs font-bold text-destructive flex items-start gap-1.5">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                <span>{referralError}</span>
                              </p>
                            )}
                            {referralSuccess && (
                              <p className="mt-2 text-xs font-black text-primary flex items-start gap-1.5">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                <span>{referralSuccess}</span>
                              </p>
                            )}
                            {!referralSuccess && !referralError && !discountPercent && (
                              <p className="mt-2 text-xs text-foreground/50">
                                Get 10% OFF + 1GB FREE data! Your friend gets 1GB too.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-start gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Checkout Button */}
                    <Button
                      onClick={handleCheckout}
                      disabled={loading || !email}
                      className="w-full bg-foreground hover:bg-foreground/90 text-white text-sm sm:text-base md:text-lg py-3.5 sm:py-4 md:py-5 font-black rounded-lg sm:rounded-xl shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>PROCESSING...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>PROCEED TO CHECKOUT</span>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      )}
                    </Button>

                    {/* Payment Methods & Trust */}
                    <div className="pt-2">
                      <PaymentLogosCompact />
                    </div>

                    <p className="text-xs text-center text-foreground/50 leading-relaxed">
                      By proceeding, you agree to our{' '}
                      <Link href="/terms" target="_blank" className="text-primary hover:underline">Terms</Link>,{' '}
                      <Link href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link> &{' '}
                      <Link href="/refund-policy" target="_blank" className="text-primary hover:underline">Refund Policy</Link>
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>
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
