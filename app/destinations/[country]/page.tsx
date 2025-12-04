'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCountryInfo, COUNTRIES } from '@/lib/countries';
import { Plan } from '@/lib/db';
import { FAQSchema, BreadcrumbSchema, ServiceSchema } from '@/components/structured-data';

// Format data amounts
function formatDataAmount(dataGB: number): string {
  if (dataGB >= 1) return `${dataGB} GB`;
  const dataMB = dataGB * 1024;
  if (dataMB <= 110) return '100 MB';
  if (dataMB <= 250) return '200 MB';
  if (dataMB <= 550) return '500 MB';
  return `${Math.round(dataMB / 50) * 50} MB`;
}

// Generate country-specific FAQs
function generateCountryFAQs(countryName: string) {
  return [
    {
      q: `Does eSIM work in ${countryName}?`,
      a: `Yes! Lumbus eSIMs work throughout ${countryName} with excellent 4G/5G coverage. Our eSIMs connect to local carrier networks, giving you reliable high-speed data for navigation, messaging, and browsing.`
    },
    {
      q: `Is eSIM better than pocket WiFi in ${countryName}?`,
      a: `Yes, eSIM is generally better than pocket WiFi for ${countryName}. eSIMs are more convenient (no device to carry or charge), more reliable (connects directly to networks), and often cheaper. Plus, instant activation means no pickup/return hassles.`
    },
    {
      q: `Is 5GB enough for 7 days in ${countryName}?`,
      a: `For most travelers, 5GB is sufficient for 7 days in ${countryName}. This covers GPS navigation, messaging apps, social media, and light browsing. If you plan to stream videos or make video calls frequently, consider a 10GB+ plan.`
    },
    {
      q: `How do I install my ${countryName} eSIM?`,
      a: `Installing your ${countryName} eSIM is easy: 1) Purchase your plan and receive instant QR code via email, 2) Go to Settings > Cellular > Add eSIM on iPhone or Settings > Network > SIMs on Android, 3) Scan the QR code, 4) Enable data roaming when you arrive in ${countryName}.`
    },
    {
      q: `Can I buy a ${countryName} eSIM at the airport?`,
      a: `While some airports offer physical SIM cards, buying a Lumbus eSIM online before you travel is much better. You get instant delivery, better prices, no language barriers, and you're connected the moment you land in ${countryName}.`
    },
    {
      q: `What networks does the ${countryName} eSIM use?`,
      a: `Our ${countryName} eSIMs connect to major local carriers with the best coverage. Your device automatically selects the strongest network available, ensuring reliable connectivity throughout your trip.`
    }
  ];
}

// Icon components using brand colors
function IconSupport() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </div>
  );
}

function IconCheckout() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  );
}

function IconPrice() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-yellow flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function IconInstall() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function IconFlexible() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-mint flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
  );
}

function IconHome() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan flex items-center justify-center mx-auto mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </div>
  );
}

function IconX() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-destructive/20 flex items-center justify-center mb-4 border-2 border-destructive/30">
      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function IconCheck() {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary flex items-center justify-center mb-4 border-2 border-foreground/10">
      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

export default function CountryDestinationPage() {
  const params = useParams();
  const countryCode = (params.country as string)?.toUpperCase();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const countryInfo = getCountryInfo(countryCode);
  const currentYear = new Date().getFullYear();
  const faqs = generateCountryFAQs(countryInfo.name);

  useEffect(() => {
    loadPlans();
  }, [countryCode]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/plans?region=${countryCode}`);
      const data = await response.json();
      const fetchedPlans = (data.plans || []).sort((a: Plan, b: Plan) => a.data_gb - b.data_gb);
      setPlans(fetchedPlans);

      if (fetchedPlans.length > 0) {
        await convertAllPrices(fetchedPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
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
      // Silent error
    }
  };

  const getPrice = (plan: Plan) => {
    return convertedPrices.get(plan.id) ?? plan.retail_price;
  };

  // Get featured plans (variety of data sizes)
  const featuredPlans = plans.slice(0, 6);

  if (!COUNTRIES[countryCode]) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="pt-40 pb-20 px-4 text-center">
          <h1 className="text-4xl font-black uppercase mb-4">Country Not Found</h1>
          <p className="text-lg font-bold text-foreground/70 mb-8">
            We couldn&apos;t find eSIM plans for this destination.
          </p>
          <Link href="/destinations">
            <Button className="bg-primary text-foreground font-black">
              BROWSE ALL DESTINATIONS
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://getlumbus.com' },
          { name: 'Destinations', url: 'https://getlumbus.com/destinations' },
          { name: `${countryInfo.name} eSIM`, url: `https://getlumbus.com/destinations/${countryCode.toLowerCase()}` },
        ]}
      />
      <ServiceSchema />

      <Nav />

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-12 sm:pb-16 px-4 overflow-hidden bg-mint">
        <div className="absolute top-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 sm:w-[400px] h-64 sm:h-[400px] bg-cyan/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto relative z-10 max-w-5xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-bold text-foreground/60 mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/destinations" className="hover:text-primary transition-colors">Destinations</Link>
            <span>/</span>
            <span className="text-foreground">{countryInfo.name}</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl sm:text-7xl md:text-8xl">{countryInfo.flag}</span>
            <Badge className="bg-primary text-foreground font-black uppercase text-sm px-4 py-2 border-2 border-foreground/10">
              {plans.length} Plans Available
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 leading-tight">
            BEST eSIM FOR {countryInfo.name.toUpperCase()}<br/>
            <span className="text-primary">({currentYear}) – INSTANT DELIVERY</span>
          </h1>

          <p className="text-lg sm:text-xl font-bold text-foreground/80 mb-8 max-w-3xl">
            Get instant mobile data in {countryInfo.name} with Lumbus eSIM.
            No physical SIM needed, no pickup required. Just scan, connect, and go.
            Up to 10x cheaper than roaming with {plans.length > 0 ? `plans starting at ${currencySymbol}${getPrice(plans[0])?.toFixed(2)}` : 'affordable prices'}.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href={`/plans?region=${countryCode}`}>
              <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-xl rounded-xl">
                VIEW ALL {countryInfo.name.toUpperCase()} PLANS
              </Button>
            </Link>
            <Link href="/device">
              <Button variant="outline" className="border-2 border-foreground font-black text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl">
                CHECK COMPATIBILITY
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose eSIM Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-10 text-center">
            WHY CHOOSE AN eSIM FOR {countryInfo.name.toUpperCase()}?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Airport SIM Problems */}
            <Card className="border-3 border-foreground/10 bg-white overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <IconX />
                <h3 className="font-black text-xl sm:text-2xl uppercase mb-6 text-foreground">Airport SIM Problems</h3>
                <ul className="space-y-4">
                  {[
                    'Long queues after a tiring flight',
                    'Language barriers and confusing plans',
                    'Overpriced tourist rates',
                    'Limited shop hours',
                    'Need passport copies and forms'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0"></div>
                      <span className="font-bold text-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Lumbus eSIM Benefits */}
            <Card className="border-3 border-primary bg-mint overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <IconCheck />
                <h3 className="font-black text-xl sm:text-2xl uppercase mb-6 text-foreground">Lumbus eSIM Benefits</h3>
                <ul className="space-y-4">
                  {[
                    'Buy before you fly, activate on landing',
                    'Instant QR code delivery to email',
                    'Up to 10x cheaper than roaming',
                    '24/7 worldwide support',
                    'No paperwork, no queues'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                      <span className="font-bold text-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Comparison Table */}
      <section className="py-16 sm:py-20 px-4 bg-light-mint">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4">
              {countryInfo.name.toUpperCase()} eSIM PLANS
            </h2>
            <p className="text-lg font-bold text-foreground/70">
              Compare plans and find the perfect fit for your trip
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-black uppercase">Loading plans...</p>
            </div>
          ) : featuredPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl font-bold text-foreground/70">No plans available for this destination yet.</p>
              <Link href="/destinations" className="mt-4 inline-block">
                <Button className="bg-primary text-foreground font-black">
                  BROWSE OTHER DESTINATIONS
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-2xl border-2 border-foreground/10 shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-foreground text-white">
                      <th className="p-4 text-left font-black uppercase text-sm">Data</th>
                      <th className="p-4 text-left font-black uppercase text-sm">Validity</th>
                      <th className="p-4 text-left font-black uppercase text-sm">Price</th>
                      <th className="p-4 text-center font-black uppercase text-sm">Tethering</th>
                      <th className="p-4 text-center font-black uppercase text-sm">Speed</th>
                      <th className="p-4 text-center font-black uppercase text-sm">Activation</th>
                      <th className="p-4 text-center font-black uppercase text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {featuredPlans.map((plan, index) => (
                      <tr
                        key={plan.id}
                        className={`border-b border-foreground/10 ${index % 2 === 0 ? 'bg-white' : 'bg-mint/30'} hover:bg-primary/10 transition-colors`}
                      >
                        <td className="p-4">
                          <span className="font-black text-xl">{formatDataAmount(plan.data_gb)}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold">{plan.validity_days} days</span>
                        </td>
                        <td className="p-4">
                          <span className="font-black text-xl text-primary">{currencySymbol}{getPrice(plan).toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mx-auto">
                            <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className="bg-cyan text-foreground font-bold border border-foreground/10">4G/5G</Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className="bg-yellow text-foreground font-bold border border-foreground/10">Instant</Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Link href={`/plans/${countryCode}/${plan.id}`}>
                            <Button size="sm" className="bg-foreground text-white hover:bg-foreground/90 font-black rounded-lg">
                              BUY NOW
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {featuredPlans.map((plan) => (
                  <Card key={plan.id} className="border-2 border-foreground/10 rounded-xl overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-black text-2xl">{formatDataAmount(plan.data_gb)}</div>
                          <div className="font-bold text-foreground/70">{plan.validity_days} days</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-2xl text-primary">{currencySymbol}{getPrice(plan).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className="bg-cyan text-foreground font-bold text-xs border border-foreground/10">4G/5G</Badge>
                        <Badge className="bg-yellow text-foreground font-bold text-xs border border-foreground/10">Instant</Badge>
                        <Badge className="bg-mint text-foreground font-bold text-xs border border-foreground/10">Hotspot</Badge>
                      </div>
                      <Link href={`/plans/${countryCode}/${plan.id}`} className="block">
                        <Button className="w-full bg-foreground text-white hover:bg-foreground/90 font-black rounded-lg">
                          BUY NOW
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {plans.length > 6 && (
                <div className="text-center mt-8">
                  <Link href={`/plans?region=${countryCode}`}>
                    <Button className="bg-primary text-foreground hover:bg-primary/90 font-black text-lg px-8 py-4 rounded-xl">
                      VIEW ALL {plans.length} PLANS
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Why Lumbus Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 text-center">
            WHY CHOOSE LUMBUS OVER<br/>
            <span className="text-primary">AIRALO OR HOLAFLY?</span>
          </h2>
          <p className="text-center text-lg font-bold text-foreground/70 mb-12 max-w-2xl mx-auto">
            We&apos;re not just another eSIM provider. Here&apos;s what makes Lumbus different.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-foreground/10 hover:border-primary transition-colors rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconSupport />
                <h3 className="font-black text-lg uppercase mb-2">24/7 Global Support</h3>
                <p className="font-bold text-foreground/70 text-sm">
                  Real humans available around the clock, worldwide. No chatbots, just genuine help.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 hover:border-primary transition-colors rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconCheckout />
                <h3 className="font-black text-lg uppercase mb-2">Faster Checkout</h3>
                <p className="font-bold text-foreground/70 text-sm">
                  Apple Pay, Google Pay, no account required. Buy in under 60 seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 hover:border-primary transition-colors rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconPrice />
                <h3 className="font-black text-lg uppercase mb-2">Better Prices</h3>
                <p className="font-bold text-foreground/70 text-sm">
                  Often cheaper than competitors with the same quality networks.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 hover:border-primary transition-colors rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconInstall />
                <h3 className="font-black text-lg uppercase mb-2">Smoother Installation</h3>
                <p className="font-bold text-foreground/70 text-sm">
                  One-tap install on iOS 17.4+. Clear step-by-step guides for all devices.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 hover:border-primary transition-colors rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconFlexible />
                <h3 className="font-black text-lg uppercase mb-2">Flexible Plans</h3>
                <p className="font-bold text-foreground/70 text-sm">
                  More data options from 100MB to 20GB. Find the perfect fit for your trip.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 hover:border-primary transition-colors rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconHome />
                <h3 className="font-black text-lg uppercase mb-2">Works At Home Too</h3>
                <p className="font-bold text-foreground/70 text-sm">
                  Use as backup data at home when your main network goes down.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 sm:py-20 px-4 bg-purple/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 text-center">
            {countryInfo.name.toUpperCase()} eSIM FAQs
          </h2>
          <p className="text-center text-lg font-bold text-foreground/70 mb-12">
            Common questions about using eSIM in {countryInfo.name}
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2 border-foreground/10 overflow-hidden rounded-xl bg-white">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-5 sm:p-6 text-left hover:bg-foreground/5 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-base sm:text-lg">{faq.q}</h3>
                    <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <svg
                        className={`w-5 h-5 text-foreground transition-transform ${expandedFaq === index ? 'rotate-45' : ''}`}
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
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-foreground/10 pt-4">
                    <p className="font-bold text-foreground/70">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-primary">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-6 text-foreground">
            READY FOR {countryInfo.name.toUpperCase()}?
          </h2>
          <p className="text-xl font-bold text-foreground/80 mb-8">
            Get instant connectivity. No SIM cards, no queues, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/plans?region=${countryCode}`}>
              <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-lg px-10 py-6 shadow-xl rounded-xl">
                GET YOUR {countryInfo.name.toUpperCase()} eSIM
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
