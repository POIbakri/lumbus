import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-foreground text-white py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.jpg"
                alt="Lumbus - Global eSIM Provider"
                width={300}
                height={80}
                className="h-16 w-auto sm:h-20 md:h-24 lg:h-28"
                loading="lazy"
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
              <Link href="/device" className="block text-gray-400 hover:text-white">
                Device
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
              <Link href="/destinations" className="block text-gray-400 hover:text-white">
                Destinations
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
            <span>•</span>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Lumbus Technologies Limited. Company No. 16793515. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

