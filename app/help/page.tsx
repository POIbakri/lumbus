'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Nav } from '@/components/nav';
import { Card, CardContent } from '@/components/ui/card';
import { FAQSchema } from '@/components/structured-data';
import { openTawkToChat } from '@/components/tawk-to';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is an eSIM?',
        a: 'An eSIM (embedded SIM) is a digital SIM card built into your device. Instead of inserting a physical SIM card, you can activate a cellular plan digitally. It works just like a traditional SIM but is more flexible and convenient.'
      },
      {
        q: 'Is my device compatible with eSIM?',
        a: 'Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, and Samsung Galaxy S20 and newer. Check our Device Compatibility page for a full list.'
      },
      {
        q: 'How do I know if my phone is unlocked?',
        a: 'Contact your carrier to confirm your device is unlocked. Most phones purchased directly from manufacturers or at full price are unlocked. Carrier-locked devices won\'t work with eSIMs from other providers.'
      },
      {
        q: 'How long does delivery take?',
        a: 'Your eSIM is delivered instantly after purchase! You\'ll receive an email with your QR code and activation instructions within seconds. No waiting for physical delivery.'
      }
    ]
  },
  {
    category: 'Installation & Setup',
    questions: [
      {
        q: 'How do I install my eSIM?',
        a: 'For iPhone: Go to Settings > Cellular > Add eSIM, then scan the QR code or use the one-tap installation link. For Android: Go to Settings > Network & Internet > SIMs > Download a SIM, then scan the QR code.'
      },
      {
        q: 'When should I install my eSIM?',
        a: 'You can install your eSIM anytime after purchase, but only turn on data when you arrive at your destination. This ensures your validity period starts when you actually need it.'
      },
      {
        q: 'Can I install the eSIM before my trip?',
        a: 'Yes! You can install the eSIM before you travel. Just don\'t activate it (turn on cellular data) until you reach your destination. Your validity period starts when you first connect to a network.'
      },
      {
        q: 'What if I can\'t scan the QR code?',
        a: 'You can enter the activation details manually. Go to your device\'s eSIM settings and select "Enter Details Manually", then input the SM-DP+ address and activation code provided in your email.'
      }
    ]
  },
  {
    category: 'Using Your eSIM',
    questions: [
      {
        q: 'Do I need to remove my primary SIM card?',
        a: 'No! Your eSIM works alongside your existing SIM. You can use both simultaneously - for example, keep your primary SIM for calls and SMS, while using the eSIM for data.'
      },
      {
        q: 'Can I use hotspot/tethering?',
        a: 'Yes! All Lumbus eSIM plans support mobile hotspot and tethering. You can share your data connection with other devices like laptops or tablets.'
      },
      {
        q: 'What speeds can I expect?',
        a: 'You\'ll get 4G/LTE or 5G speeds depending on your plan and local network availability. Our eSIMs automatically connect to the best available network in your destination.'
      },
      {
        q: 'What happens when I run out of data?',
        a: 'When you run out of data, your connection will stop. You can purchase a top-up plan from your dashboard to add more data. Your validity period remains the same when you top up.'
      }
    ]
  },
  {
    category: 'Plans & Billing',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Apple Pay, Google Pay, and all major credit cards (Visa, Mastercard, Amex, Discover). All payments are securely processed through Stripe.'
      },
      {
        q: 'When does my plan start?',
        a: 'Your plan validity starts when you first connect to a mobile network with data enabled. Installing the eSIM doesn\'t start the countdown - only using it does.'
      },
      {
        q: 'Can I get a refund?',
        a: 'Yes, you can request a refund before activating your eSIM (before first data connection). Once activated, eSIMs cannot be refunded as the service has been consumed.'
      },
      {
        q: 'Do you offer unlimited data plans?',
        a: 'We offer high-capacity data plans up to 20GB. For most travelers, 5-10GB is sufficient for navigation, messaging, and moderate browsing. Check our plans page for specific options.'
      }
    ]
  },
  {
    category: 'Troubleshooting',
    questions: [
      {
        q: 'My eSIM isn\'t connecting. What should I do?',
        a: 'First, ensure data roaming is enabled and your eSIM is set as the primary data line. Try toggling airplane mode on/off, or restart your device. If issues persist, contact our support team.'
      },
      {
        q: 'I see "No Service" on my device.',
        a: 'Make sure you\'re in an area with coverage and that your device isn\'t in airplane mode. Check that the eSIM is installed correctly and cellular data is enabled for it.'
      },
      {
        q: 'How do I check my data usage?',
        a: 'You can check your data usage in two ways: 1) Through your device\'s settings (Cellular/Mobile Data), or 2) In your Lumbus dashboard where you can see real-time usage statistics.'
      },
      {
        q: 'Can I use my eSIM in multiple devices?',
        a: 'No, each eSIM can only be installed on one device. If you need connectivity for multiple devices, you can either use hotspot/tethering or purchase separate eSIMs.'
      }
    ]
  }
];

export default function HelpPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Flatten all FAQs for schema
  const allFAQs = faqs.flatMap(category =>
    category.questions.map(q => ({ q: q.q, a: q.a }))
  );

  return (
    <div className="min-h-screen bg-white">
      {/* FAQ Schema for SEO */}
      <FAQSchema faqs={allFAQs} />

      <Nav />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 md:pt-48 pb-16 sm:pb-20 px-4 bg-purple">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="px-4 sm:px-6 py-2 rounded-full bg-foreground/10 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground">
              💬 We're Here to Help
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
            HELP CENTER
          </h1>
          <p className="text-base sm:text-lg md:text-2xl font-bold max-w-3xl mx-auto text-foreground/70">
            Find answers to common questions.<br/>
            Need more help? Our support team is available 24/7.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 sm:py-12 px-4 bg-white border-b-2 border-foreground/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <Link href="/how-it-works">
              <Card className=" cursor-pointer border-2 border-foreground/5 hover:border-primary ">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
                  <h3 className="font-black text-xs sm:text-sm uppercase">How it Works</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/device">
              <Card className=" cursor-pointer border-2 border-foreground/5 hover:border-primary ">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="font-black text-sm uppercase">Device Check</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/destinations">
              <Card className=" cursor-pointer border-2 border-foreground/5 hover:border-primary ">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🌍</div>
                  <h3 className="font-black text-sm uppercase">Destinations</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/plans">
              <Card className=" cursor-pointer border-2 border-foreground/5 hover:border-primary ">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">💎</div>
                  <h3 className="font-black text-sm uppercase">Browse Plans</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((category, catIndex) => (
              <div key={category.category}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                  className="w-full"
                >
                  <Card className="border-2 border-foreground/10  cursor-pointer ">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-xl uppercase text-left">{category.category}</h3>
                        <span className="text-2xl font-black text-primary">
                          {expandedCategory === category.category ? '−' : '+'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </button>

                {expandedCategory === category.category && (
                  <div className="mt-4 space-y-4 ">
                    {category.questions.map((faq, qIndex) => (
                      <Card
                        key={qIndex}
                        className="border-2 border-foreground/5 ml-4"
                      >
                        <CardContent className="p-0">
                          <button
                            onClick={() => setExpandedQuestion(expandedQuestion === `${catIndex}-${qIndex}` ? null : `${catIndex}-${qIndex}`)}
                            className="w-full p-6 text-left hover:bg-foreground/5 "
                          >
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-black text-base">{faq.q}</h4>
                              <span className="text-lg font-black text-primary flex-shrink-0">
                                {expandedQuestion === `${catIndex}-${qIndex}` ? '−' : '+'}
                              </span>
                            </div>
                          </button>
                          {expandedQuestion === `${catIndex}-${qIndex}` && (
                            <div className="px-6 pb-6 ">
                              <p className="font-bold text-foreground/70">{faq.a}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-12 sm:py-20 px-4 bg-mint">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 sm:mb-6 leading-tight">
            STILL NEED HELP?
          </h2>
          <p className="text-base sm:text-lg md:text-xl font-bold text-foreground/70 mb-8 sm:mb-12">
            Our support team is available 24/7 to assist you with any questions or issues.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <div className="text-5xl mb-4">📧</div>
                <h3 className="font-black text-lg mb-2 uppercase">Email</h3>
                <p className="font-bold text-sm text-foreground/70 mb-4">
                  Get a response within 24 hours
                </p>
                <a href="mailto:support@lumbus.com" className="text-primary font-black text-sm hover:underline">
                  support@lumbus.com
                </a>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-black text-lg mb-2 uppercase">Live Chat</h3>
                <p className="font-bold text-sm text-foreground/70 mb-4">
                  Chat with us in real-time
                </p>
                <button
                  onClick={openTawkToChat}
                  className="text-primary font-black text-sm hover:underline"
                >
                  Start Chat
                </button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="font-black text-lg mb-2 uppercase">Guides</h3>
                <p className="font-bold text-sm text-foreground/70 mb-4">
                  Detailed setup instructions
                </p>
                <Link href="/how-it-works" className="text-primary font-black text-sm hover:underline">
                  View Guides
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/logo.jpg"
                  alt="Lumbus"
                  width={300}
                  height={80}
                  className="h-16 w-auto sm:h-20 md:h-24 lg:h-28"
                />
              </Link>
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
