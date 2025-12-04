'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FAQSchema, BreadcrumbSchema } from '@/components/structured-data';

const appleDevices = [
  'iPhone XS, XS Max, XR and newer',
  'iPhone SE (2020) and newer',
  'iPad Pro 11-inch (all generations)',
  'iPad Pro 12.9-inch (3rd generation and newer)',
  'iPad Air (3rd generation and newer)',
  'iPad (7th generation and newer)',
  'iPad Mini (5th generation and newer)'
];

const androidDevices = [
  'Google Pixel 3 and newer',
  'Samsung Galaxy S20, S21, S22, S23, S24 series',
  'Samsung Galaxy Note 20 and newer',
  'Samsung Galaxy Z Fold/Flip series',
  'Google Pixel Fold',
  'Motorola Razr (2019) and newer',
  'OPPO Find X3 Pro and newer',
  'Huawei P40 and newer',
  'OnePlus 9 Pro and newer'
];

const otherDevices = [
  'Microsoft Surface Pro X',
  'Microsoft Surface Duo',
  'Selected smart watches with cellular'
];

// FAQ data for schema
const deviceFaqs = [
  {
    q: 'How do I check if my iPhone supports eSIM?',
    a: 'On iPhone, go to Settings > Cellular (or Mobile Data) > Add eSIM. If you see this option, your iPhone supports eSIM. All iPhones from XS/XR onwards support eSIM.'
  },
  {
    q: 'How do I check if my Android phone supports eSIM?',
    a: 'On Android, go to Settings > Network & Internet > SIMs. Look for "Download a SIM" or "Add eSIM" option. If present, your phone supports eSIM. You can also dial *#06# to see if EID is listed.'
  },
  {
    q: 'Does my phone need to be unlocked for eSIM?',
    a: 'Yes, your phone must be carrier-unlocked to use an eSIM from Lumbus. Contact your current carrier to unlock your device if needed. Phones purchased directly from manufacturers are usually unlocked.'
  },
  {
    q: 'Can I use eSIM and physical SIM at the same time?',
    a: 'Yes! Most eSIM-compatible phones support dual SIM functionality. You can keep your regular SIM for calls/texts and use the Lumbus eSIM for data while traveling.'
  },
  {
    q: 'Why is my device not showing eSIM option?',
    a: 'If your device should support eSIM but doesn\'t show the option: 1) Make sure your device is carrier-unlocked, 2) Update to the latest software version, 3) Restart your device. Some carrier-locked phones have eSIM disabled.'
  },
  {
    q: 'Does eSIM work on tablets and smartwatches?',
    a: 'Yes, eSIM works on compatible iPads, Android tablets, and cellular smartwatches. Check the specific model\'s specifications to confirm eSIM support before purchasing.'
  }
];

// Icon component for "Other Devices"
function IconLaptop() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-purple flex items-center justify-center mb-4 border-2 border-foreground/10 shadow-lg">
      <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function IconCheck() {
  return (
    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 border-2 border-foreground/10">
      <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function IconInfo() {
  return (
    <div className="w-12 h-12 rounded-xl bg-cyan flex items-center justify-center mb-4 border-2 border-foreground/10">
      <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export default function DevicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <FAQSchema faqs={deviceFaqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://getlumbus.com' },
          { name: 'Device Compatibility', url: 'https://getlumbus.com/device' },
        ]}
      />

      <Nav />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 md:pt-48 pb-16 sm:pb-20 px-4 bg-cyan">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="px-4 sm:px-6 py-2 rounded-full bg-white/30 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground">
              eSIM Compatible
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
            IS MY DEVICE<br/>COMPATIBLE?
          </h1>
          <p className="text-base sm:text-lg md:text-2xl font-bold max-w-3xl mx-auto text-foreground/70">
            Check if your device supports eSIM technology.<br/>
            Most modern smartphones and tablets are compatible.
          </p>
        </div>
      </section>

      {/* Quick Check Section */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              QUICK COMPATIBILITY CHECK
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-bold text-foreground/70">
              Follow these simple steps to check if your device supports eSIM
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* iPhone Check */}
            <Card className="bg-mint border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex justify-center mb-6">
                  <Image src="/apple-logo.svg" alt="Apple logo for iPhone eSIM compatibility" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                </div>
                <h3 className="font-black text-xl sm:text-2xl mb-6 uppercase text-center">For iPhone</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black text-sm">1</div>
                    <div>
                      <p className="font-bold">Open Settings</p>
                      <p className="text-sm text-foreground/70">Tap the Settings app on your iPhone</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black text-sm">2</div>
                    <div>
                      <p className="font-bold">Go to Cellular/Mobile Data</p>
                      <p className="text-sm text-foreground/70">Find the cellular settings menu</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black text-sm">3</div>
                    <div>
                      <p className="font-bold">Look for &quot;Add eSIM&quot;</p>
                      <p className="text-sm text-foreground/70">If you see this option, your device is eSIM compatible!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Android Check */}
            <Card className="bg-yellow border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex justify-center mb-6">
                  <Image src="/android-logo.svg" alt="Android logo for eSIM compatibility" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                </div>
                <h3 className="font-black text-xl sm:text-2xl mb-6 uppercase text-center">For Android</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black text-sm">1</div>
                    <div>
                      <p className="font-bold">Open Settings</p>
                      <p className="text-sm text-foreground/70">Access your device settings</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black text-sm">2</div>
                    <div>
                      <p className="font-bold">Go to Network & Internet</p>
                      <p className="text-sm text-foreground/70">Find the network settings</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black text-sm">3</div>
                    <div>
                      <p className="font-bold">Tap SIMs</p>
                      <p className="text-sm text-foreground/70">Look for &quot;Download a SIM instead?&quot; or &quot;Add eSIM&quot;</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compatible Devices Lists */}
      <section className="py-16 sm:py-20 px-4 bg-light-mint">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              COMPATIBLE DEVICES
            </h2>
            <p className="text-lg sm:text-xl font-bold text-foreground/70">
              Popular devices that support eSIM technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Apple Devices */}
            <Card className="border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/apple-logo.svg" alt="Apple devices compatible with eSIM" width={40} height={40} className="w-10 h-10 object-contain" />
                  <h3 className="font-black text-lg sm:text-xl uppercase">Apple Devices</h3>
                </div>
                <ul className="space-y-3">
                  {appleDevices.map((device) => (
                    <li key={device} className="flex gap-3">
                      <span className="text-primary font-black">✓</span>
                      <span className="font-bold text-sm">{device}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Android Devices */}
            <Card className="border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/android-logo.svg" alt="Android devices compatible with eSIM" width={40} height={40} className="w-10 h-10 object-contain" />
                  <h3 className="font-black text-lg sm:text-xl uppercase">Android Devices</h3>
                </div>
                <ul className="space-y-3">
                  {androidDevices.map((device) => (
                    <li key={device} className="flex gap-3">
                      <span className="text-primary font-black">✓</span>
                      <span className="font-bold text-sm">{device}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Other Devices */}
            <Card className="border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <IconLaptop />
                <h3 className="font-black text-lg sm:text-xl mb-6 uppercase">Other Devices</h3>
                <ul className="space-y-3">
                  {otherDevices.map((device) => (
                    <li key={device} className="flex gap-3">
                      <span className="text-primary font-black">✓</span>
                      <span className="font-bold text-sm">{device}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-yellow/30 rounded-xl">
                  <p className="text-xs font-bold">
                    Note: This is not an exhaustive list. Check your device specifications to confirm eSIM support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              WHAT YOU NEED
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-purple border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <IconCheck />
                <h3 className="font-black text-lg sm:text-xl mb-4 uppercase">Required</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold text-sm sm:text-base">eSIM compatible device</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold text-sm sm:text-base">Device must be carrier unlocked</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold text-sm sm:text-base">Stable internet connection for setup</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-mint border-2 border-foreground/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <IconInfo />
                <h3 className="font-black text-lg sm:text-xl mb-4 uppercase">Important Notes</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold text-sm sm:text-base">Device must not be carrier-locked</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold text-sm sm:text-base">Some older models may not support eSIM</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold text-sm sm:text-base">Contact your carrier to unlock if needed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 bg-light-mint">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-4 leading-tight">
              DEVICE COMPATIBILITY FAQs
            </h2>
          </div>

          <div className="space-y-4">
            {deviceFaqs.map((faq, index) => (
              <Card key={index} className="border-2 border-foreground/10 rounded-xl overflow-hidden bg-white">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-black text-base sm:text-lg mb-2">{faq.q}</h3>
                  <p className="font-bold text-foreground/70 text-sm sm:text-base">{faq.a}</p>
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
            READY TO GET STARTED?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-black mb-8 sm:mb-12 text-foreground/80 max-w-3xl mx-auto">
            Your device is compatible? Great! Choose your plan and get connected in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Link href="/plans">
              <Button className="w-full sm:w-auto bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-10 sm:px-16 py-5 sm:py-6 rounded-xl shadow-2xl">
                BROWSE PLANS
              </Button>
            </Link>
            <Link href="/help">
              <Button className="w-full sm:w-auto bg-white text-foreground hover:bg-white/90 font-black text-base sm:text-lg px-10 sm:px-16 py-5 sm:py-6 rounded-xl shadow-2xl">
                GET HELP
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
