'use client';

import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

export default function DevicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 bg-cyan">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-6">
            <span className="px-6 py-2 rounded-full bg-white/30 border-2 border-foreground/20 font-black uppercase text-xs tracking-widest text-foreground">
              📱 eSIM Compatible
            </span>
          </div>
          <h1 className="heading-xl mb-6">
            IS MY DEVICE<br/>COMPATIBLE?
          </h1>
          <p className="text-2xl font-bold max-w-3xl mx-auto text-foreground/70">
            Check if your device supports eSIM technology.<br/>
            Most modern smartphones and tablets are compatible.
          </p>
        </div>
      </section>

      {/* Quick Check Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">
              QUICK COMPATIBILITY CHECK
            </h2>
            <p className="text-xl font-bold text-foreground/70">
              Follow these simple steps to check if your device supports eSIM
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* iPhone Check */}
            <Card className="bg-mint border-2 border-foreground/10 hover-lift">
              <CardContent className="p-8">
                <div className="text-6xl mb-6 text-center">🍎</div>
                <h3 className="font-black text-2xl mb-6 uppercase text-center">For iPhone</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black">1</div>
                    <div>
                      <p className="font-bold">Open Settings</p>
                      <p className="text-sm text-foreground/70">Tap the Settings app on your iPhone</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black">2</div>
                    <div>
                      <p className="font-bold">Go to Cellular/Mobile Data</p>
                      <p className="text-sm text-foreground/70">Find the cellular settings menu</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black">3</div>
                    <div>
                      <p className="font-bold">Look for "Add eSIM"</p>
                      <p className="text-sm text-foreground/70">If you see this option, your device is eSIM compatible!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Android Check */}
            <Card className="bg-yellow border-2 border-foreground/10 hover-lift">
              <CardContent className="p-8">
                <div className="text-6xl mb-6 text-center">🤖</div>
                <h3 className="font-black text-2xl mb-6 uppercase text-center">For Android</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black">1</div>
                    <div>
                      <p className="font-bold">Open Settings</p>
                      <p className="text-sm text-foreground/70">Access your device settings</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black">2</div>
                    <div>
                      <p className="font-bold">Go to Network & Internet</p>
                      <p className="text-sm text-foreground/70">Find the network settings</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 font-black">3</div>
                    <div>
                      <p className="font-bold">Tap SIMs</p>
                      <p className="text-sm text-foreground/70">Look for "Download a SIM instead?" or "Add eSIM"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compatible Devices Lists */}
      <section className="py-20 px-4 bg-light-mint">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">
              COMPATIBLE DEVICES
            </h2>
            <p className="text-xl font-bold text-foreground/70">
              Popular devices that support eSIM technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Apple Devices */}
            <Card className="border-2 border-foreground/10">
              <CardContent className="p-8">
                <div className="text-5xl mb-4">🍎</div>
                <h3 className="font-black text-xl mb-6 uppercase">Apple Devices</h3>
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
            <Card className="border-2 border-foreground/10">
              <CardContent className="p-8">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="font-black text-xl mb-6 uppercase">Android Devices</h3>
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
            <Card className="border-2 border-foreground/10">
              <CardContent className="p-8">
                <div className="text-5xl mb-4">💻</div>
                <h3 className="font-black text-xl mb-6 uppercase">Other Devices</h3>
                <ul className="space-y-3">
                  {otherDevices.map((device) => (
                    <li key={device} className="flex gap-3">
                      <span className="text-primary font-black">✓</span>
                      <span className="font-bold text-sm">{device}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-yellow/30 rounded-lg">
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
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">
              WHAT YOU NEED
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-purple border-2 border-foreground/10">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="font-black text-xl mb-4 uppercase">Required</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold">eSIM compatible device</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold">Device must be carrier unlocked</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold">Stable internet connection for setup</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-mint border-2 border-foreground/10">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">ⓘ</div>
                <h3 className="font-black text-xl mb-4 uppercase">Important Notes</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold">Device must not be carrier-locked</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold">Some older models may not support eSIM</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-black">•</span>
                    <span className="font-bold">Contact your carrier to unlock if needed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="heading-lg mb-8 text-foreground">
            READY TO GET STARTED?
          </h2>
          <p className="text-2xl font-black mb-12 text-foreground/80 max-w-3xl mx-auto">
            Your device is compatible? Great! Choose your plan and get connected in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/plans">
              <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-lg px-16 py-6 rounded-lg hover-lift">
                BROWSE PLANS
              </Button>
            </Link>
            <Link href="/help">
              <Button className="bg-white text-foreground hover:bg-white/90 font-black text-lg px-16 py-6 rounded-lg hover-lift">
                GET HELP
              </Button>
            </Link>
          </div>
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
              <p className="text-gray-400">1GLOBAL eSIM Network</p>
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
