'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Nav } from '@/components/nav';
import { PlanCard } from '@/components/plan-card';
import { Plan } from '@/lib/db';
import { getCountryInfo, REGIONS } from '@/lib/countries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ServiceSchema, BreadcrumbSchema, FAQSchema } from '@/components/structured-data';
import { Card, CardContent } from '@/components/ui/card';

// General eSIM FAQs for the plans browsing page
const ESIM_FAQS = [
  {
    q: 'What is an eSIM and how does it work?',
    a: 'An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without using a physical SIM card. It\'s built into your phone and can be activated by scanning a QR code. You can use it alongside your regular SIM for dual connectivity.'
  },
  {
    q: 'Is my phone compatible with eSIM?',
    a: 'Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many other Android devices. Your phone must also be carrier-unlocked. Check our device compatibility page to verify your specific model.'
  },
  {
    q: 'How do I install an eSIM?',
    a: 'After purchasing, you\'ll receive your eSIM via email instantly. On compatible devices, simply tap the installation link to add it automatically. Alternatively, you can scan the QR code in Settings > Cellular > Add eSIM (iPhone) or Settings > Network & Internet > SIMs (Android). The process takes under 2 minutes!'
  },
  {
    q: 'When does my eSIM data plan start?',
    a: 'Your data plan validity period begins when you first connect to a network at your destination, not when you purchase or install the eSIM. This means you can buy and set up your eSIM before traveling, and it will only activate upon arrival.'
  },
  {
    q: 'Can I use my eSIM for hotspot/tethering?',
    a: 'Yes! All Lumbus eSIM plans include hotspot and tethering capability. You can share your data connection with laptops, tablets, or other devices. Just enable the hotspot feature in your phone settings.'
  },
  {
    q: 'What happens to my regular phone number?',
    a: 'Your regular SIM card and phone number continue to work normally. The eSIM provides data only, so you\'ll use it for internet while your regular SIM handles calls and texts. You can also use WiFi calling apps like WhatsApp for free calls over your eSIM data.'
  },
  {
    q: 'Can I top up or extend my eSIM plan?',
    a: 'Yes! If you run out of data before your validity period ends, you can easily purchase a top-up through our website or app. Top-ups are instant and extend your connectivity without needing to install a new eSIM.'
  },
  {
    q: 'Is eSIM better than buying a local SIM card?',
    a: 'eSIM offers several advantages: instant delivery (no airport queues), setup before you travel, no language barriers, competitive prices, keep your regular number active, and easy top-ups. It\'s the most convenient way to stay connected abroad.'
  }
];

function PlansPageContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');
  const [displayCount, setDisplayCount] = useState(24);

  // Currency state
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());

  // Location state
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userLocationDetected, setUserLocationDetected] = useState(false);

  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Read URL parameters for initial search
  useEffect(() => {
    const regionParam = searchParams.get('region');
    if (regionParam) {
      const regionInfo = getCountryInfo(regionParam.toUpperCase());
      setSearchQuery(regionInfo.name);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPlans();
    detectCurrency();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [plans, searchQuery, activeTab]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(24);
  }, [searchQuery, activeTab, plans]);

  const detectCurrency = async () => {
    try {
      const response = await fetch('/api/currency/detect');
      if (response.ok) {
        const data = await response.json();
        setCurrencySymbol(data.symbol);
        if (data.country) {
          setUserCountry(data.country);
          setUserLocationDetected(true);
        }
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      // Try to load from cache first
      const cachedData = localStorage.getItem('lumbus_plans_cache');
      const cacheTime = localStorage.getItem('lumbus_plans_cache_time');
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes

      if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < cacheExpiry) {
          // Use cached data
          const fetchedPlans = JSON.parse(cachedData);
          setPlans(fetchedPlans);
          if (fetchedPlans.length > 0) {
            await convertAllPrices(fetchedPlans);
          }
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const response = await fetch('/api/plans');
      const data = await response.json();
      const fetchedPlans = data.plans || [];
      setPlans(fetchedPlans);

      // Cache the data
      localStorage.setItem('lumbus_plans_cache', JSON.stringify(fetchedPlans));
      localStorage.setItem('lumbus_plans_cache_time', Date.now().toString());

      // Convert all prices at once
      if (fetchedPlans.length > 0) {
        await convertAllPrices(fetchedPlans);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const convertAllPrices = async (plansToConvert: Plan[]) => {
    try {
      const usdPrices = plansToConvert.map(p => p.retail_price);
      const response = await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: usdPrices }),
      });

      if (response.ok) {
        const data = await response.json();
        const priceMap = new Map<string, number>();
        plansToConvert.forEach((plan, index) => {
          if (data.prices[index]) {
            priceMap.set(plan.id, data.prices[index].converted);
          }
        });
        setConvertedPrices(priceMap);
        setCurrencySymbol(data.symbol);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const filterPlans = () => {
    let filtered = [...plans];

    // Filter by tab (countries vs regions)
    if (activeTab === 'countries') {
      // Only show plans for individual countries (not regional multi-country plans)
      filtered = filtered.filter(p => !REGIONS[p.region_code]);
    } else {
      // Only show regional plans
      filtered = filtered.filter(p => REGIONS[p.region_code]);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const countryInfo = getCountryInfo(p.region_code);
        const regionInfo = REGIONS[p.region_code];

        return (
          p.name.toLowerCase().includes(query) ||
          p.region_code.toLowerCase().includes(query) ||
          countryInfo.name.toLowerCase().includes(query) ||
          (regionInfo && regionInfo.name.toLowerCase().includes(query)) ||
          (regionInfo && regionInfo.description.toLowerCase().includes(query))
        );
      });
    }

    // Sort plans by price by default
    filtered.sort((a, b) => a.retail_price - b.retail_price);

    setFilteredPlans(filtered);
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <ServiceSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://getlumbus.com' },
          { name: 'eSIM Plans', url: 'https://getlumbus.com/plans' },
        ]}
      />
      <FAQSchema faqs={ESIM_FAQS} />

      <Nav />

      {/* Hero Section */}
      <section className="relative pt-48 sm:pt-40 pb-20 sm:pb-32 px-4 overflow-hidden bg-white">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-mint rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10 max-w-7xl">
          {/* Page Badge */}
          <div className="inline-block mb-6">
            <span className="inline-flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-purple border-2 border-foreground font-black uppercase text-xs tracking-widest text-foreground shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Buy eSIM Plans
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase mb-6 sm:mb-8 max-w-5xl mx-auto leading-tight px-2">
            FIND YOUR<br/>PERFECT PLAN
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-bold mb-8 sm:mb-10 max-w-3xl mx-auto px-4 opacity-70">
            1700+ plans across <span className="text-primary">150+ countries</span>. Works at home too!
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto px-4 mb-8">
            <Input
              type="text"
              placeholder="Search country, region, or plan name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg md:text-xl font-bold border-2 sm:border-4 border-foreground rounded-xl sm:rounded-2xl shadow-xl focus:border-primary transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => { setActiveTab('countries'); }}
              variant={activeTab === 'countries' ? 'default' : 'outline'}
              className="font-black text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
            >
              COUNTRIES
            </Button>
            <Button
              onClick={() => { setActiveTab('regions'); }}
              variant={activeTab === 'regions' ? 'default' : 'outline'}
              className="font-black text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
            >
              REGIONS
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto relative z-10 max-w-7xl px-4">
        {/* Active Search Filter */}
        {searchQuery && (
          <div className="mb-8 sm:mb-12">
            <div className="bg-yellow rounded-2xl border-4 border-foreground shadow-xl p-4 sm:p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <span className="font-black text-sm sm:text-base">Searching for: "{searchQuery}"</span>
                </div>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  className="font-black text-xs flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  CLEAR
                </Button>
              </div>
            </div>
          </div>
        )}

          {/* Plans Grid */}
          {loading ? (
            <div className="text-center py-20 sm:py-32 px-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 sm:border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-10 sm:h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="mt-6 sm:mt-8 font-black uppercase text-lg sm:text-2xl tracking-tight">Loading plans...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-20 sm:py-32 px-4">
              <div className="max-w-md mx-auto p-8 sm:p-12 bg-white rounded-3xl border-4 border-foreground shadow-2xl">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-2xl sm:text-3xl font-black uppercase mb-3 sm:mb-4">No Plans Found</p>
                <p className="text-sm sm:text-base md:text-lg font-bold opacity-70 mb-6">
                  Try searching for a different country or region
                </p>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery('')} className="font-black">
                    CLEAR SEARCH
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 px-4">
                {filteredPlans.slice(0, displayCount).map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    displayPrice={convertedPrices.get(plan.id)}
                    displaySymbol={currencySymbol}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {displayCount < filteredPlans.length && (
                <div className="text-center mt-8 sm:mt-12">
                  <Button 
                    onClick={() => setDisplayCount(prev => prev + 24)}
                    className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base px-8 sm:px-12 py-3 sm:py-4 shadow-xl"
                  >
                    LOAD MORE
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Browse All Countries */}
          <div className="mt-12 sm:mt-16 text-center px-4 pb-8">
            <div className="inline-block p-6 sm:p-8 bg-white rounded-2xl border-4 border-foreground shadow-xl max-w-md">
              <p className="text-lg sm:text-xl font-black mb-3 sm:mb-4">LOOKING FOR A SPECIFIC COUNTRY?</p>
              <Link href="/destinations">
                <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto">
                  BROWSE ALL DESTINATIONS
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Why eSIM Section */}
        <section className="py-16 sm:py-24 px-4 bg-mint">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-purple border-2 border-foreground font-black uppercase text-xs tracking-widest mb-4 sm:mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                Why eSIM?
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4">
                THE SMARTER WAY TO CONNECT
              </h2>
              <p className="text-base sm:text-lg font-bold opacity-70 max-w-2xl mx-auto">
                Skip the hassle of physical SIM cards. eSIM is the future of mobile connectivity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Benefit 1 */}
              <Card className="bg-white border-4 border-foreground shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <h3 className="font-black uppercase text-lg mb-2">INSTANT DELIVERY</h3>
                  <p className="text-sm font-bold opacity-70">Get your eSIM via email within seconds. No waiting, no shipping.</p>
                </CardContent>
              </Card>

              {/* Benefit 2 */}
              <Card className="bg-white border-4 border-foreground shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-black uppercase text-lg mb-2">SAVE MONEY</h3>
                  <p className="text-sm font-bold opacity-70">Avoid expensive roaming charges. Pay local rates, save up to 90%.</p>
                </CardContent>
              </Card>

              {/* Benefit 3 */}
              <Card className="bg-white border-4 border-foreground shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <h3 className="font-black uppercase text-lg mb-2">KEEP YOUR NUMBER</h3>
                  <p className="text-sm font-bold opacity-70">Use eSIM for data while keeping your regular SIM for calls & texts.</p>
                </CardContent>
              </Card>

              {/* Benefit 4 */}
              <Card className="bg-white border-4 border-foreground shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h3 className="font-black uppercase text-lg mb-2">ECO-FRIENDLY</h3>
                  <p className="text-sm font-bold opacity-70">No plastic SIM cards to throw away. Better for the environment.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 px-4 bg-white">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-cyan border-2 border-foreground font-black uppercase text-xs tracking-widest mb-4 sm:mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Super Easy
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4">
                3 SIMPLE STEPS
              </h2>
              <p className="text-base sm:text-lg font-bold opacity-70 max-w-2xl mx-auto">
                From purchase to connected in under 2 minutes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="text-center relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-4 border-foreground shadow-xl">
                  <span className="text-3xl sm:text-4xl font-black">1</span>
                </div>
                <h3 className="font-black uppercase text-xl sm:text-2xl mb-2 sm:mb-3">CHOOSE A PLAN</h3>
                <p className="text-sm sm:text-base font-bold opacity-70">
                  Browse our 1700+ plans covering 150+ countries. Pick the data and duration that fits your trip.
                </p>
                {/* Connector Arrow - Hidden on mobile */}
                <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 w-8 h-8">
                  <svg className="w-full h-full text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-cyan rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-4 border-foreground shadow-xl">
                  <span className="text-3xl sm:text-4xl font-black">2</span>
                </div>
                <h3 className="font-black uppercase text-xl sm:text-2xl mb-2 sm:mb-3">INSTALL INSTANTLY</h3>
                <p className="text-sm sm:text-base font-bold opacity-70">
                  Receive your eSIM via email. Tap the link to install automatically, or scan the QR code.
                </p>
                {/* Connector Arrow - Hidden on mobile */}
                <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 w-8 h-8">
                  <svg className="w-full h-full text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-4 border-foreground shadow-xl">
                  <span className="text-3xl sm:text-4xl font-black">3</span>
                </div>
                <h3 className="font-black uppercase text-xl sm:text-2xl mb-2 sm:mb-3">STAY CONNECTED</h3>
                <p className="text-sm sm:text-base font-bold opacity-70">
                  Your plan activates when you connect at your destination. Enjoy fast, reliable data anywhere!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-24 px-4 bg-purple/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-foreground font-black uppercase text-xs tracking-widest mb-4 sm:mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Got Questions?
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <p className="text-base sm:text-lg font-bold opacity-70 max-w-2xl mx-auto">
                Everything you need to know about eSIM and how it works
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {ESIM_FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border-4 border-foreground rounded-xl overflow-hidden shadow-lg"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-mint/50 transition-colors"
                  >
                    <span className="font-black text-sm sm:text-base md:text-lg pr-4">{faq.q}</span>
                    <svg
                      className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0">
                      <p className="text-sm sm:text-base font-bold opacity-70 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="py-16 sm:py-24 px-4 bg-foreground text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 sm:mb-6">
              READY TO STAY CONNECTED?
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-bold opacity-80 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who trust Lumbus for reliable, affordable connectivity worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn-lumbus bg-primary text-foreground hover:bg-primary/90 font-black text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-xl w-full sm:w-auto"
              >
                BROWSE PLANS
              </Button>
              <Link href="/device-compatibility">
                <Button className="btn-lumbus bg-white text-foreground hover:bg-white/90 font-black text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-xl w-full sm:w-auto">
                  CHECK COMPATIBILITY
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full  mx-auto mb-4"></div>
          <p className="font-black uppercase">Loading plans...</p>
        </div>
      </div>
    }>
      <PlansPageContent />
    </Suspense>
  );
}
