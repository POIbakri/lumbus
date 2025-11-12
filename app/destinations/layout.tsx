import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eSIM Destinations - Buy eSIM for 150+ Countries | Best Travel eSIM 2025',
  description: 'Buy eSIM for 150+ countries worldwide. Best eSIM plans for USA, Europe, Asia, Africa, Americas. Compare prices by destination. Instant activation, no signup.',
  keywords: [
    'eSIM destinations',
    'buy eSIM by country',
    'travel eSIM countries',
    'international eSIM',
    'eSIM coverage',
    'eSIM worldwide',
    'global eSIM',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/destinations',
  },
  openGraph: {
    title: 'eSIM for 150+ Countries - Best Travel eSIM Destinations',
    description: 'Buy eSIM for 150+ countries. Compare prices by destination. Instant activation.',
    url: 'https://getlumbus.com/destinations',
    type: 'website',
  },
};

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
