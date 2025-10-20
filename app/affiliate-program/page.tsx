'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AffiliateSignupForm } from '@/components/affiliate-signup-form';

export default function AffiliateProgramPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="px-4 sm:px-6 py-2 rounded-full bg-foreground/10 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground">
              💰 Earn Commission
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight text-foreground">
            JOIN THE LUMBUS<br/>AFFILIATE PROGRAM
          </h1>
          <p className="text-base sm:text-lg md:text-2xl font-bold max-w-3xl mx-auto text-foreground/80 mb-8">
            Earn 12% commission on every sale you refer.<br className="hidden sm:inline"/>
            Help travelers stay connected worldwide and get paid for it.
          </p>
          <a href="#apply-form">
            <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-12 sm:px-16 py-5 sm:py-6 rounded-xl shadow-2xl">
              APPLY NOW
            </Button>
          </a>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              WHY PARTNER WITH US?
            </h2>
            <p className="text-lg sm:text-xl font-bold text-foreground/70">
              Industry-leading commission and support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-mint border-4 border-primary shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">💵</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">12% COMMISSION</h3>
                <p className="font-bold text-foreground/70">
                  Earn 12% on every sale with no earnings cap. The more you sell, the more you earn.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow border-4 border-secondary shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">⚡</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">HIGH CONVERSIONS</h3>
                <p className="font-bold text-foreground/70">
                  Premium product with instant activation. Our conversion rates are industry-leading.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-cyan border-4 border-primary shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">🔗</div>
                <h3 className="font-black text-2xl uppercase mb-3 tracking-tight">90-DAY COOKIES</h3>
                <p className="font-bold text-foreground/70">
                  Long cookie window means you get credit for sales up to 90 days after the click.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 bg-light-mint">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              HOW IT WORKS
            </h2>
            <p className="text-lg sm:text-xl font-bold text-foreground/70">
              Simple process, passive income
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-black">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase mb-2">APPLY TO JOIN</h3>
                <p className="text-base sm:text-lg font-bold text-foreground/70">
                  Fill out the application form below with info about your audience, traffic sources, and promotional methods. We'll review and get back to you within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-yellow rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-black">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase mb-2">GET YOUR LINK</h3>
                <p className="text-base sm:text-lg font-bold text-foreground/70">
                  Once approved, you'll get access to your affiliate dashboard with your unique tracking link (lumbus.com/a/your-name) and real-time analytics.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-cyan rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-black">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase mb-2">PROMOTE & EARN</h3>
                <p className="text-base sm:text-lg font-bold text-foreground/70">
                  Share your link on your blog, social media, email list, or wherever your audience hangs out. Earn 12% on every sale within 90 days of the click.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-purple rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-black">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase mb-2">GET PAID</h3>
                <p className="text-base sm:text-lg font-bold text-foreground/70">
                  Commissions are approved after a 14-day refund window and paid out monthly via PayPal, bank transfer, or your preferred method. Minimum payout: $50.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply-form" className="py-16 sm:py-20 px-4 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-3xl">
          <AffiliateSignupForm />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              THE NUMBERS
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="p-6 sm:p-8 bg-mint rounded-2xl border-4 border-primary shadow-xl">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-2">12%</div>
              <div className="text-sm sm:text-base font-black uppercase">Commission</div>
            </div>
            <div className="p-6 sm:p-8 bg-yellow rounded-2xl border-4 border-secondary shadow-xl">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-2">90</div>
              <div className="text-sm sm:text-base font-black uppercase">Day Cookie</div>
            </div>
            <div className="p-6 sm:p-8 bg-cyan rounded-2xl border-4 border-primary shadow-xl">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-2">150+</div>
              <div className="text-sm sm:text-base font-black uppercase">Countries</div>
            </div>
            <div className="p-6 sm:p-8 bg-purple rounded-2xl border-4 border-accent shadow-xl">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-2">$50</div>
              <div className="text-sm sm:text-base font-black uppercase">Min Payout</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 sm:py-20 px-4 bg-light-mint">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-black">Who can become an affiliate?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground/70">
                  Anyone with an audience interested in travel, digital nomads, or international connectivity! This includes travel bloggers, YouTubers, podcasters, email list owners, social media influencers, and comparison websites.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-black">What promotional materials do you provide?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground/70">
                  We provide banner ads, social media graphics, email templates, and pre-written copy. You'll also get access to product images, videos, and our brand assets. Custom materials can be created upon request.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-black">How do I track my performance?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground/70">
                  Your affiliate dashboard shows real-time stats including clicks, conversions, conversion rate, earnings per click (EPC), pending commissions, and total earnings. All data is updated instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-black">When do I get paid?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground/70">
                  Commissions are approved 14 days after the sale (refund window) and paid out monthly on the 1st of each month. Minimum payout threshold is $50. Payment methods include PayPal, bank transfer, or wire transfer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-black">Can I promote on social media?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground/70">
                  Absolutely! Social media is encouraged. You can share your affiliate link on Instagram, TikTok, Twitter, Facebook, YouTube, or any other platform. Just make sure to follow each platform's disclosure requirements (e.g., #ad, #affiliate).
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-black">Are there any restrictions?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground/70">
                  We prohibit paid search advertising on our brand name ("Lumbus eSIM", "Lumbus"), trademark bidding, fake reviews, spam, and fraudulent activity. Be honest with your audience and follow FTC disclosure guidelines.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 sm:mb-8 text-foreground leading-tight">
            READY TO START EARNING?
          </h2>
          <p className="text-xl sm:text-2xl font-black mb-12 text-foreground/80 max-w-3xl mx-auto">
            Join hundreds of partners earning commission by helping travelers stay connected
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#apply-form">
              <Button className="w-full sm:w-auto bg-foreground text-white hover:bg-foreground/90 font-black text-lg px-16 py-6 rounded-lg shadow-2xl">
                APPLY NOW
              </Button>
            </a>
            <Link href="/affiliate">
              <Button className="w-full sm:w-auto bg-white text-foreground hover:bg-white/90 font-black text-lg px-16 py-6 rounded-lg shadow-2xl">
                AFFILIATE LOGIN
              </Button>
            </Link>
          </div>
          <p className="text-sm font-bold text-foreground/60 mt-6">
            Questions? Email us at <a href="mailto:partners@lumbus.com" className="underline">partners@lumbus.com</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/logotrans.png"
                  alt="Lumbus"
                  width={300}
                  height={80}
                  className="h-14 w-auto sm:h-16 md:h-18"
                />
              </Link>
              <p className="text-gray-400">Fast eSIMs for travelers worldwide</p>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Pages</h4>
              <div className="space-y-2">
                <Link href="/destinations" className="block text-gray-400 hover:text-white">
                  Destinations
                </Link>
                <Link href="/how-it-works" className="block text-gray-400 hover:text-white">
                  How it works
                </Link>
                <Link href="/plans" className="block text-gray-400 hover:text-white">
                  Plans
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-gray-400 hover:text-white">
                  Help Center
                </Link>
                <Link href="/support" className="block text-gray-400 hover:text-white">
                  Contact Support
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
            <p>&copy; {new Date().getFullYear()} Lumbus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
