import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works - eSIM Activation in 3 Easy Steps',
  description: 'Learn how to activate your Lumbus eSIM in less than 5 minutes. Simple 3-step process: Choose plan, pay instantly, get connected. QR code or one-tap installation.',
  keywords: [
    'how eSIM works',
    'eSIM activation',
    'install eSIM',
    'eSIM setup',
    'activate eSIM',
    'eSIM tutorial',
    'eSIM guide',
    'use eSIM',
  ],
  openGraph: {
    title: 'How It Works - eSIM Activation in 3 Easy Steps | Lumbus',
    description: 'Activate your eSIM in under 5 minutes with our simple 3-step process.',
    url: 'https://getlumbus.com/how-it-works',
    type: 'website',
    images: [
      {
        url: '/og-image-how-it-works.png',
        width: 1200,
        height: 630,
        alt: 'How Lumbus eSIM Works - 3 Simple Steps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works - eSIM Activation in 3 Easy Steps',
    description: 'Get connected in under 5 minutes. Simple, fast, secure.',
    images: ['/og-image-how-it-works.png'],
  },
  alternates: {
    canonical: 'https://getlumbus.com/how-it-works',
  },
}
