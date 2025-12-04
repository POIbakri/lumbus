'use client';

import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AffiliateSignupForm } from '@/components/affiliate-signup-form';
import { FAQSchema, BreadcrumbSchema } from '@/components/structured-data';

// Icon components
function IconCommission() {
  return (
    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
      <svg className="w-10 h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function IconConversion() {
  return (
    <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  );
}

function IconCookie() {
  return (
    <div className="w-20 h-20 rounded-2xl bg-cyan flex items-center justify-center mx-auto mb-6 border-2 border-foreground/10 shadow-lg">
      <svg className="w-10 h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    </div>
  );
}

// FAQ data for schema
const affiliateFaqs = [
  {
    q: 'Who can become a Lumbus affiliate?',
    a: 'Anyone with an audience interested in travel, digital nomads, or international connectivity! This includes travel bloggers, YouTubers, podcasters, email list owners, social media influencers, and comparison websites.'
  },
  {
    q: 'What promotional materials do you provide?',
    a: 'We provide banner ads, social media graphics, email templates, and pre-written copy. You\'ll also get access to product images, videos, and our brand assets. Custom materials can be created upon request.'
  },
  {
    q: 'How do I track my affiliate performance?',
    a: 'Your affiliate dashboard shows real-time stats including clicks, conversions, conversion rate, earnings per click (EPC), pending commissions, and total earnings. All data is updated instantly.'
  },
  {
    q: 'When do Lumbus affiliates get paid?',
    a: 'Commissions are approved 14 days after the sale (refund window) and paid out monthly on the 1st of each month. Minimum payout threshold is $50. Payment methods include PayPal, bank transfer, or wire transfer.'
  },
  {
    q: 'Can I promote Lumbus on social media?',
    a: 'Absolutely! Social media is encouraged. You can share your affiliate link on Instagram, TikTok, Twitter, Facebook, YouTube, or any other platform. Just make sure to follow each platform\'s disclosure requirements.'
  },
  {
    q: 'Are there any affiliate program restrictions?',
    a: 'We prohibit paid search advertising on our brand name, trademark bidding, fake reviews, spam, and fraudulent activity. Be honest with your audience and follow FTC disclosure guidelines.'
  }
];

export default function AffiliateProgramPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <FAQSchema faqs={affiliateFaqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://getlumbus.com' },
          { name: 'Affiliate Program', url: 'https://getlumbus.com/affiliate-program' },
        ]}
      />

      <Nav />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 md:pt-48 pb-16 sm:pb-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="px-4 sm:px-6 py-2 rounded-full bg-foreground/10 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground">
              Earn Commission
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
            <Card className="bg-mint border-4 border-primary shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconCommission />
                <h3 className="font-black text-xl sm:text-2xl uppercase mb-3 tracking-tight">12% COMMISSION</h3>
                <p className="font-bold text-foreground/70 text-sm sm:text-base">
                  Earn 12% on every sale with no earnings cap. The more you sell, the more you earn.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow border-4 border-foreground/20 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconConversion />
                <h3 className="font-black text-xl sm:text-2xl uppercase mb-3 tracking-tight">HIGH CONVERSIONS</h3>
                <p className="font-bold text-foreground/70 text-sm sm:text-base">
                  Premium product with instant activation. Our conversion rates are industry-leading.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-cyan border-4 border-primary shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <IconCookie />
                <h3 className="font-black text-xl sm:text-2xl uppercase mb-3 tracking-tight">90-DAY COOKIES</h3>
                <p className="font-bold text-foreground/70 text-sm sm:text-base">
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

          <div className="space-y-6 sm:space-y-8">
            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase mb-2">APPLY TO JOIN</h3>
                <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/70">
                  Fill out the application form below with info about your audience, traffic sources, and promotional methods. We&apos;ll review and get back to you within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase mb-2">GET YOUR LINK</h3>
                <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/70">
                  Once approved, you&apos;ll get access to your affiliate dashboard with your unique tracking link (lumbus.com/a/your-name) and real-time analytics.
                </p>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase mb-2">PROMOTE & EARN</h3>
                <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/70">
                  Share your link on your blog, social media, email list, or wherever your audience hangs out. Earn 12% on every sale within 90 days of the click.
                </p>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-foreground/10 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase mb-2">GET PAID</h3>
                <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/70">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            <div className="p-4 sm:p-6 md:p-8 bg-mint rounded-2xl border-4 border-primary shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2">12%</div>
              <div className="text-xs sm:text-sm md:text-base font-black uppercase">Commission</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-yellow rounded-2xl border-4 border-foreground/20 shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2">90</div>
              <div className="text-xs sm:text-sm md:text-base font-black uppercase">Day Cookie</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-cyan rounded-2xl border-4 border-primary shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2">150+</div>
              <div className="text-xs sm:text-sm md:text-base font-black uppercase">Countries</div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-purple rounded-2xl border-4 border-foreground/20 shadow-xl">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2">$50</div>
              <div className="text-xs sm:text-sm md:text-base font-black uppercase">Min Payout</div>
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

          <div className="space-y-4 sm:space-y-6">
            {affiliateFaqs.map((faq, index) => (
              <Card key={index} className="border-2 border-foreground/10 rounded-xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-black">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-bold text-foreground/70 text-sm sm:text-base">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase mb-6 sm:mb-8 text-foreground leading-tight">
            READY TO START EARNING?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-black mb-8 sm:mb-12 text-foreground/80 max-w-3xl mx-auto">
            Join hundreds of partners earning commission by helping travelers stay connected
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#apply-form">
              <Button className="w-full sm:w-auto bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-10 sm:px-16 py-5 sm:py-6 rounded-xl shadow-2xl">
                APPLY NOW
              </Button>
            </a>
            <Link href="/affiliate">
              <Button className="w-full sm:w-auto bg-white text-foreground hover:bg-white/90 font-black text-base sm:text-lg px-10 sm:px-16 py-5 sm:py-6 rounded-xl shadow-2xl">
                AFFILIATE LOGIN
              </Button>
            </Link>
          </div>
          <p className="text-sm font-bold text-foreground/60 mt-6">
            Questions? Email us at <a href="mailto:partners@getlumbus.com" className="underline">partners@getlumbus.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
