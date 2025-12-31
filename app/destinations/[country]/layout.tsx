import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COUNTRIES } from '@/lib/countries';

// Force dynamic rendering - pages are generated on-demand
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ country: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryCode = country.toUpperCase();
  const countryInfo = COUNTRIES[countryCode];
  const currentYear = new Date().getFullYear();

  if (!countryInfo) {
    // Return noindex for invalid countries - the page will return 404
    return {
      title: 'Destination Not Found',
      description: 'This destination is not available.',
      robots: { index: false, follow: false },
    };
  }

  const countryName = countryInfo.name;

  return {
    title: `Best eSIM for ${countryName} (${currentYear}) - Instant Delivery | Lumbus`,
    description: `Buy cheap ${countryName} eSIM online. Instant delivery, no signup required. Up to 10x cheaper than roaming. Get connected in ${countryName} in 5 minutes with Lumbus eSIM.`,
    keywords: [
      `${countryName} eSIM`,
      `${countryName} travel SIM`,
      `best ${countryName} eSIM`,
      `cheap ${countryName} eSIM`,
      `${countryName} data plan`,
      `${countryName} tourist SIM`,
      `buy eSIM ${countryName}`,
      `${countryName} prepaid SIM`,
      `${countryName} internet`,
      `${countryName} mobile data`,
      `eSIM for ${countryName}`,
      `${countryCode} eSIM`,
      'travel eSIM',
      'international eSIM',
      'Lumbus eSIM',
    ],
    openGraph: {
      title: `Best eSIM for ${countryName} (${currentYear}) - Instant Delivery`,
      description: `Get instant eSIM for ${countryName}. Up to 10x cheaper than roaming. No signup required. Activated in seconds.`,
      url: `https://getlumbus.com/destinations/${country.toLowerCase()}`,
      siteName: 'Lumbus',
      locale: 'en_GB',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${countryName} eSIM - Lumbus`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best eSIM for ${countryName} (${currentYear}) - Instant Delivery`,
      description: `Get instant eSIM for ${countryName}. Up to 10x cheaper than roaming. Activated in seconds.`,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://getlumbus.com/destinations/${country.toLowerCase()}`,
    },
  };
}

export default function CountryLayout({ children }: Props) {
  return <>{children}</>;
}
