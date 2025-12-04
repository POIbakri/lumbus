import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eSIM Affiliate Program - Earn 12% Commission | Join Lumbus Partners',
  description: 'Join the Lumbus eSIM affiliate program and earn 12% commission on every sale. 90-day cookie window, monthly payouts, no earnings cap. Perfect for travel bloggers, influencers, and content creators.',
  keywords: [
    'eSIM affiliate program',
    'travel affiliate program',
    'eSIM referral program',
    'earn commission eSIM',
    'travel blogger affiliate',
    'digital nomad affiliate',
    'Lumbus affiliate',
    'eSIM partner program',
    'travel influencer affiliate',
    'mobile data affiliate',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/affiliate-program',
  },
  openGraph: {
    title: 'eSIM Affiliate Program - Earn 12% Commission | Lumbus',
    description: 'Join Lumbus affiliate program. Earn 12% on every eSIM sale. 90-day cookies, monthly payouts, no cap.',
    url: 'https://getlumbus.com/affiliate-program',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lumbus eSIM Affiliate Program',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Affiliate Program - Earn 12% Commission',
    description: 'Join Lumbus affiliate program. Earn 12% on every eSIM sale with 90-day cookies.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
