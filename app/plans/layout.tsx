import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eSIM Plans - 1700+ Plans in 150+ Countries | Lumbus',
  description: '1700+ eSIM plans across 150+ countries. Compare prices, data amounts, and validity periods. Instant activation, no contracts.',
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
