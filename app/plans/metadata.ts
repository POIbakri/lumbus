import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'eSIM Data Plans - 1700+ Plans for 150+ Countries',
  description: 'Browse 1700+ eSIM data plans for 150+ countries. Compare prices, data allowances, and validity periods. Instant activation. Works at home and abroad. From $4.50.',
  keywords: [
    'eSIM plans',
    'data plans',
    'international data',
    'prepaid eSIM',
    'buy eSIM',
    'eSIM prices',
    'cheap eSIM',
    'travel data plans',
    'global eSIM plans',
  ],
  openGraph: {
    title: 'eSIM Data Plans - 1700+ Plans for 150+ Countries | Lumbus',
    description: 'Browse and compare eSIM plans for worldwide travel and home use. Instant activation, no signup required.',
    url: 'https://getlumbus.com/plans',
    type: 'website',
    images: [
      {
        url: '/og-image-plans.png',
        width: 1200,
        height: 630,
        alt: 'Lumbus eSIM Plans - 1700+ Options',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Data Plans - 1700+ Plans for 150+ Countries',
    description: 'Compare eSIM plans for 150+ countries. Instant activation from $4.50.',
    images: ['/og-image-plans.png'],
  },
  alternates: {
    canonical: 'https://getlumbus.com/plans',
  },
}
