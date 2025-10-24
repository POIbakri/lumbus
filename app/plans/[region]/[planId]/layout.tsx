import { Metadata } from 'next';
import { supabase } from '@/lib/db';
import { getCountryInfo } from '@/lib/countries';

// Format data amounts
function formatDataAmount(dataGB: number): string {
  if (dataGB >= 1) return `${dataGB} GB`;
  const dataMB = dataGB * 1024;
  if (dataMB <= 110) return '100 MB';
  if (dataMB <= 250) return '200 MB';
  if (dataMB <= 550) return '500 MB';
  return `${Math.round(dataMB / 50) * 50} MB`;
}

export async function generateMetadata({
  params
}: {
  params: { region: string; planId: string }
}): Promise<Metadata> {
  const { planId, region } = params;
  const baseUrl = 'https://getlumbus.com';
  const canonicalUrl = `${baseUrl}/plans/${region}/${planId}`;

  try {
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return {
        title: 'Plan Not Found | Lumbus',
        alternates: { canonical: canonicalUrl },
      };
    }

    const countryInfo = getCountryInfo(plan.region_code);
    const dataAmount = formatDataAmount(plan.data_gb);

    return {
      title: `${dataAmount} eSIM for ${countryInfo.name} - ${plan.validity_days} Days | Lumbus`,
      description: `Get ${dataAmount} of high-speed data in ${countryInfo.name} for ${plan.validity_days} days. Instant activation, no contracts. Only $${plan.retail_price.toFixed(2)}.`,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${dataAmount} eSIM for ${countryInfo.name}`,
        description: `${dataAmount} data for ${plan.validity_days} days in ${countryInfo.name}`,
        url: canonicalUrl,
        type: 'website',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: 'eSIM Plan | Lumbus',
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default function PlanDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
