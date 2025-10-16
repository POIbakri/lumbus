'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Nav } from '@/components/nav';
import { PlanCard } from '@/components/plan-card';
import { Plan } from '@/lib/db';
import { getCountryInfo, getCountriesByContinent, getContinentEmoji } from '@/lib/countries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function PlansPageContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
  const [selectedContinent, setSelectedContinent] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'data' | 'validity'>('price');

  // Currency state
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());

  const countriesByContinent = getCountriesByContinent();
  const continents = Object.keys(countriesByContinent).sort();

  // Read URL parameters on mount
  useEffect(() => {
    const regionParam = searchParams.get('region');
    const continentParam = searchParams.get('continent');

    if (regionParam) {
      setSelectedRegion(regionParam.toUpperCase());
    }
    if (continentParam) {
      setSelectedContinent(continentParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPlans();
    detectCurrency();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [plans, selectedRegion, selectedContinent, searchQuery, sortBy]);

  const detectCurrency = async () => {
    try {
      const response = await fetch('/api/currency/detect');
      if (response.ok) {
        const data = await response.json();
        setCurrencySymbol(data.symbol);
      }
    } catch (error) {
      console.error('Failed to detect currency:', error);
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      const fetchedPlans = data.plans || [];
      setPlans(fetchedPlans);

      // Convert all prices at once
      if (fetchedPlans.length > 0) {
        await convertAllPrices(fetchedPlans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
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
      console.error('Failed to convert prices:', error);
    }
  };

  const filterPlans = () => {
    let filtered = [...plans];

    // Filter by selected region
    if (selectedRegion) {
      filtered = filtered.filter(p => p.region_code === selectedRegion);
    }

    // Filter by selected continent
    if (selectedContinent && !selectedRegion) {
      const countriesInContinent = countriesByContinent[selectedContinent]?.map(c => c.code) || [];
      filtered = filtered.filter(p => countriesInContinent.includes(p.region_code));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.region_code.toLowerCase().includes(query) ||
        getCountryInfo(p.region_code).name.toLowerCase().includes(query)
      );
    }

    // Sort plans
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.retail_price - b.retail_price;
        case 'data':
          return b.data_gb - a.data_gb;
        case 'validity':
          return b.validity_days - a.validity_days;
        default:
          return 0;
      }
    });

    setFilteredPlans(filtered);
  };

  // Get unique regions from plans
  const availableRegions = Array.from(new Set(plans.map(p => p.region_code)))
    .map(code => ({
      code,
      info: getCountryInfo(code),
      count: plans.filter(p => p.region_code === code).length
    }))
    .sort((a, b) => b.count - a.count);

  const clearFilters = () => {
    setSelectedRegion(undefined);
    setSelectedContinent(undefined);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="relative pt-24 sm:pt-32 md:pt-40 pb-16 sm:pb-24 md:pb-32 px-3 sm:px-4 bg-mint overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-cyan/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto relative z-10 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2 sm:px-4">
            <div className="inline-block mb-4 sm:mb-6">
              <span className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-full bg-primary/10 border-2 border-primary font-black uppercase text-xs tracking-widest text-primary">
                💎 {plans.length}+ eSIM Plans
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase mb-3 sm:mb-4 md:mb-6 leading-tight">
              CHOOSE YOUR PLAN
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold max-w-3xl mx-auto opacity-70 px-2">
              Get instant connectivity in 160+ countries. No contracts, no hassle.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 sm:mb-12 md:mb-16">
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 sm:border-4 border-primary shadow-xl p-4 sm:p-6 md:p-8">
              {/* Search Bar */}
              <div className="mb-4 sm:mb-6">
                <Input
                  type="text"
                  placeholder="🔍 Search by country, region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold border-2 border-foreground/10 rounded-lg sm:rounded-xl focus:border-primary"
                />
              </div>

              {/* Sort Options */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="font-black uppercase text-sm text-muted-foreground my-auto">Sort by:</span>
                <Button
                  onClick={() => setSortBy('price')}
                  variant={sortBy === 'price' ? 'default' : 'outline'}
                  className="font-black text-xs"
                >
                  💰 PRICE
                </Button>
                <Button
                  onClick={() => setSortBy('data')}
                  variant={sortBy === 'data' ? 'default' : 'outline'}
                  className="font-black text-xs"
                >
                  📊 DATA
                </Button>
                <Button
                  onClick={() => setSortBy('validity')}
                  variant={sortBy === 'validity' ? 'default' : 'outline'}
                  className="font-black text-xs"
                >
                  📅 DURATION
                </Button>
              </div>

              {/* Continent Filter */}
              <div className="mb-6">
                <div className="font-black uppercase text-sm text-muted-foreground mb-3">Filter by Continent:</div>
                <div className="flex flex-wrap gap-2">
                  {continents.map(continent => (
                    <Button
                      key={continent}
                      onClick={() => {
                        setSelectedContinent(continent === selectedContinent ? undefined : continent);
                        setSelectedRegion(undefined);
                      }}
                      variant={selectedContinent === continent ? 'default' : 'outline'}
                      className="font-black text-xs"
                    >
                      {getContinentEmoji(continent)} {continent}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Popular Countries */}
              <div>
                <div className="font-black uppercase text-sm text-muted-foreground mb-3">Popular Countries:</div>
                <div className="flex flex-wrap gap-2">
                  {availableRegions.slice(0, 12).map(region => (
                    <Button
                      key={region.code}
                      onClick={() => {
                        setSelectedRegion(region.code === selectedRegion ? undefined : region.code);
                        setSelectedContinent(undefined);
                      }}
                      variant={selectedRegion === region.code ? 'default' : 'outline'}
                      className="font-black text-xs"
                    >
                      {region.info.flag} {region.info.name}
                      <Badge className="ml-2 bg-primary/20 text-foreground">{region.count}</Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedRegion || selectedContinent || searchQuery) && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedRegion && (
                        <Badge className="bg-primary text-white px-3 py-1 text-sm">
                          📍 {getCountryInfo(selectedRegion).name}
                        </Badge>
                      )}
                      {selectedContinent && !selectedRegion && (
                        <Badge className="bg-primary text-white px-3 py-1 text-sm">
                          🌍 {selectedContinent}
                        </Badge>
                      )}
                      {searchQuery && (
                        <Badge className="bg-primary text-white px-3 py-1 text-sm">
                          🔍 "{searchQuery}"
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={clearFilters}
                      variant="ghost"
                      className="font-black text-xs"
                    >
                      ✕ CLEAR ALL
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 px-4">
            <p className="text-lg font-black">
              {filteredPlans.length} PLAN{filteredPlans.length !== 1 ? 'S' : ''} AVAILABLE
              {selectedRegion && ` IN ${getCountryInfo(selectedRegion).name.toUpperCase()}`}
              {selectedContinent && !selectedRegion && ` IN ${selectedContinent.toUpperCase()}`}
            </p>
          </div>

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
              <div className="max-w-md mx-auto p-8 sm:p-12 bg-white rounded-3xl border-4 border-primary shadow-2xl">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🌍</div>
                <p className="text-2xl sm:text-3xl font-black uppercase mb-3 sm:mb-4">No Plans Found</p>
                <p className="text-sm sm:text-base md:text-lg font-bold opacity-70 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters} className="font-black">
                  CLEAR FILTERS
                </Button>
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
          <div className="mt-16 text-center px-4">
            <div className="inline-block p-8 bg-white rounded-2xl border-4 border-primary shadow-xl">
              <p className="text-xl font-black mb-4">LOOKING FOR A SPECIFIC COUNTRY?</p>
              <Link href="/destinations">
                <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-8 py-4">
                  BROWSE ALL DESTINATIONS
                </Button>
              </Link>
            </div>
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
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black uppercase">Loading plans...</p>
        </div>
      </div>
    }>
      <PlansPageContent />
    </Suspense>
  );
}
