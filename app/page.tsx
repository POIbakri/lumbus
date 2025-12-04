import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationBanner } from '@/components/location-banner';
import { PopularPlansSection } from '@/components/popular-plans-section';
import { Nav } from '@/components/nav';
import { AuthRecoveryHandler } from '@/components/auth-recovery-handler';
import { PaymentLogos, PaymentLogosCompact } from '@/components/payment-logos';
import { ServiceSchema, HowToSchema } from '@/components/structured-data';
import { AppDownloadBanner } from '@/components/app-download-banner';
import { AppStoreBadges } from '@/components/app-store-badges';
import { SocialMediaLinks } from '@/components/social-media-links';

export default function Home() {

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced SEO with Service and HowTo schemas */}
      <ServiceSchema />
      <HowToSchema />

      {/* Handle password recovery redirects */}
      <AuthRecoveryHandler />

      {/* Navigation */}
      <Nav />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4 overflow-hidden bg-white">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase mb-8 max-w-5xl mx-auto  leading-tight pt-6" style={{animationDelay: '0.1s'}}>
            <span className="inline-block">BUY eSIM ONLINE.</span><br/>
            <span className="inline-block text-primary" style={{animationDelay: '0.3s'}}>WORKS EVERYWHERE.</span>
          </h1>

          {/* Dynamic Value Prop */}
          <div className="mb-8 px-4">
            <div className="inline-block bg-gradient-to-r from-primary via-cyan to-yellow p-1 rounded-xl sm:rounded-2xl shadow-2xl">
              <div className="bg-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight">
                  UP TO <span className="text-primary">10X CHEAPER</span><br className="sm:hidden"/> THAN ROAMING
                </p>
              </div>
            </div>
          </div>

          <p className="text-lg sm:text-xl md:text-2xl font-bold mb-8 max-w-3xl mx-auto  px-4" style={{animationDelay: '0.2s'}}>
            Get connected in <span className="text-primary">150+ countries</span>.<br className="hidden sm:block"/>
            <span className="sm:hidden"> </span>No physical SIM card needed. No signup required. Instant activation.
          </p>

          {/* Home Usage Badge - Visual Element */}
          <div className="mb-8 px-4" style={{animationDelay: '0.25s'}}>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-yellow border-2 border-foreground shadow-lg">
              <span className="text-base sm:text-lg" aria-hidden="true">🏠</span>
              <span className="font-black text-xs sm:text-sm uppercase tracking-wide">Also Works At Home</span>
              <span className="text-base sm:text-lg" aria-hidden="true">📱</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center  px-4" style={{animationDelay: '0.3s'}}>
            <Link href="/destinations" className="group w-full sm:w-auto">
              <Button className="w-full bg-primary text-foreground hover:bg-primary/90 text-lg sm:text-xl px-8 sm:px-14 py-6 sm:py-8 rounded-xl font-black shadow-2xl  ">
                <span className="flex items-center justify-center gap-3">
                  GET STARTED
                  <span className="inline-block group-hover:translate-x-2  ">→</span>
                </span>
              </Button>
            </Link>
            <Link href="/how-it-works" className="group w-full sm:w-auto">
              <Button className="w-full bg-white text-foreground hover:bg-foreground/5 text-lg sm:text-xl px-8 sm:px-14 py-6 sm:py-8 rounded-xl border-4 border-foreground font-black shadow-2xl  ">
                <span className="flex items-center justify-center gap-3">
                  HOW IT WORKS
                  <span className="opacity-0 group-hover:opacity-100  ">↗</span>
                </span>
              </Button>
            </Link>
          </div>

          {/* App Store Badges in Hero */}
          <div className="mt-8 sm:mt-10 md:mt-12 px-4" style={{animationDelay: '0.35s'}}>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm md:text-base font-bold text-foreground/70 uppercase tracking-wide">
                Download Our App
              </p>
              <div className="w-full max-w-sm sm:max-w-md">
                <AppStoreBadges className="justify-center scale-90 sm:scale-100" />
              </div>
            </div>
          </div>

          {/* Device Compatibility Callout */}
          <div className="mt-8 px-4" style={{animationDelay: '0.4s'}}>
            <Link href="/device" className="group inline-block">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-white border-2 border-primary/30 hover:border-primary shadow-lg hover:shadow-xl transition-all">
                <span className="text-xl sm:text-2xl" aria-hidden="true">📱</span>
                <span className="font-black text-xs sm:text-sm uppercase tracking-wide">Check Device Compatibility</span>
                <span className="text-sm sm:text-base group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 items-center opacity-60 " style={{animationDelay: '0.5s'}}>
            <div className="flex items-center gap-2">
              <div className="text-2xl" aria-hidden="true">⭐</div>
              <span className="font-bold text-sm">5.0 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl" aria-hidden="true">✨</div>
              <span className="font-bold text-sm">No Signup Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl" aria-hidden="true">🔒</div>
              <span className="font-bold text-sm">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl" aria-hidden="true">🚀</div>
              <span className="font-bold text-sm">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl" aria-hidden="true">🏠</div>
              <span className="font-bold text-sm">Works At Home</span>
            </div>
          </div>

          {/* Social Media Links in Hero */}
          <div className="mt-10 sm:mt-12" style={{animationDelay: '0.55s'}}>
            <p className="text-xs sm:text-sm font-bold text-foreground/60 uppercase tracking-wide mb-3">
              Follow Us
            </p>
            <SocialMediaLinks variant="hero" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-4 bg-light-mint relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 text-center max-w-7xl mx-auto">
            <div className="p-8 sm:p-10 md:p-12 bg-yellow rounded-3xl border-2 border-foreground/5  shadow-xl ">
              <div className="text-6xl sm:text-7xl md:text-8xl font-black mb-4 sm:mb-6 text-foreground">150+</div>
              <div className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">Countries</div>
              <div className="text-sm sm:text-base font-bold mt-3 text-foreground/70">Global Coverage ✓</div>
            </div>
            <div className="p-8 sm:p-10 md:p-12 bg-cyan rounded-3xl border-2 border-foreground/5  shadow-xl " style={{animationDelay: '0.1s'}}>
              <div className="text-6xl sm:text-7xl md:text-8xl font-black mb-4 sm:mb-6 text-foreground">5 MIN</div>
              <div className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">Setup Time</div>
              <div className="text-sm sm:text-base font-bold mt-3 text-foreground/70">Super Fast ⚡</div>
            </div>
            <div className="p-8 sm:p-10 md:p-12 bg-purple rounded-3xl border-2 border-foreground/5  shadow-xl  sm:col-span-2 md:col-span-1" style={{animationDelay: '0.2s'}}>
              <div className="text-6xl sm:text-7xl md:text-8xl font-black mb-4 sm:mb-6 text-foreground">24/7</div>
              <div className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">Support</div>
              <div className="text-sm sm:text-base font-bold mt-3 text-foreground/70">Always Here 💬</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32 px-4 bg-white overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 ">
            <div className="inline-block mb-4">
              <span className="px-6 py-2 rounded-full bg-foreground/5 border-2 border-foreground/10 font-black uppercase text-xs tracking-widest">
                Simple Process
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              HOW IT WORKS
            </h2>
            <p className="text-xl font-bold opacity-70">Three steps to global connectivity</p>
          </div>

          {/* Payment Methods & Trust Seals */}
          <div className="mb-16">
            <PaymentLogos />
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-6xl mx-auto">
            <div className="group text-center " style={{animationDelay: '0.1s'}}>
              <div className="relative inline-block mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-primary rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black mx-auto shadow-2xl ">
                  1
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase mb-3 sm:mb-4 tracking-tight">PICK YOUR PLAN</h3>
              <p className="text-base sm:text-lg font-bold opacity-70">
                Choose the perfect data plan for your destination
              </p>
            </div>

            <div className="group text-center " style={{animationDelay: '0.2s'}}>
              <div className="relative inline-block mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-yellow rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black mx-auto shadow-2xl ">
                  2
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase mb-3 sm:mb-4 tracking-tight">PAY INSTANTLY</h3>
              <p className="text-base sm:text-lg font-bold opacity-70">
                Checkout with Apple Pay, Google Pay, or card
              </p>
            </div>

            <div className="group text-center  sm:col-span-2 md:col-span-1" style={{animationDelay: '0.3s'}}>
              <div className="relative inline-block mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-cyan rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black mx-auto shadow-2xl ">
                  3
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase mb-3 sm:mb-4 tracking-tight">GET CONNECTED</h3>
              <p className="text-base sm:text-lg font-bold opacity-70">
                Scan QR code or tap to activate. Done in seconds.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/how-it-works">
              <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-lg px-12 py-6 rounded-xl ">
                LEARN MORE
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Plans */}
      <section className="relative py-32 px-4 bg-mint">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-6 py-2 rounded-full bg-primary/20 border-2 border-primary font-black uppercase text-xs tracking-widest text-foreground">
                <span aria-hidden="true">⚡</span> Quick Start
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              GET CONNECTED NOW
            </h2>
          </div>

          {/* Location-Based Banner */}
          <div className="max-w-4xl mx-auto mb-12">
            <LocationBanner />
          </div>

          {/* Location-Based Plans */}
          <PopularPlansSection />
        </div>
      </section>

      {/* Comparison Table */}
      <section className="relative py-32 px-4 bg-white overflow-hidden">
        <div className="container mx-auto relative z-10 max-w-5xl">
          <div className="text-center mb-12 sm:mb-16 ">
            <div className="inline-block mb-4">
              <span className="px-4 sm:px-6 py-2 rounded-full bg-primary/10 border-2 border-primary font-black uppercase text-xs tracking-widest text-foreground">
                THE DIFFERENCE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-3 sm:mb-4 leading-tight px-2">
              LUMBUS VS<br className="sm:hidden"/> ROAMING
            </h2>
            <p className="text-base sm:text-xl font-bold opacity-70 mb-3 sm:mb-4 px-4">See why 10,000+ travelers choose Lumbus</p>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary uppercase px-2">
              UP TO 10X CHEAPER
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-foreground shadow-2xl">
            {/* Header */}
            <div className="grid grid-cols-3 bg-foreground text-white">
              <div className="p-2 sm:p-4 md:p-6"></div>
              <div className="p-2 sm:p-4 md:p-6 text-center border-l-2 border-white/20 bg-primary text-foreground">
                <div className="text-base sm:text-xl md:text-2xl font-black uppercase">LUMBUS</div>
              </div>
              <div className="p-2 sm:p-4 md:p-6 text-center border-l-2 border-white/20">
                <div className="text-base sm:text-xl md:text-2xl font-black uppercase opacity-70">ROAMING</div>
              </div>
            </div>

            {/* Row 1: Price */}
            <div className="grid grid-cols-3 bg-mint border-t-2 border-foreground/10">
              <div className="p-3 sm:p-4 md:p-6 flex items-center">
                <div>
                  <div className="font-black text-sm sm:text-lg md:text-xl uppercase mb-0.5 sm:mb-1">Price</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70 hidden sm:block">1GB data</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center bg-primary">
                <div className="text-base sm:text-xl md:text-2xl font-black text-foreground">LOW COST</div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-base sm:text-xl md:text-2xl font-black opacity-40">EXPENSIVE</div>
              </div>
            </div>

            {/* Row 2: Setup */}
            <div className="grid grid-cols-3 bg-white border-t-2 border-foreground/10">
              <div className="p-3 sm:p-4 md:p-6 flex items-center">
                <div>
                  <div className="font-black text-sm sm:text-lg md:text-xl uppercase mb-0.5 sm:mb-1">Setup</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70 hidden sm:block">Time to activate</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-base sm:text-2xl md:text-3xl font-black text-primary">5 MIN</div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black opacity-40">Hours</div>
              </div>
            </div>

            {/* Row 3: Coverage */}
            <div className="grid grid-cols-3 bg-cyan border-t-2 border-foreground/10">
              <div className="p-3 sm:p-4 md:p-6 flex items-center">
                <div>
                  <div className="font-black text-sm sm:text-lg md:text-xl uppercase mb-0.5 sm:mb-1">Coverage</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70 hidden sm:block">Countries</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-lg sm:text-2xl md:text-3xl font-black">150+</div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black opacity-40">Limited</div>
              </div>
            </div>

            {/* Row 4: Control */}
            <div className="grid grid-cols-3 bg-white border-t-2 border-foreground/10">
              <div className="p-3 sm:p-4 md:p-6 flex items-center">
                <div>
                  <div className="font-black text-sm sm:text-lg md:text-xl uppercase mb-0.5 sm:mb-1">Control</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70 hidden sm:block">Bill surprises</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black text-primary">PREPAID</div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black opacity-40">SHOCK</div>
              </div>
            </div>

            {/* Row 5: Speed */}
            <div className="grid grid-cols-3 bg-yellow border-t-2 border-foreground/10">
              <div className="p-3 sm:p-4 md:p-6 flex items-center">
                <div>
                  <div className="font-black text-sm sm:text-lg md:text-xl uppercase mb-0.5 sm:mb-1">Speed</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70 hidden sm:block">Network quality</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-base sm:text-xl md:text-2xl font-black">4G/5G</div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black opacity-40">Throttled</div>
              </div>
            </div>

            {/* Row 6: Hotspot */}
            <div className="grid grid-cols-3 bg-white border-t-2 border-foreground/10">
              <div className="p-3 sm:p-4 md:p-6 flex items-center">
                <div>
                  <div className="font-black text-sm sm:text-lg md:text-xl uppercase mb-0.5 sm:mb-1">Hotspot</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70 hidden sm:block">Share data</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black text-primary">YES ✓</div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 text-center border-l-2 border-foreground/10 flex items-center justify-center">
                <div className="text-sm sm:text-xl md:text-2xl font-black opacity-40">EXTRA FEES</div>
              </div>
            </div>
          </div>

          {/* CTA Below Comparison */}
          <div className="text-center mt-8 sm:mt-12 ">
            <Link href="/destinations" className="w-full sm:w-auto inline-block">
              <Button className="w-full sm:w-auto bg-primary text-foreground hover:bg-primary/90 font-black text-base sm:text-xl px-8 sm:px-16 py-6 sm:py-8 rounded-xl shadow-2xl">
                START SAVING NOW
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 px-4 bg-light-mint overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 ">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              WHAT YOU GET
            </h2>
            <p className="text-xl font-bold opacity-70">Perfect for travel and emergency data at home</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="bg-mint border-2 border-foreground/5 rounded-3xl overflow-hidden">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
                  <svg className="w-10 h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">INSTANT</h3>
                <p className="font-bold opacity-70">Activate in seconds, not hours</p>
              </CardContent>
            </Card>

            <Card className="bg-cyan border-2 border-foreground/5 rounded-3xl overflow-hidden" style={{animationDelay: '0.1s'}}>
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">GLOBAL</h3>
                <p className="font-bold opacity-70">Works abroad & at home</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow border-2 border-foreground/5 rounded-3xl overflow-hidden" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-cyan flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
                  <svg className="w-10 h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">FLEXIBLE</h3>
                <p className="font-bold opacity-70">Use as backup data anytime</p>
              </CardContent>
            </Card>

            <Card className="bg-purple border-2 border-foreground/5 rounded-3xl overflow-hidden" style={{animationDelay: '0.3s'}}>
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-yellow flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
                  <svg className="w-10 h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">SECURE</h3>
                <p className="font-bold opacity-70">Bank-level encryption</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Referral Highlight Section - MOVED BEFORE TESTIMONIALS */}
      <section className="relative py-20 sm:py-32 px-4 bg-gradient-to-br from-yellow via-cyan to-purple overflow-hidden border-t-4 border-b-4 border-foreground">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 md:p-12 rounded-3xl border-4 border-foreground shadow-2xl">
              <div className="inline-block mb-4 sm:mb-6">
                <span className="px-4 sm:px-6 py-2 rounded-full bg-yellow border-2 border-foreground font-black uppercase text-xs tracking-widest text-foreground">
                  <span aria-hidden="true">🎁</span> REFER & EARN
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 sm:mb-6 text-foreground leading-tight px-2">
                GIVE 10% OFF<br/>GET 1GB FREE
              </h2>

              <p className="text-base sm:text-lg md:text-xl font-bold mb-6 sm:mb-8 text-foreground/80 max-w-2xl mx-auto px-4">
                Share Lumbus with friends and family. They save money, you get free data!
              </p>

              {/* TODO: Implement Gamification Backend - See docs/referral-gamification-implementation.md */}
              {/*
              COMMENTED OUT - NO BACKEND SUPPORT YET

              Gamification Elements:
              - Community Stats (Total GB earned)
              - Leaderboard (Top referrers)
              - Badges System (Bronze/Silver/Gold/Platinum)
              - Milestones Tracking

              These require:
              1. Database tables for badges and milestones
              2. API endpoints for stats aggregation
              3. Dashboard integration
              4. Real-time tracking

              See implementation guide: docs/referral-gamification-implementation.md
              */}

              {/*
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-mint to-cyan p-4 sm:p-6 rounded-2xl border-2 border-primary/30 shadow-lg">
                  <div className="text-4xl sm:text-5xl mb-2">🌟</div>
                  <div className="text-3xl sm:text-4xl font-black text-primary mb-2 animate-pulse">
                    1,234
                  </div>
                  <div className="text-xs sm:text-sm font-black uppercase text-muted-foreground">
                    GB Earned By Community
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow to-orange-300 p-4 sm:p-6 rounded-2xl border-2 border-secondary/30 shadow-lg">
                  <div className="text-4xl sm:text-5xl mb-2">🏆</div>
                  <div className="text-xl sm:text-2xl font-black text-foreground mb-2">
                    TOP REFERRER
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground/70">
                    User #8472 - 127 Referrals
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple to-primary p-4 sm:p-6 rounded-2xl border-2 border-accent/30 shadow-lg">
                  <div className="text-4xl sm:text-5xl mb-2">💎</div>
                  <div className="text-xl sm:text-2xl font-black text-foreground mb-2">
                    UNLOCK BADGES
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground/70">
                    Bronze → Silver → Gold → Platinum
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 via-cyan/10 to-yellow/10 p-4 sm:p-6 rounded-2xl border-2 border-primary/20 mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-black uppercase mb-4 text-foreground">
                  🎯 REFERRAL MILESTONES
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-3 rounded-xl border-2 border-orange-400/30 text-center">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="text-xs font-black uppercase text-muted-foreground mb-1">Bronze</div>
                    <div className="text-sm font-bold text-foreground">1 Friend</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border-2 border-gray-400/30 text-center">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="text-xs font-black uppercase text-muted-foreground mb-1">Silver</div>
                    <div className="text-sm font-bold text-foreground">5 Friends</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border-2 border-yellow/50 text-center">
                    <div className="text-2xl mb-1">🥇</div>
                    <div className="text-xs font-black uppercase text-muted-foreground mb-1">Gold</div>
                    <div className="text-sm font-bold text-foreground">10 Friends</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border-2 border-cyan/50 text-center">
                    <div className="text-2xl mb-1">💎</div>
                    <div className="text-xs font-black uppercase text-muted-foreground mb-1">Platinum</div>
                    <div className="text-sm font-bold text-foreground">25 Friends</div>
                  </div>
                </div>
              </div>
              */}

              {/* How It Works */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6 sm:mb-8 text-left">
                <div className="bg-mint p-4 rounded-xl border-2 border-primary/20">
                  <div className="text-3xl mb-2">1️⃣</div>
                  <div className="text-sm font-black uppercase mb-2">SHARE YOUR LINK</div>
                  <div className="text-xs font-bold text-foreground/70">
                    Get your unique referral link from your dashboard
                  </div>
                </div>
                <div className="bg-cyan p-4 rounded-xl border-2 border-primary/20">
                  <div className="text-3xl mb-2">2️⃣</div>
                  <div className="text-sm font-black uppercase mb-2">FRIEND PURCHASES</div>
                  <div className="text-xs font-bold text-foreground/70">
                    They get 10% off their first eSIM order
                  </div>
                </div>
                <div className="bg-yellow p-4 rounded-xl border-2 border-secondary/20">
                  <div className="text-3xl mb-2">3️⃣</div>
                  <div className="text-sm font-black uppercase mb-2">YOU & FRIEND GET 1GB FREE</div>
                  <div className="text-xs font-bold text-foreground/70">
                    Data credited instantly to your account
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center mb-6 sm:mb-8">
                <Link href="/affiliate-program" className="w-full sm:w-auto">
                  <Button className="w-full bg-foreground text-white hover:bg-foreground/90 text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 rounded-xl shadow-xl font-black border-2 border-foreground">
                    LEARN MORE
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full bg-primary text-foreground border-4 border-foreground hover:bg-primary/90 hover:scale-105 transition-transform text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 rounded-xl font-black shadow-xl">
                    GET YOUR LINK
                  </Button>
                </Link>
              </div>

              {/* Bottom Banner */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow via-cyan to-yellow border-2 border-foreground px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg">
                <span className="text-xl sm:text-2xl" aria-hidden="true">🚀</span>
                <span className="font-black text-xs sm:text-sm md:text-base text-foreground">UNLIMITED REFERRALS = UNLIMITED DATA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 px-4 bg-white overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 ">
            <div className="inline-block mb-4">
              <span className="px-6 py-2 rounded-full bg-foreground/5 border-2 border-foreground/10 font-black uppercase text-xs tracking-widest">
                <span aria-hidden="true">⭐</span> Trusted by Travelers
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              WHAT TRAVELERS SAY
            </h2>
            <p className="text-xl font-bold opacity-70">Join 10,000+ happy customers worldwide</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-mint p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-foreground/10 ">
              <div className="flex gap-1 mb-4" aria-label="5 star rating">
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
              </div>
              <p className="text-base sm:text-lg font-bold mb-5 sm:mb-6 leading-relaxed">
                "Saved me hundreds on my Europe trip! Setup was instant and worked perfectly in every country."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center font-black text-lg sm:text-xl">
                  S
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base">Sarah M.</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70">London, UK</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-cyan p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-foreground/10 " style={{animationDelay: '0.1s'}}>
              <div className="flex gap-1 mb-4" aria-label="5 star rating">
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
              </div>
              <p className="text-base sm:text-lg font-bold mb-5 sm:mb-6 leading-relaxed">
                "Best travel purchase ever. No more hunting for WiFi or paying crazy roaming fees!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow flex items-center justify-center font-black text-lg sm:text-xl">
                  J
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base">James T.</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70">Manchester, UK</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-yellow p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-foreground/10  sm:col-span-2 md:col-span-1" style={{animationDelay: '0.2s'}}>
              <div className="flex gap-1 mb-4" aria-label="5 star rating">
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
              </div>
              <p className="text-base sm:text-lg font-bold mb-5 sm:mb-6 leading-relaxed">
                "So easy! Bought before my flight, activated when I landed. Connected in seconds!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple flex items-center justify-center font-black text-lg sm:text-xl">
                  E
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base">Emma L.</div>
                  <div className="text-xs sm:text-sm font-bold opacity-70">Birmingham, UK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 sm:py-40 px-4 bg-gradient-to-br from-primary via-cyan to-purple overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <div className="">
            <div className="inline-block mb-6 sm:mb-8">
              <span className="px-4 sm:px-6 py-2 rounded-full bg-white/20 border-2 border-foreground font-black uppercase text-xs tracking-widest text-foreground backdrop-blur-sm">
                <span aria-hidden="true">🚀</span> JOIN 10,000+ HAPPY TRAVELERS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 text-foreground leading-tight">
              READY TO GET<br/>CONNECTED?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl font-bold mb-12 sm:mb-16 text-foreground/80 max-w-3xl mx-auto px-4">
              Join thousands of travelers staying connected worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center px-4">
              <Link href="/destinations" className="w-full sm:w-auto">
                <Button className="w-full bg-foreground text-white hover:bg-foreground/90 text-base sm:text-lg md:text-xl px-10 sm:px-16 py-6 sm:py-8 rounded-xl shadow-2xl font-black border-2 border-foreground">
                  <span className="relative z-10">BROWSE DESTINATIONS</span>
                </Button>
              </Link>
              <Link href="/help" className="w-full sm:w-auto">
                <Button className="w-full bg-white text-foreground border-4 border-foreground hover:bg-white/90 text-base sm:text-lg md:text-xl px-10 sm:px-16 py-6 sm:py-8 rounded-xl font-black shadow-2xl">
                  GET HELP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
