import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy eSIM Plans Online - 1700+ Best eSIM Plans for 150+ Countries | Best Prices 2025',
  description: 'Buy best eSIM plans online for travel. 1700+ plans in 150+ countries. Compare prices & find best eSIM deals. Instant activation, no signup. Best eSIM provider 2025.',
  keywords: [
    'eSIM plans',
    'buy data plan',
    'prepaid eSIM',
    'international data plans',
    'travel internet',
    'cheap data packages',
    'no contract eSIM',
    'pay as you go data',
    'eSIM deals',
    'best eSIM prices',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/plans',
  },
  openGraph: {
    title: 'eSIM Plans - 1700+ Plans in 150+ Countries',
    description: 'Compare and buy eSIM plans for 150+ countries. Instant activation.',
    url: 'https://getlumbus.com/plans',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
