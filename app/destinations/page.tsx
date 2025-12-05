'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCountriesByContinent, searchCountries, REGIONS, type CountryInfo, type RegionInfo } from '@/lib/countries';
import { Plan } from '@/lib/db';
import { ServiceSchema, BreadcrumbSchema, ItemListSchema, FAQSchema } from '@/components/structured-data';
import { FlagIcon } from '@/components/flag-icon';

// Static SEO content that renders immediately (fixes soft 404)
const destinationFaqs = [
  {
    q: 'What countries can I buy eSIM for?',
    a: 'Lumbus offers eSIM plans for over 150 countries worldwide including popular destinations like Japan, USA, UK, Thailand, Turkey, UAE, Singapore, Malaysia, France, Spain, Italy, and many more. Browse our full list of destinations to find your country.',
  },
  {
    q: 'How do I choose the right eSIM destination?',
    a: 'Simply search for your destination country or browse by region. Each destination shows available plans with data amounts, validity periods, and prices. Choose based on how much data you need and how long you will be traveling.',
  },
  {
    q: 'Can I use one eSIM for multiple countries?',
    a: 'Yes! Lumbus offers regional eSIM plans that cover multiple countries. For example, our Europe eSIM works in 30+ European countries, and we have Asia and Middle East regional plans too.',
  },
  {
    q: 'What are the most popular eSIM destinations?',
    a: 'Our most popular eSIM destinations are Japan, Turkey, USA, UK, Thailand, UAE, Saudi Arabia, Singapore, Malaysia, and European countries. These destinations have the highest demand from travelers.',
  },
];

export default function DestinationsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(32);

  // Location state
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userLocationDetected, setUserLocationDetected] = useState(false);

  // Currency state
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());

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
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      const fetchedPlans = data.plans || [];
      setPlans(fetchedPlans);

      // Convert all prices after loading plans
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
    .map(country => {
      const countryPlans = plans.filter(p => p.region_code === country.code);
      const minPrice = Math.min(...countryPlans.map(p => {
        const convertedPrice = convertedPrices.get(p.id);
        return convertedPrice !== undefined ? convertedPrice : p.retail_price;
      }));
      return {
        ...country,
        planCount: planCounts.get(country.code)!,
        minPrice
      };
    })
    .sort((a, b) => b.planCount - a.planCount);

  // Get regional plans with pricing
  const regionalPlans = Object.values(REGIONS)
    .filter(region => {
      const count = planCounts.get(region.code) || 0;
      return count > 0;
    })
    .map(region => {
      const regionPlans = plans.filter(p => p.region_code === region.code);
      const minPrice = Math.min(...regionPlans.map(p => {
        const convertedPrice = convertedPrices.get(p.id);
        return convertedPrice !== undefined ? convertedPrice : p.retail_price;
      }));
      return {
        ...region,
        planCount: planCounts.get(region.code)!,
        minPrice
      };
    })
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

  // Generate item list for top destinations (for SEO) - prioritized by traffic
  const topDestinations = [
    { name: 'Japan', url: 'https://getlumbus.com/destinations/jp', position: 1 },
    { name: 'Turkey', url: 'https://getlumbus.com/destinations/tr', position: 2 },
    { name: 'USA', url: 'https://getlumbus.com/destinations/us', position: 3 },
    { name: 'UK', url: 'https://getlumbus.com/destinations/gb', position: 4 },
    { name: 'Thailand', url: 'https://getlumbus.com/destinations/th', position: 5 },
    { name: 'UAE', url: 'https://getlumbus.com/destinations/ae', position: 6 },
    { name: 'Saudi Arabia', url: 'https://getlumbus.com/destinations/sa', position: 7 },
    { name: 'Singapore', url: 'https://getlumbus.com/destinations/sg', position: 8 },
    { name: 'Malaysia', url: 'https://getlumbus.com/destinations/my', position: 9 },
    { name: 'Egypt', url: 'https://getlumbus.com/destinations/eg', position: 10 },
    { name: 'Qatar', url: 'https://getlumbus.com/destinations/qa', position: 11 },
    { name: 'France', url: 'https://getlumbus.com/destinations/fr', position: 12 },
    { name: 'Spain', url: 'https://getlumbus.com/destinations/es', position: 13 },
    { name: 'Italy', url: 'https://getlumbus.com/destinations/it', position: 14 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <ServiceSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://getlumbus.com' },
          { name: 'eSIM Destinations', url: 'https://getlumbus.com/destinations' },
        ]}
      />
      <ItemListSchema 
        items={topDestinations} 
        listType="Place" 
      />
      <FAQSchema faqs={destinationFaqs} />

      <Nav />

      {/* Hero Section */}
      <section className="relative pt-48 sm:pt-40 pb-12 sm:pb-16 px-4 overflow-hidden bg-white">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-mint rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-purple rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          {/* Page Badge */}
          <div className="inline-block mb-6">
            <span className="inline-flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-cyan border-2 border-foreground font-black uppercase text-xs tracking-widest text-foreground shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Browse Destinations
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
              placeholder="Search country or region..."
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
                    <FlagIcon countryCode={userCountry} className="w-8 h-6 sm:w-10 sm:h-7 md:w-12 md:h-8" />
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
                <Link href={`/destinations/${userCountry?.toLowerCase()}`} className="w-full sm:w-auto">
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
                  <svg className="w-6 h-6 sm:w-10 sm:h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="mt-6 font-black uppercase text-lg sm:text-2xl">Loading...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
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

                  // Countries go to SEO-optimized destination pages, regions go to plans
                  const href = activeTab === 'countries'
                    ? `/destinations/${item.code.toLowerCase()}`
                    : `/plans?region=${item.code}`;

                  return (
                    <Link
                      key={item.code}
                      href={href}
                      className="block group"
                      onClick={() => track('Destination Click', { type: activeTab === 'countries' ? 'country' : 'region', code: item.code, name: item.name })}
                    >
                      <Card className={`h-full cursor-pointer border-2 sm:border-3 md:border-4 border-foreground ${bgColor} hover:scale-105 active:scale-105 hover:shadow-2xl active:shadow-2xl transition-all duration-300 overflow-hidden relative touch-manipulation`}>
                        {/* Shine Effect on Hover/Active */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 group-active:bg-white/20 transition-all duration-300 pointer-events-none"></div>

                        <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 text-center flex flex-col justify-between h-full relative z-10">
                          {/* Flag - Large and Prominent */}
                          <div className="mb-2 sm:mb-3 md:mb-4">
                            <div className="flex justify-center mb-2 sm:mb-3 md:mb-4 transform group-hover:scale-110 group-active:scale-110 transition-transform duration-300">
                              <FlagIcon countryCode={item.code} className="w-14 h-10 sm:w-16 sm:h-12 md:w-20 md:h-14 lg:w-24 lg:h-16" />
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
                                {currencySymbol}{item.minPrice.toFixed(2)}
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

      {/* FAQ Section - Static SEO Content */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4">
              eSIM Destinations FAQ
            </h2>
            <p className="text-base sm:text-lg font-bold opacity-70">
              Common questions about buying eSIM for travel
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {destinationFaqs.map((faq, index) => (
              <div key={index} className="bg-light-mint rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-foreground/10">
                <h3 className="font-black text-base sm:text-lg md:text-xl mb-2 sm:mb-3">{faq.q}</h3>
                <p className="text-sm sm:text-base font-medium opacity-80 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Text Content - Static for Google */}
      <section className="py-8 sm:py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-xl sm:text-2xl font-black mb-4">Buy eSIM Online for 150+ Countries</h2>
            <p className="text-sm sm:text-base font-medium opacity-80 mb-4">
              Lumbus offers instant eSIM plans for travelers visiting destinations worldwide. Whether you&apos;re traveling to Japan, exploring Turkey, visiting the USA, or touring Europe, we have affordable data plans that work instantly on your phone.
            </p>
            <p className="text-sm sm:text-base font-medium opacity-80 mb-4">
              Our most popular eSIM destinations include Japan eSIM, Turkey eSIM, USA eSIM, UK eSIM, Thailand eSIM, UAE eSIM, Saudi Arabia eSIM, Singapore eSIM, and Malaysia eSIM. We also offer regional plans covering multiple countries including Europe eSIM (30+ countries), Asia eSIM, and Middle East eSIM packages.
            </p>
            <p className="text-sm sm:text-base font-medium opacity-80">
              All Lumbus eSIM plans come with instant activation, no signup required, and 24/7 support. Stay connected wherever you travel with reliable 4G/5G data. Compare prices across destinations and find the perfect plan for your trip.
            </p>
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
