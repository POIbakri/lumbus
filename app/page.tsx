import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationBanner } from '@/components/location-banner';
import { PopularPlansSection } from '@/components/popular-plans-section';
import { Nav } from '@/components/nav';
import { AuthRecoveryHandler } from '@/components/auth-recovery-handler';

export default function Home() {

  return (
    <div className="min-h-screen bg-white">
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
            <span className="inline-block">eSIMs THAT JUST WORK.</span><br/>
            <span className="inline-block text-primary" style={{animationDelay: '0.3s'}}>EVERYWHERE.</span>
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
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-yellow/80 via-mint/80 to-cyan/80 border-2 border-foreground/10 shadow-lg">
              <span className="text-base sm:text-lg">🏠</span>
              <span className="font-black text-xs sm:text-sm uppercase tracking-wide">Also Works At Home</span>
              <span className="text-base sm:text-lg">📱</span>
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

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 items-center opacity-60 " style={{animationDelay: '0.5s'}}>
            <div className="flex items-center gap-2">
              <div className="text-2xl">⭐</div>
              <span className="font-bold text-sm">5.0 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">✨</div>
              <span className="font-bold text-sm">No Signup Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">🔒</div>
              <span className="font-bold text-sm">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">🚀</div>
              <span className="font-bold text-sm">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">🏠</div>
              <span className="font-bold text-sm">Works At Home</span>
            </div>
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
                ⚡ Quick Start
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
            <Link href="/plans" className="w-full sm:w-auto inline-block">
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
            <Card className="bg-mint border-2 border-foreground/5 rounded-3xl   overflow-hidden">
              <CardContent className="p-10 text-center">
                <div className="text-6xl mb-6">⚡</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">INSTANT</h3>
                <p className="font-bold opacity-70">Activate in seconds, not hours</p>
              </CardContent>
            </Card>

            <Card className="bg-cyan border-2 border-foreground/5 rounded-3xl   overflow-hidden" style={{animationDelay: '0.1s'}}>
              <CardContent className="p-10 text-center">
                <div className="text-6xl mb-6">🌍</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">GLOBAL</h3>
                <p className="font-bold opacity-70">Works abroad & at home</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow border-2 border-foreground/5 rounded-3xl   overflow-hidden" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-10 text-center">
                <div className="text-6xl mb-6">💳</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">FLEXIBLE</h3>
                <p className="font-bold opacity-70">Use as backup data anytime</p>
              </CardContent>
            </Card>

            <Card className="bg-purple border-2 border-foreground/5 rounded-3xl   overflow-hidden" style={{animationDelay: '0.3s'}}>
              <CardContent className="p-10 text-center">
                <div className="text-6xl mb-6">🔒</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">SECURE</h3>
                <p className="font-bold opacity-70">Bank-level encryption</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 px-4 bg-white overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 ">
            <div className="inline-block mb-4">
              <span className="px-6 py-2 rounded-full bg-foreground/5 border-2 border-foreground/10 font-black uppercase text-xs tracking-widest">
                ⭐ Trusted by Travelers
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
              <div className="flex gap-1 mb-4">
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
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
              <div className="flex gap-1 mb-4">
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
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
              <div className="flex gap-1 mb-4">
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-xl sm:text-2xl">⭐</span>
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

      {/* Referral Highlight Section */}
      <section className="relative py-20 sm:py-32 px-4 bg-gradient-to-br from-primary via-cyan to-yellow overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto ">
            <div className="inline-block mb-4 sm:mb-6">
              <span className="px-4 sm:px-6 py-2 rounded-full bg-foreground/10 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground backdrop-blur-sm">
                🎁 REFER & EARN
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase mb-4 sm:mb-6 text-foreground leading-tight px-2">
              GIVE 10% OFF<br/>GET 1GB FREE
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl font-bold mb-6 sm:mb-8 text-foreground/80 max-w-2xl mx-auto px-4">
              Share Lumbus with friends and family. They save money, you get free data!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center mb-6 sm:mb-8">
              <Link href="/affiliate-program" className="w-full sm:w-auto">
                <Button className="w-full bg-foreground text-white hover:bg-foreground/90 text-base sm:text-lg md:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-2xl font-black">
                  LEARN MORE
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full bg-white text-foreground border-4 border-white hover:bg-white/90 text-base sm:text-lg md:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl font-black">
                  GET YOUR LINK
                </Button>
              </Link>
            </div>
            <div className="inline-flex items-center gap-2 bg-foreground/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full mx-4">
              <span className="text-xl sm:text-2xl">🚀</span>
              <span className="font-black text-xs sm:text-sm md:text-base text-foreground">UNLIMITED REFERRALS = UNLIMITED DATA</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-40 px-4 bg-primary overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <div className="">
            <div className="inline-block mb-8">
              <span className="px-6 py-2 rounded-full bg-foreground/10 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground backdrop-blur-sm">
                🚀 Join 10,000+ Happy Travelers
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 sm:mb-8 text-foreground leading-tight">
              READY TO GET<br/>CONNECTED?
            </h2>
            <p className="text-3xl font-black mb-16 text-foreground/80 max-w-3xl mx-auto">
              Join thousands of travelers staying connected worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center px-4">
              <Link href="/plans" className="w-full sm:w-auto">
                <Button className="w-full bg-foreground text-white hover:bg-foreground/90  text-lg sm:text-xl px-10 sm:px-16 py-6 sm:py-8 rounded-xl shadow-2xl font-black ">
                  <span className="relative z-10">BROWSE PLANS</span>
                </Button>
              </Link>
              <Link href="/help" className="w-full sm:w-auto">
                <Button className="w-full bg-white text-foreground border-4 border-white hover:bg-white/90  text-lg sm:text-xl px-10 sm:px-16 py-6 sm:py-8 rounded-xl font-black ">
                  GET HELP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-black text-2xl mb-4">LUMBUS</h3>
              <p className="text-gray-400">Fast eSIMs for travelers worldwide</p>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Pages</h4>
              <div className="space-y-2">
                <Link href="/destinations" className="block text-gray-400 hover:text-white">
                  Destinations
                </Link>
                <Link href="/device" className="block text-gray-400 hover:text-white">
                  Device
                </Link>
                <Link href="/how-it-works" className="block text-gray-400 hover:text-white">
                  How it works
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-gray-400 hover:text-white">
                  Help Center
                </Link>
                <Link href="/plans" className="block text-gray-400 hover:text-white">
                  Plans
                </Link>
                <Link href="/support" className="block text-gray-400 hover:text-white">
                  Contact Us
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Partners</h4>
              <div className="space-y-2">
                <Link href="/affiliate-program" className="block text-gray-400 hover:text-white">
                  Affiliate Program
                </Link>
                <Link href="/affiliate" className="block text-gray-400 hover:text-white">
                  Affiliate Login
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-4 text-sm sm:text-base">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/refund-policy" className="hover:text-white transition-colors">
                Refund Policy
              </Link>
            </div>
            <p className="text-sm">&copy; {new Date().getFullYear()} Lumbus Telecom Limited. Company No. 16793515. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
