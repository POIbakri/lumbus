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
      // Error handled silently
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      // Error handled silently
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
            Get instant connectivity in <span className="text-primary">150+ countries</span> or use at home as backup data.
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
        <section className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 bg-white">
          <div className="container mx-auto max-w-7xl">
            <div className="bg-gradient-to-br from-yellow to-yellow/80 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 sm:border-3 md:border-4 border-foreground shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden group hover:scale-[1.02] active:scale-[1.02] transition-transform duration-300">
              {/* Decorative Element */}
              <div className="absolute -top-10 -right-10 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full blur-2xl"></div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
                <div className="text-center sm:text-left flex-1 w-full sm:w-auto">
                  <div className="inline-flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-foreground/20 sm:border-2">
                    <span className="text-2xl sm:text-3xl md:text-4xl">
                      {(() => {
                        const country = allCountries.find(c => c.code === userCountry);
                        return country?.flag || '📍';
                      })()}
                    </span>
                    <span className="font-black uppercase text-[10px] sm:text-xs md:text-sm">Your Location</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-2 sm:mb-3 leading-tight">
                    {(() => {
                      const country = allCountries.find(c => c.code === userCountry);
                      return country?.name || userCountry;
                    })()}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-foreground/20 sm:border-2">
                    <div className="font-black text-xl sm:text-2xl md:text-3xl text-primary">
                      {planCounts.get(userCountry)}
                    </div>
                    <div className="font-black text-xs sm:text-sm uppercase text-muted-foreground">
                      Plans Available
                    </div>
                  </div>
                </div>
                <Link href={`/plans?region=${userCountry}`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 hover:scale-105 active:scale-105 font-black text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl transition-all duration-300 touch-manipulation">
                    VIEW PLANS
                    <span className="ml-1.5 sm:ml-2 text-lg sm:text-xl">→</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {displayItems.map((item, index) => {
                  // Rotate through brand colors
                  const colors = ['bg-mint', 'bg-yellow', 'bg-cyan', 'bg-purple'];
                  const bgColor = colors[index % colors.length];

                  return (
                    <Link
                      key={item.code}
                      href={`/plans?region=${item.code}`}
                      className="block group"
                    >
                      <Card className={`h-full cursor-pointer border-2 sm:border-3 md:border-4 border-foreground ${bgColor} hover:scale-105 active:scale-105 hover:shadow-2xl active:shadow-2xl transition-all duration-300 overflow-hidden relative touch-manipulation`}>
                        {/* Shine Effect on Hover/Active */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 group-active:bg-white/20 transition-all duration-300 pointer-events-none"></div>

                        <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 text-center flex flex-col justify-between h-full relative z-10">
                          {/* Flag - Large and Prominent */}
                          <div className="mb-2 sm:mb-3 md:mb-4">
                            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 sm:mb-3 md:mb-4 transform group-hover:scale-110 group-active:scale-110 transition-transform duration-300">
                              {item.flag}
                            </div>

                            {/* Country/Region Name */}
                            <h3 className="font-black text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl uppercase leading-tight min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center px-1">
                              {item.name}
                            </h3>
                          </div>

                          {/* Info Section */}
                          <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                            {/* Plans Available */}
                            <div className="bg-white rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 border border-foreground/20 sm:border-2">
                              <div className="font-black text-lg sm:text-xl md:text-2xl lg:text-3xl text-foreground">
                                {item.planCount}
                              </div>
                              <div className="font-black text-[10px] sm:text-xs uppercase text-muted-foreground">
                                {item.planCount === 1 ? 'Plan' : 'Plans'}
                              </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-foreground text-white rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3">
                              <div className="text-[9px] sm:text-xs font-bold uppercase mb-0.5 sm:mb-1 opacity-80">
                                Starting at
                              </div>
                              <div className="font-black text-base sm:text-lg md:text-xl lg:text-2xl">
                                ${item.minPrice.toFixed(2)}
                              </div>
                            </div>

                            {/* CTA Arrow */}
                            <div className="font-black text-[10px] sm:text-xs md:text-sm uppercase text-foreground flex items-center justify-center gap-0.5 sm:gap-1 group-hover:gap-1 sm:group-hover:gap-2 transition-all pt-0.5 sm:pt-1">
                              <span className="hidden sm:inline">View Plans</span>
                              <span className="sm:hidden">View</span>
                              <span className="text-sm sm:text-base md:text-lg group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
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
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 text-center">
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-cyan rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-foreground shadow-lg sm:shadow-xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-1 sm:mb-2">150+</div>
              <div className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl font-black uppercase leading-tight">Countries</div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-yellow rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-foreground shadow-lg sm:shadow-xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-1 sm:mb-2">1700+</div>
              <div className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl font-black uppercase leading-tight">Plans</div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-purple rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-foreground shadow-lg sm:shadow-xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-1 sm:mb-2">24/7</div>
              <div className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl font-black uppercase leading-tight">Support</div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-mint rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-foreground shadow-lg sm:shadow-xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-1 sm:mb-2">5G</div>
              <div className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl font-black uppercase leading-tight">Speeds</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight px-2">
            READY TO GET CONNECTED?
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black mb-6 sm:mb-8 md:mb-12 text-foreground/80 max-w-3xl mx-auto px-4">
            Choose your destination and get instant connectivity
          </p>
          <Link href="/plans">
            <Button className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-black text-sm sm:text-base md:text-lg px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl transition-all hover:scale-105 active:scale-105 touch-manipulation">
              BROWSE ALL PLANS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
