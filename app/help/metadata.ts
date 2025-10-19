import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center - eSIM Support & FAQ',
  description: 'Get help with your Lumbus eSIM. Find answers to common questions about installation, activation, compatibility, data usage, and troubleshooting. 24/7 support available.',
  keywords: [
    'eSIM help',
    'eSIM support',
    'eSIM FAQ',
    'eSIM troubleshooting',
    'eSIM questions',
    'eSIM customer service',
    'eSIM assistance',
  ],
  openGraph: {
    title: 'Help Center - eSIM Support & FAQ | Lumbus',
    description: 'Find answers to all your eSIM questions. 24/7 support available.',
    url: 'https://getlumbus.com/help',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lumbus eSIM Help Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center - eSIM Support & FAQ',
    description: 'Get instant help with your eSIM. FAQ and 24/7 support.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://getlumbus.com/help',
  },
}
