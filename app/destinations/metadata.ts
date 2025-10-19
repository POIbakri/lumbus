import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'eSIM Destinations - 150+ Countries | Instant Global Connectivity',
  description: 'Find eSIM plans for your destination. Coverage in 150+ countries including USA, UK, Europe, Asia, and more. Instant activation, no signup required. Works at home too.',
  keywords: [
    'eSIM destinations',
    'eSIM countries',
    'global coverage',
    'Europe eSIM',
    'Asia eSIM',
    'USA eSIM',
    'UK eSIM',
    'travel destinations',
    'international coverage',
  ],
  openGraph: {
    title: 'eSIM Destinations - 150+ Countries | Lumbus',
    description: 'Explore eSIM coverage across 150+ countries. Find the perfect plan for your destination.',
    url: 'https://getlumbus.com/destinations',
    type: 'website',
    images: [
      {
        url: '/og-image-destinations.png',
        width: 1200,
        height: 630,
        alt: 'Lumbus eSIM - Global Coverage Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Destinations - 150+ Countries',
    description: 'Find eSIM plans for your destination. Global coverage made easy.',
    images: ['/og-image-destinations.png'],
  },
  alternates: {
    canonical: 'https://getlumbus.com/destinations',
  },
}
