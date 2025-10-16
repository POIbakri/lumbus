'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCountriesByContinent, getContinentEmoji, searchCountries, REGIONS, type CountryInfo, type RegionInfo } from '@/lib/countries';
import { Plan } from '@/lib/db';

export default function DestinationsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const countriesByContinent = getCountriesByContinent();
  const continents = Object.keys(countriesByContinent).filter(c => c !== 'Multi-Country');

  useEffect(() => {
    loadPlans();
  }, []);

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

  // Get countries to display
  let displayCountries: CountryInfo[] = [];
  if (searchQuery) {
    displayCountries = searchCountries(searchQuery);
  } else if (selectedContinent) {
    displayCountries = countriesByContinent[selectedContinent] || [];
  } else {
    // Show all countries from all continents
    displayCountries = Object.values(countriesByContinent).flat();
  }

  // Filter only countries that have plans
  const countriesWithPlans = displayCountries.filter(country =>
    planCounts.has(country.code) && planCounts.get(country.code)! > 0
  );

  // Get popular destinations (actual popular tourist destinations)
  const popularDestinationCodes = [
    'TR', // Turkey
    'TH', // Thailand
    'US', // USA
    'GB', // UK
    'FR', // France
    'ES', // Spain
    'IT', // Italy
    'DE', // Germany
    'JP', // Japan
    'AU', // Australia
    'CA', // Canada
    'MX', // Mexico
  ];

  const popularDestinations = popularDestinationCodes
    .map(code => {
      const countries = Object.values(countriesByContinent).flat();
      const country = countries.find(c => c.code === code);
      const count = planCounts.get(code) || 0;
      return country && count > 0 ? { ...country, planCount: count } : null;
    })
    .filter((c): c is (CountryInfo & { planCount: number }) => c !== null);

  // Get regional plans with available plans
  const regionalPlans = Object.values(REGIONS)
    .map(region => {
      const count = planCounts.get(region.code) || 0;
      return count > 0 ? { ...region, planCount: count } : null;
    })
    .filter((r): r is (RegionInfo & { planCount: number }) => r !== null);

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 bg-mint relative overflow-hidden">
        <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-cyan/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-block mb-3 sm:mb-4 md:mb-6 animate-fade-in">
            <span className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-full bg-primary/20 border-2 border-primary font-black uppercase text-xs tracking-widest text-foreground">
              🌍 {countriesWithPlans.length}+ Countries
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase mb-3 sm:mb-4 md:mb-6 leading-tight animate-slide-up px-2">
            WHERE WILL YOU<br/>GO NEXT?
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold max-w-3xl mx-auto text-foreground/70 animate-slide-up px-2" style={{animationDelay: '0.1s'}}>
            Get instant connectivity in {countriesWithPlans.length}+ countries worldwide.<br className="hidden sm:inline"/>
            <span className="sm:hidden"> </span>No SIM card needed. Activate in seconds.
          </p>

          {/* Search Bar */}
          <div className="mt-6 sm:mt-8 max-w-2xl mx-auto animate-slide-up px-2" style={{animationDelay: '0.2s'}}>
            <Input
              type="text"
              placeholder="🔍 Search for a country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold border-2 sm:border-4 border-primary rounded-xl sm:rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-8 sm:py-12 md:py-20 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black uppercase mb-3 sm:mb-4 leading-tight px-2">
              POPULAR DESTINATIONS
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground/70 px-2">
              Our most frequently visited countries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularDestinations.map((dest, index) => (
              <Link
                key={dest.code}
                href={`/plans?region=${dest.code}`}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Card className="hover-lift cursor-pointer border-4 border-foreground/5 hover:border-primary transition-all duration-300 bg-mint">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{dest.flag}</div>
                    <h3 className="font-black text-base sm:text-lg mb-2">{dest.name}</h3>
                    <Badge className="bg-primary text-white font-black text-xs">
                      {dest.planCount} plans
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Plans */}
      {regionalPlans.length > 0 && (
        <section className="py-8 sm:py-12 md:py-20 px-3 sm:px-4 bg-white">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black uppercase mb-3 sm:mb-4 leading-tight px-2">
                REGIONAL PLANS
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground/70 px-2">
                Multi-country packages for your travels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {regionalPlans.map((region, index) => (
                <Link
                  key={region.code}
                  href={`/plans?region=${region.code}`}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Card className="hover-lift cursor-pointer border-2 sm:border-4 border-foreground/5 hover:border-primary transition-all duration-300 bg-cyan">
                    <CardContent className="p-4 sm:p-6 md:p-8">
                      <div className="text-center">
                        <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">{region.flag}</div>
                        <h3 className="font-black text-base sm:text-lg md:text-xl mb-2">{region.name}</h3>
                        <p className="text-xs sm:text-sm font-bold text-foreground/70 mb-3">{region.description}</p>
                        <Badge className="bg-primary text-white font-black text-xs">
                          {region.planCount} plans
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Continent Filter */}
      {!searchQuery && (
        <section className="py-6 sm:py-8 md:py-10 px-3 sm:px-4 bg-light-mint">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <Button
                onClick={() => setSelectedContinent(null)}
                variant={selectedContinent === null ? 'default' : 'outline'}
                className="font-black text-xs sm:text-sm"
              >
                🌐 ALL CONTINENTS
              </Button>
              {continents.map(continent => (
                <Button
                  key={continent}
                  onClick={() => setSelectedContinent(continent)}
                  variant={selectedContinent === continent ? 'default' : 'outline'}
                  className="font-black text-xs sm:text-sm"
                >
                  {getContinentEmoji(continent)} {continent}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Countries by Continent */}
      <section className="py-8 sm:py-12 md:py-20 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {searchQuery ? (
            <>
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-3 sm:mb-4 px-2">
                  SEARCH RESULTS
                </h2>
                <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/70 px-2">
                  {countriesWithPlans.length} countries found for "{searchQuery}"
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {countriesWithPlans.map((country, index) => (
                  <Link
                    key={country.code}
                    href={`/plans?region=${country.code}`}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <Card className="hover-lift cursor-pointer border-2 border-foreground/5 hover:border-primary transition-all duration-300">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <div className="text-3xl sm:text-4xl mb-2">{country.flag}</div>
                        <div className="font-black text-xs sm:text-sm mb-1">{country.name}</div>
                        <Badge className="bg-primary/20 text-foreground text-xs">
                          {planCounts.get(country.code)} plans
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : selectedContinent ? (
            <>
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-3 sm:mb-4 px-2">
                  {getContinentEmoji(selectedContinent)} {selectedContinent}
                </h2>
                <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/70 px-2">
                  {countriesWithPlans.length} countries available
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {countriesWithPlans.map((country, index) => (
                  <Link
                    key={country.code}
                    href={`/plans?region=${country.code}`}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <Card className="hover-lift cursor-pointer border-2 border-foreground/5 hover:border-primary transition-all duration-300">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <div className="text-3xl sm:text-4xl mb-2">{country.flag}</div>
                        <div className="font-black text-xs sm:text-sm mb-1">{country.name}</div>
                        <Badge className="bg-primary/20 text-foreground text-xs">
                          {planCounts.get(country.code)} plans
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              {continents.map(continent => {
                const continentCountries = countriesByContinent[continent].filter(country =>
                  planCounts.has(country.code) && planCounts.get(country.code)! > 0
                );

                if (continentCountries.length === 0) return null;

                return (
                  <div key={continent} className="mb-12 sm:mb-16">
                    <div className="mb-6 sm:mb-8">
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-2 flex items-center gap-2 sm:gap-3 px-2">
                        <span>{getContinentEmoji(continent)}</span>
                        <span>{continent}</span>
                      </h2>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-foreground/70 px-2">
                        {continentCountries.length} countries available
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                      {continentCountries.map((country, index) => (
                        <Link
                          key={country.code}
                          href={`/plans?region=${country.code}`}
                          className="animate-slide-up"
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <Card className="hover-lift cursor-pointer border-2 border-foreground/5 hover:border-primary transition-all duration-300">
                            <CardContent className="p-3 sm:p-4 text-center">
                              <div className="text-3xl sm:text-4xl mb-2">{country.flag}</div>
                              <div className="font-black text-xs sm:text-sm mb-1 truncate" title={country.name}>
                                {country.name}
                              </div>
                              <Badge className="bg-primary/20 text-foreground text-xs">
                                {planCounts.get(country.code)} plans
                              </Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>

      {/* Global Coverage Stats */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-light-mint">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-center">
            <div className="p-4 sm:p-6 md:p-8 bg-cyan rounded-xl sm:rounded-2xl border-2 sm:border-4 border-primary shadow-xl animate-slide-up">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">{countriesWithPlans.length}+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Countries</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-yellow rounded-xl sm:rounded-2xl border-2 sm:border-4 border-secondary shadow-xl animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">{plans.length}+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Plans</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-purple rounded-xl sm:rounded-2xl border-2 sm:border-4 border-accent shadow-xl animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1 sm:mb-2">24/7</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-xl font-black uppercase">Support</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-mint rounded-xl sm:rounded-2xl border-2 sm:border-4 border-primary shadow-xl animate-slide-up" style={{animationDelay: '0.3s'}}>
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
            <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-12 sm:px-16 py-5 sm:py-6 rounded-xl hover-lift shadow-2xl">
              BROWSE ALL PLANS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
