'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HowToSchema, FAQSchema } from '@/components/structured-data';

export default function HowItWorksPage() {
  // FAQs for schema
  const howItWorksFAQs = [
    { q: 'When should I install my eSIM?', a: 'You can install your eSIM anytime after purchase, but only activate it (turn on data) when you arrive at your destination to start your validity period.' },
    { q: 'Do I need to remove my primary SIM?', a: 'No! Your eSIM works alongside your existing SIM. You can switch between them in your settings or use both simultaneously (calls on primary, data on eSIM).' },
    { q: 'What if I run out of data?', a: 'You can purchase a top-up plan from your dashboard. Additional data packages can be added anytime during your validity period.' },
    { q: 'Can I use hotspot/tethering?', a: 'Yes! All our eSIM plans support hotspot and tethering, so you can share your connection with other devices.' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <HowToSchema />
      <FAQSchema faqs={howItWorksFAQs} />

      <Nav />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 md:pt-48 pb-16 sm:pb-20 px-4 bg-yellow">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="px-4 sm:px-6 py-2 rounded-full bg-foreground/10 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground">
              ⚡ Super Simple
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
            HOW LUMBUS<br/>WORKS
          </h1>
          <p className="text-base sm:text-lg md:text-2xl font-bold max-w-3xl mx-auto text-foreground/70">
            Get connected in 3 easy steps.<br/>
            No physical SIM card needed. Setup takes less than 5 minutes.
          </p>
        </div>
      </section>

      {/* Main Steps */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-12 items-center mb-20">
            <div className="md:w-1/2">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                  <span className="text-4xl font-black">1</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 sm:mb-6">CHOOSE YOUR PLAN</h2>
              <p className="text-base sm:text-lg md:text-xl font-bold text-foreground/70 mb-6">
                Select the perfect data plan for your destination. We offer plans for 150+ countries with flexible data options and durations.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Pick your destination</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Choose data amount (100MB - 20GB)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Select validity period (1-30 days)</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Card className="bg-mint border-2 border-primary shadow-2xl">
                <CardContent className="p-8">
                  <div className="text-6xl mb-4 text-center">🗺️</div>
                  <div className="bg-white p-6 rounded-xl">
                    <div className="font-black text-lg mb-2">Japan 5GB - 30 Days</div>
                    <div className="text-3xl font-black mb-4">$19.99</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold text-foreground/70">Data:</span>
                        <span className="font-black">5 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-foreground/70">Valid for:</span>
                        <span className="font-black">30 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-foreground/70">Coverage:</span>
                        <span className="font-black">4G/5G</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center mb-20">
            <div className="md:w-1/2">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-cyan rounded-2xl flex items-center justify-center">
                  <span className="text-4xl font-black">2</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 sm:mb-6">PAY INSTANTLY</h2>
              <p className="text-xl font-bold text-foreground/70 mb-6">
                Complete your purchase with Apple Pay, Google Pay, or any major credit card. Secure checkout powered by Stripe.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Apple Pay & Google Pay supported</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">All major credit cards accepted</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Secure encrypted payment</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Card className="bg-purple border-2 border-primary shadow-2xl">
                <CardContent className="p-8">
                  <div className="text-6xl mb-4 text-center">💳</div>
                  <div className="bg-white p-6 rounded-xl space-y-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-xs">PAY</span>
                      </div>
                      <div className="flex-1 bg-foreground/5 rounded-lg p-3 flex items-center">
                        <span className="font-black text-sm">Apple Pay</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-foreground font-black text-xs">G</span>
                      </div>
                      <div className="flex-1 bg-foreground/5 rounded-lg p-3 flex items-center">
                        <span className="font-black text-sm">Google Pay</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t-2 border-foreground/5">
                      <div className="font-bold text-xs text-foreground/50 mb-2">OR PAY WITH CARD</div>
                      <div className="bg-foreground/5 rounded-lg p-3">
                        <div className="font-black text-sm">•••• •••• •••• 4242</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-yellow rounded-2xl flex items-center justify-center">
                  <span className="text-4xl font-black">3</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 sm:mb-6">GET CONNECTED</h2>
              <p className="text-xl font-bold text-foreground/70 mb-6">
                Receive your eSIM instantly. Activate it by scanning the QR code or using the one-tap installation on iOS 17.4+.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Instant eSIM delivery</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">QR code or one-tap activation</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black text-xl">✓</span>
                  <span className="font-bold">Online in less than 5 minutes</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Card className="bg-mint border-2 border-primary shadow-2xl">
                <CardContent className="p-8">
                  <div className="text-6xl mb-4 text-center">🌐</div>
                  <div className="bg-white p-6 rounded-xl text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-foreground/10 rounded-2xl flex items-center justify-center">
                      <div className="text-4xl">📲</div>
                    </div>
                    <div className="font-black text-lg mb-2">YOUR eSIM IS READY!</div>
                    <div className="text-sm font-bold text-foreground/70">
                      Scan QR code or tap to install
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Methods */}
      <section className="py-20 px-4 bg-light-mint">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              INSTALLATION METHODS
            </h2>
            <p className="text-xl font-bold text-foreground/70">
              Choose the method that works best for your device
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-foreground/10 ">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">⚡</div>
                <h3 className="font-black text-xl mb-4 uppercase">One-Tap Install</h3>
                <p className="font-bold text-foreground/70 mb-4">
                  For iOS 17.4+ users. Automatically opens eSIM installer.
                </p>
                <div className="bg-mint p-4 rounded-lg">
                  <p className="text-sm font-bold">No QR code scanning needed!</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 ">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">📸</div>
                <h3 className="font-black text-xl mb-4 uppercase">QR Code</h3>
                <p className="font-bold text-foreground/70 mb-4">
                  Scan the QR code with your device camera. Works on all eSIM phones.
                </p>
                <div className="bg-yellow p-4 rounded-lg">
                  <p className="text-sm font-bold">Universal compatibility</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/10 ">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">⌨️</div>
                <h3 className="font-black text-xl mb-4 uppercase">Manual Entry</h3>
                <p className="font-bold text-foreground/70 mb-4">
                  Enter activation code manually in your device settings.
                </p>
                <div className="bg-cyan p-4 rounded-lg">
                  <p className="text-sm font-bold">Alternative method</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              COMMON QUESTIONS
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-foreground/5 ">
              <CardContent className="p-6">
                <h3 className="font-black text-lg mb-3">When should I install my eSIM?</h3>
                <p className="font-bold text-foreground/70">
                  You can install your eSIM anytime after purchase, but only activate it (turn on data) when you arrive at your destination to start your validity period.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5 ">
              <CardContent className="p-6">
                <h3 className="font-black text-lg mb-3">Do I need to remove my primary SIM?</h3>
                <p className="font-bold text-foreground/70">
                  No! Your eSIM works alongside your existing SIM. You can switch between them in your settings or use both simultaneously (calls on primary, data on eSIM).
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5 ">
              <CardContent className="p-6">
                <h3 className="font-black text-lg mb-3">What if I run out of data?</h3>
                <p className="font-bold text-foreground/70">
                  You can purchase a top-up plan from your dashboard. Additional data packages can be added anytime during your validity period.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground/5 ">
              <CardContent className="p-6">
                <h3 className="font-black text-lg mb-3">Can I use hotspot/tethering?</h3>
                <p className="font-bold text-foreground/70">
                  Yes! All our eSIM plans support hotspot and tethering, so you can share your connection with other devices.
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
            READY TO TRY IT?
          </h2>
          <p className="text-2xl font-black mb-12 text-foreground/80 max-w-3xl mx-auto">
            Join thousands of travelers staying connected worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/plans">
              <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-lg px-16 py-6 rounded-lg ">
                GET STARTED
              </Button>
            </Link>
            <Link href="/help">
              <Button className="bg-white text-foreground hover:bg-white/90 font-black text-lg px-16 py-6 rounded-lg ">
                HELP CENTER
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
