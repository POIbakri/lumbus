'use client';

import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const regions = [
  {
    name: 'Asia',
    countries: ['Japan', 'South Korea', 'Thailand', 'Singapore', 'Hong Kong', 'Taiwan', 'Indonesia', 'Vietnam', 'Philippines', 'Malaysia'],
    flag: '🌏',
    color: 'bg-cyan'
  },
  {
    name: 'Europe',
    countries: ['France', 'Germany', 'Italy', 'Spain', 'UK', 'Netherlands', 'Switzerland', 'Greece', 'Portugal', 'Austria'],
    flag: '🇪🇺',
    color: 'bg-purple'
  },
  {
    name: 'Americas',
    countries: ['USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Costa Rica', 'Panama'],
    flag: '🌎',
    color: 'bg-yellow'
  },
  {
    name: 'Middle East & Africa',
    countries: ['UAE', 'South Africa', 'Egypt', 'Turkey', 'Israel', 'Saudi Arabia', 'Morocco', 'Kenya', 'Nigeria', 'Jordan'],
    flag: '🌍',
    color: 'bg-mint'
  },
  {
    name: 'Oceania',
    countries: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
    flag: '🦘',
    color: 'bg-cyan'
  }
];

const popularDestinations = [
  { name: 'United States', code: 'US', flag: '🇺🇸', plans: 15 },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', plans: 12 },
  { name: 'United Kingdom', code: 'UK', flag: '🇬🇧', plans: 10 },
  { name: 'France', code: 'FR', flag: '🇫🇷', plans: 10 },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', plans: 8 },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', plans: 9 },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', plans: 10 },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', plans: 10 },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', plans: 10 },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', plans: 7 },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', plans: 8 },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', plans: 12 }
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 bg-mint">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="px-4 sm:px-6 py-2 rounded-full bg-primary/20 border-2 border-primary font-black uppercase text-xs tracking-widest text-foreground">
              🌍 190+ Countries
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
            WHERE WILL YOU<br/>GO NEXT?
          </h1>
          <p className="text-base sm:text-lg md:text-2xl font-bold max-w-3xl mx-auto text-foreground/70">
            Get instant connectivity in 190+ countries worldwide.<br/>
            No SIM card needed. Activate in seconds.
          </p>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              POPULAR DESTINATIONS
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-bold text-foreground/70">
              Our most frequently visited countries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {popularDestinations.map((dest, index) => (
              <Link
                key={dest.code}
                href={`/plans?region=${dest.code}`}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Card className="hover-lift cursor-pointer border-2 border-foreground/5 hover:border-primary transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4">{dest.flag}</div>
                    <h3 className="font-black text-lg mb-2">{dest.name}</h3>
                    <p className="text-sm font-bold text-primary">{dest.plans} plans available</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Coverage */}
      <section className="py-20 px-4 bg-light-mint">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              COVERAGE BY REGION
            </h2>
            <p className="text-xl font-bold text-foreground/70">
              Explore destinations by geographic region
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {regions.map((region, index) => (
              <Card
                key={region.name}
                className={`${region.color} border-2 border-foreground/10 hover-lift animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className="text-6xl mb-4">{region.flag}</div>
                  <h3 className="font-black text-2xl mb-4 uppercase">{region.name}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {region.countries.map((country) => (
                      <div
                        key={country}
                        className="text-sm font-bold text-foreground/70 bg-white/50 px-3 py-2 rounded-lg"
                      >
                        {country}
                      </div>
                    ))}
                  </div>
                  <Link href={`/plans?region=${region.name.toLowerCase()}`}>
                    <Button className="w-full mt-6 bg-foreground text-white hover:bg-foreground/90 font-black text-sm py-3 rounded-lg">
                      VIEW {region.name.toUpperCase()} PLANS
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global Coverage Stats */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
            <div className="p-8 bg-cyan rounded-2xl">
              <div className="text-6xl font-black mb-2">190+</div>
              <div className="text-xl font-black uppercase">Countries</div>
            </div>
            <div className="p-8 bg-yellow rounded-2xl">
              <div className="text-6xl font-black mb-2">700+</div>
              <div className="text-xl font-black uppercase">Networks</div>
            </div>
            <div className="p-8 bg-purple rounded-2xl">
              <div className="text-6xl font-black mb-2">24/7</div>
              <div className="text-xl font-black uppercase">Support</div>
            </div>
            <div className="p-8 bg-mint rounded-2xl">
              <div className="text-6xl font-black mb-2">5G</div>
              <div className="text-xl font-black uppercase">Speeds</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 sm:mb-8 text-foreground leading-tight">
            READY TO GET CONNECTED?
          </h2>
          <p className="text-2xl font-black mb-12 text-foreground/80 max-w-3xl mx-auto">
            Choose your destination and get instant connectivity
          </p>
          <Link href="/plans">
            <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-lg px-16 py-6 rounded-lg hover-lift">
              BROWSE ALL PLANS
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-black text-2xl mb-4">LUMBUS</h3>
              <p className="text-gray-400">Fast eSIMs for travelers worldwide</p>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/destinations" className="block text-gray-400 hover:text-white">
                  Destinations
                </Link>
                <Link href="/device" className="block text-gray-400 hover:text-white">
                  Device Compatibility
                </Link>
                <Link href="/help" className="block text-gray-400 hover:text-white">
                  Help Center
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Powered By</h4>
              <p className="text-gray-400">eSIM Access Network</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Lumbus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
