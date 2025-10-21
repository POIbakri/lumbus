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

function PlansPageContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');

  // Currency state
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());

  // Location state
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userLocationDetected, setUserLocationDetected] = useState(false);

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
      <Nav />

      {/* Hero Section */}
      <section className="relative pt-48 sm:pt-40 pb-20 sm:pb-32 px-4 overflow-hidden bg-white">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-mint rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10 max-w-7xl">
          {/* Page Badge */}
          <div className="inline-block mb-6">
            <span className="inline-block px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-purple border-2 border-foreground font-black uppercase text-xs tracking-widest text-foreground shadow-lg">
              💎 Buy eSIM Plans
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
              placeholder="🔍 Search country, region, or plan name..."
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
                  <span className="text-lg">🔍</span>
                  <span className="font-black text-sm sm:text-base">Searching for: "{searchQuery}"</span>
                </div>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  className="font-black text-xs"
                >
                  ✕ CLEAR
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
                  <div className="text-2xl sm:text-4xl">⚡</div>
                </div>
              </div>
              <p className="mt-6 sm:mt-8 font-black uppercase text-lg sm:text-2xl tracking-tight">Loading plans...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-20 sm:py-32 px-4">
              <div className="max-w-md mx-auto p-8 sm:p-12 bg-white rounded-3xl border-4 border-foreground shadow-2xl">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🌍</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 px-4">
              {filteredPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  displayPrice={convertedPrices.get(plan.id)}
                  displaySymbol={currencySymbol}
                />
              ))}
            </div>
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
