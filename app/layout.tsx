import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { OrganizationSchema, WebsiteSchema } from "@/components/structured-data";
import { Analytics } from "@vercel/analytics/next";
import { WelcomePopup } from "@/components/welcome-popup";

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
    default: 'Lumbus - Fast eSIM Store | Instant eSIMs for 150+ Countries',
    template: '%s | Lumbus eSIM',
  },
  description: 'Get instant eSIMs for 150+ countries. Up to 10x cheaper than roaming. No signup required. Works abroad and at home. Fast 4G/5G data plans activated in seconds.',
  applicationName: 'Lumbus',
  authors: [{ name: 'Lumbus Telecom Limited', url: 'https://getlumbus.com' }],
  generator: 'Next.js',
  keywords: [
    'eSIM',
    'travel eSIM',
    'international data',
    'mobile data',
    'prepaid eSIM',
    'cheap roaming',
    'travel SIM card',
    'Europe eSIM',
    'Asia eSIM',
    'USA eSIM',
    'global eSIM',
    'digital SIM',
    'instant eSIM',
    'eSIM plans',
    'data roaming',
    'travel internet',
    'international SIM',
    'eSIM activation',
    'virtual SIM',
    'eSIM provider',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Lumbus',
  publisher: 'Lumbus Telecom Limited',
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
  alternates: {
    canonical: 'https://getlumbus.com',
  },
  category: 'technology',
  classification: 'Travel Technology, Telecommunications',
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lumbus",
    startupImage: [
      {
        url: '/icon-192.png',
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
          {children}
        </AuthProvider>
        <WelcomePopup />
        <Analytics />
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
