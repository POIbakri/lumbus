'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCountriesByContinent, searchCountries, REGIONS, type CountryInfo, type RegionInfo } from '@/lib/countries';
import { Plan } from '@/lib/db';

export default function DestinationsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(32);

  // Location state
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userLocationDetected, setUserLocationDetected] = useState(false);

  const countriesByContinent = getCountriesByContinent();

  useEffect(() => {
    loadPlans();
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      const response = await fetch('/api/currency/detect');
      if (response.ok) {
        const data = await response.json();
        if (data.country) {
          setUserCountry(data.country);
          setUserLocationDetected(true);
        }
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Count plans per country
  const planCounts = new Map<string, number>();
  plans.forEach(plan => {
    const count = planCounts.get(plan.region_code) || 0;
    planCounts.set(plan.region_code, count + 1);
  });

  // Get all countries with plans
  const allCountries = Object.values(countriesByContinent).flat();
  const countriesWithPlans = allCountries
    .filter(country => planCounts.has(country.code) && planCounts.get(country.code)! > 0)
    .map(country => ({
      ...country,
      planCount: planCounts.get(country.code)!,
      minPrice: Math.min(...plans.filter(p => p.region_code === country.code).map(p => p.retail_price))
    }))
    .sort((a, b) => b.planCount - a.planCount);

  // Get regional plans with pricing
  const regionalPlans = Object.values(REGIONS)
    .filter(region => {
      const count = planCounts.get(region.code) || 0;
      return count > 0;
    })
    .map(region => ({
      ...region,
      planCount: planCounts.get(region.code)!,
      minPrice: Math.min(...plans.filter(p => p.region_code === region.code).map(p => p.retail_price))
    }))
    .sort((a, b) => b.planCount - a.planCount);

  // Filter by search
  const filteredCountries = searchQuery
    ? countriesWithPlans.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countriesWithPlans;

  const filteredRegions = searchQuery
    ? regionalPlans.filter(region =>
        region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        region.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : regionalPlans;

  // Items to display based on active tab
  const displayItems = activeTab === 'countries'
    ? filteredCountries.slice(0, displayLimit)
    : filteredRegions.slice(0, displayLimit);

  const totalItems = activeTab === 'countries' ? filteredCountries.length : filteredRegions.length;
  const hasMore = displayLimit < totalItems;

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-12 sm:pb-16 px-4 overflow-hidden bg-white">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-mint rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-purple rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          {/* Page Badge */}
          <div className="inline-block mb-6">
            <span className="inline-block px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-cyan border-2 border-foreground font-black uppercase text-xs tracking-widest text-foreground shadow-lg">
              📍 Browse Destinations
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase mb-6 sm:mb-8 max-w-5xl mx-auto leading-tight px-2">
            WHERE WILL YOU<br/>GO NEXT?
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-bold mb-8 sm:mb-10 max-w-3xl mx-auto px-4 opacity-70">
            Get instant connectivity in <span className="text-primary">150+ countries</span>.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto px-4 mb-8">
            <Input
              type="text"
              placeholder="🔍 Search country or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg md:text-xl font-bold border-2 sm:border-4 border-foreground rounded-xl sm:rounded-2xl shadow-xl focus:border-primary transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => { setActiveTab('countries'); setDisplayLimit(32); }}
              variant={activeTab === 'countries' ? 'default' : 'outline'}
              className="font-black text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
            >
              COUNTRIES
            </Button>
            <Button
              onClick={() => { setActiveTab('regions'); setDisplayLimit(32); }}
              variant={activeTab === 'regions' ? 'default' : 'outline'}
              className="font-black text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
            >
              REGIONS
            </Button>
          </div>
        </div>
      </section>

      {/* Your Location */}
      {userLocationDetected && userCountry && activeTab === 'countries' && planCounts.get(userCountry) && planCounts.get(userCountry)! > 0 && !searchQuery && (
        <section className="py-6 sm:py-8 px-3 sm:px-4 bg-white">
          <div className="container mx-auto max-w-7xl">
            <div className="bg-yellow rounded-2xl border-4 border-foreground shadow-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl">
                      {(() => {
                        const country = allCountries.find(c => c.code === userCountry);
                        return country?.flag || '📍';
                      })()}
                    </span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase">Your Location</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold opacity-80">
                    {planCounts.get(userCountry)} plans available for {(() => {
                      const country = allCountries.find(c => c.code === userCountry);
                      return country?.name || userCountry;
                    })()}
                  </p>
                </div>
                <Link href={`/plans?region=${userCountry}`}>
                  <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 shadow-lg w-full sm:w-auto">
                    VIEW PLANS →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Destinations Grid */}
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 sm:border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl sm:text-4xl">⚡</div>
                </div>
              </div>
              <p className="mt-6 font-black uppercase text-lg sm:text-2xl">Loading...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl sm:text-6xl mb-4">🌍</div>
              <p className="text-2xl sm:text-3xl font-black uppercase mb-3">No Results Found</p>
              <p className="text-base sm:text-lg font-bold opacity-70">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {displayItems.map((item, index) => (
                  <Link
                    key={item.code}
                    href={`/plans?region=${item.code}`}
                    className="block"
                  >
                    <Card className="h-full cursor-pointer border-4 border-foreground hover:border-primary hover:shadow-xl transition-all duration-200 bg-white">
                      <CardContent className="p-3 sm:p-4 md:p-5 text-center flex flex-col justify-between h-full">
                        <div>
                          <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3">{item.flag}</div>
                          <h3 className="font-black text-sm sm:text-base md:text-lg mb-2 sm:mb-3 leading-tight min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center">
                            {item.name} eSIM
                          </h3>
                        </div>
                        <div>
                          <Badge className="bg-mint text-foreground border-2 border-foreground font-black text-xs mb-2">
                            {item.planCount} {item.planCount === 1 ? 'plan' : 'plans'}
                          </Badge>
                          <div className="text-xs sm:text-sm font-bold text-muted-foreground">
                            from <span className="text-primary font-black text-sm sm:text-base">${item.minPrice.toFixed(2)}/day</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-8 sm:mt-12">
                  <Button
                    onClick={() => setDisplayLimit(prev => prev + 32)}
                    className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base px-8 sm:px-12 py-3 sm:py-4 shadow-xl"
                  >
                    LOAD MORE
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Global Coverage Stats */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-center">
            <div className="p-4 sm:p-6 md:p-8 bg-cyan rounded-xl sm:rounded-2xl border-4 border-foreground shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">150+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Countries</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-yellow rounded-xl sm:rounded-2xl border-4 border-foreground shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">1700+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Plans</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-purple rounded-xl sm:rounded-2xl border-4 border-foreground shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">24/7</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Support</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-mint rounded-xl sm:rounded-2xl border-4 border-foreground shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">5G</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Speeds</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 sm:mb-8 text-foreground leading-tight">
            READY TO GET CONNECTED?
          </h2>
          <p className="text-xl sm:text-2xl font-black mb-8 sm:mb-12 text-foreground/80 max-w-3xl mx-auto">
            Choose your destination and get instant connectivity
          </p>
          <Link href="/plans">
            <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-12 sm:px-16 py-5 sm:py-6 rounded-xl shadow-2xl">
              BROWSE ALL PLANS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
