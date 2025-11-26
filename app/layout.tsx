import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { RegionsProvider } from "@/contexts/regions-context";
import { OrganizationSchema, WebsiteSchema } from "@/components/structured-data";
import { Analytics } from "@vercel/analytics/next";
import { WelcomePopup } from "@/components/welcome-popup";
import { CookieConsent } from "@/components/cookie-consent";
import { TawkTo } from "@/components/tawk-to";
import { Footer } from "@/components/footer";
import { AppPromoBanner } from "@/components/app-promo-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://getlumbus.com'),
  title: {
    default: 'Buy eSIM Online - Cheap eSIM Plans for 150+ Countries | Lumbus',
    template: '%s | Lumbus eSIM',
  },
  description: 'Buy cheap eSIM plans online for 150+ countries. Instant activation, no signup required. Best eSIM provider 2025. Save 10x vs roaming. Get connected in 5 minutes with Lumbus eSIM.',
  applicationName: 'Lumbus',
  authors: [{ name: 'Lumbus Technologies Limited', url: 'https://getlumbus.com' }],
  generator: 'Next.js',
  keywords: [
    // Brand variations - Core identity
    'Lumbus', 'Lumbus eSIM', 'Get Lumbus', 'getLumbus', 'lumbus esim', 'lumbus travel', 'Lumbus app', 'Lumbus store',

    // Core eSIM terms - Primary searches
    'eSIM', 'esim', 'e-SIM', 'e sim', 'ESIM', 'travel eSIM', 'international eSIM', 'global eSIM', 'digital SIM',
    'virtual SIM', 'embedded SIM', 'programmable SIM', 'soft SIM', 'cloud SIM', 'electronic SIM',

    // Purchase intent keywords
    'buy eSIM', 'buy esim online', 'purchase eSIM', 'get eSIM', 'order eSIM', 'eSIM online', 'instant eSIM',
    'eSIM store', 'eSIM shop', 'where to buy eSIM', 'eSIM website', 'eSIM marketplace',

    // Price-focused keywords
    'cheap eSIM', 'affordable eSIM', 'cheapest eSIM', 'best price eSIM', 'discount eSIM', 'cheap roaming',
    'cheap international data', 'budget eSIM', 'low cost eSIM', 'inexpensive eSIM', 'best value eSIM',

    // Quality-focused keywords
    'best eSIM', 'best eSIM provider', 'top eSIM', 'reliable eSIM', 'fast eSIM', 'best travel eSIM',
    'recommended eSIM', 'trusted eSIM', 'premium eSIM', 'high quality eSIM',

    // Competitor alternatives - Major brands
    'alternative to Airalo', 'Airalo alternative', 'cheaper than Airalo', 'better than Airalo', 'vs Airalo',
    'alternative to Holafly', 'Holafly alternative', 'cheaper than Holafly', 'better than Holafly', 'vs Holafly',
    'alternative to Nomad', 'Nomad eSIM alternative', 'vs Nomad',
    'alternative to Ubigi', 'Ubigi alternative', 'vs Ubigi',
    'alternative to Flexiroam', 'Flexiroam alternative', 'vs Flexiroam',
    'alternative to GigSky', 'GigSky alternative', 'vs GigSky',
    'alternative to Truphone', 'Truphone alternative', 'vs Truphone',
    'alternative to KnowRoaming', 'KnowRoaming alternative', 'vs KnowRoaming',
    'alternative to Maya Mobile', 'Maya alternative', 'vs Maya',
    'alternative to Surfroam', 'Surfroam alternative', 'vs Surfroam',

    // Comparison keywords
    'eSIM comparison', 'compare eSIM providers', 'eSIM reviews', 'eSIM vs roaming', 'eSIM or physical SIM',
    'which eSIM is best', 'eSIM provider comparison', 'best eSIM app',

    // Regional eSIMs - Popular destinations
    'Europe eSIM', 'Asia eSIM', 'USA eSIM', 'UK eSIM', 'Spain eSIM', 'France eSIM', 'Italy eSIM', 'Germany eSIM',
    'Japan eSIM', 'China eSIM', 'Thailand eSIM', 'Singapore eSIM', 'Dubai eSIM', 'Turkey eSIM', 'Greece eSIM',
    'Portugal eSIM', 'Mexico eSIM', 'Canada eSIM', 'Australia eSIM', 'New Zealand eSIM', 'Brazil eSIM',
    'India eSIM', 'Vietnam eSIM', 'Indonesia eSIM', 'Philippines eSIM', 'South Korea eSIM', 'Taiwan eSIM',

    // Multi-country keywords
    'multi country eSIM', 'worldwide eSIM', 'global coverage eSIM', 'regional eSIM', 'multiple countries eSIM',
    'international travel eSIM', 'cross border eSIM', 'roaming eSIM',

    // Data & connectivity keywords
    'international data', 'travel data', 'mobile data', 'data plan', 'prepaid data', 'data roaming',
    'travel internet', 'international internet', 'abroad internet', 'wifi abroad', 'internet overseas',
    'mobile hotspot', 'portable wifi', '4G data', '5G data', 'LTE data', 'high speed data',

    // Travel-specific keywords
    'travel SIM', 'tourist SIM', 'vacation SIM', 'holiday internet', 'travel phone plan', 'international phone plan',
    'roaming solution', 'avoid roaming charges', 'no roaming fees', 'cheap roaming', 'international roaming',

    // Use case keywords
    'eSIM for travel', 'eSIM for tourists', 'eSIM for business travel', 'eSIM for vacation', 'eSIM for expats',
    'eSIM for digital nomads', 'eSIM for students', 'eSIM for backpackers', 'student travel eSIM',
    'business traveler eSIM', 'cruise ship internet', 'study abroad internet',

    // Technical/setup keywords
    'eSIM activation', 'how to install eSIM', 'eSIM setup', 'eSIM compatible phones', 'iPhone eSIM',
    'Android eSIM', 'eSIM QR code', 'instant activation', 'quick setup eSIM', 'easy eSIM',

    // Problem-solving keywords
    'avoid roaming charges', 'international data solution', 'stay connected abroad', 'internet while traveling',
    'no contract data', 'no commitment data', 'prepaid international data', 'temporary data plan',
    'short term data plan', 'emergency data', 'backup internet',

    // Service features
    'instant eSIM', 'no signup eSIM', 'prepaid eSIM', 'pay as you go eSIM', 'unlimited data eSIM',
    'eSIM top up', 'refillable eSIM', 'reusable eSIM', 'flexible eSIM', 'on demand eSIM',

    // Mobile operator alternatives
    'mobile data plan', 'international mobile plan', 'global SIM card', 'world SIM card', 'traveler SIM',
    'portable data', 'temporary phone plan', 'vacation phone plan',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Lumbus',
  publisher: 'Lumbus Technologies Limited',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://getlumbus.com',
    siteName: 'Lumbus',
    title: 'Lumbus - Fast eSIM Store | Instant eSIMs for 150+ Countries',
    description: 'Get instant eSIMs for 150+ countries. Up to 10x cheaper than roaming. No signup required. Works abroad and at home with 4G/5G speeds.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lumbus eSIM - Global Connectivity in 150+ Countries',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumbus - Fast eSIM Store | Instant eSIMs for 150+ Countries',
    description: 'Get instant eSIMs for 150+ countries. Up to 10x cheaper than roaming. Activated in seconds.',
    images: ['/og-image.png'],
    creator: '@lumbus',
    site: '@lumbus',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  classification: 'Travel Technology, Telecommunications',
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/logo-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/logo-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lumbus",
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  verification: {
    google: 'I366hIp0hbTHejtQWurn2hMIpp4Uf-OwuAvpbkgwlMU',
    yandex: 'yandex-verification-code-here',
    other: {
      'msvalidate.01': 'EC2129D35A218A72351745BDE93F9351',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Search Engine Verification */}
        <meta name="msvalidate.01" content="EC2129D35A218A72351745BDE93F9351" />

        {/* Structured Data for SEO */}
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <RegionsProvider>
            {children}
          </RegionsProvider>
        </AuthProvider>
        <WelcomePopup />
        <CookieConsent />
        <TawkTo />
        <Analytics />
        <AppPromoBanner />
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
