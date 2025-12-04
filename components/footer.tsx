'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AppStoreBadges } from './app-store-badges';
import { TikTokIcon, InstagramIcon, TwitterIcon } from './social-media-links';

export function Footer() {
  const pathname = usePathname();

  // Don't show footer on dashboard pages
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="bg-foreground text-white relative overflow-hidden">
      {/* Decorative gradient elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-4 py-12 sm:py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <div className="bg-white rounded-xl p-2 sm:p-3 inline-block">
                <Image
                  src="/logo.jpg"
                  alt="Lumbus - Global eSIM Provider"
                  width={140}
                  height={40}
                  className="h-8 sm:h-10 w-auto"
                  loading="lazy"
                />
              </div>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm text-sm sm:text-base">
              The smarter way to stay connected abroad. Instant eSIMs for 150+ countries.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mb-6">
              <a
                href="https://x.com/getlumbus"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-primary hover:text-foreground rounded-xl flex items-center justify-center transition-all"
                aria-label="Follow on X (Twitter)"
              >
                <TwitterIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/getlumbus"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-primary hover:text-foreground rounded-xl flex items-center justify-center transition-all"
                aria-label="Follow on Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@getlumbus"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-primary hover:text-foreground rounded-xl flex items-center justify-center transition-all"
                aria-label="Follow on TikTok"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>

            {/* App Store Badges */}
            <div className="hidden sm:block">
              <AppStoreBadges variant="compact" className="origin-left" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black uppercase text-sm tracking-wide mb-4 text-white">Explore</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/plans" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Browse Plans
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Destinations
                </Link>
              </li>
              <li>
                <Link href="/device" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Device Compatibility
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-black uppercase text-sm tracking-wide mb-4 text-white">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="font-black uppercase text-sm tracking-wide mb-4 text-white">Partners</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/affiliate-program" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-gray-400 hover:text-primary transition-colors text-sm">
                  Affiliate Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile App Badges */}
        <div className="sm:hidden mb-8 flex justify-center">
          <AppStoreBadges variant="compact" />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-gray-500">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="/refund-policy" className="hover:text-white transition-colors">
                Refunds
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="/sitemap.xml" className="hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
              © {new Date().getFullYear()} Lumbus Technologies Limited
              <span className="hidden sm:inline"> • Company No. 16793515</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

