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
        robots: { index: false, follow: false },
      };
    }

    const countryInfo = getCountryInfo(plan.region_code);
    const dataAmount = formatDataAmount(plan.data_gb);

    // Only index plans that are "best value" - good data/price ratio and popular data amounts
    // This prevents thousands of near-duplicate pages from being indexed
    const popularDataAmounts = [1, 2, 3, 5, 10, 15, 20, 30, 50]; // GB
    const isPopularDataAmount = popularDataAmounts.includes(plan.data_gb) ||
                                (plan.data_gb >= 1 && plan.data_gb <= 5);
    const isGoodValidity = plan.validity_days >= 7 && plan.validity_days <= 30;
    const isReasonablyPriced = plan.retail_price >= 3 && plan.retail_price <= 50;

    // Only index if it's a "typical" travel plan that users would search for
    const shouldIndex = isPopularDataAmount && isGoodValidity && isReasonablyPriced;

    return {
      title: `Buy ${dataAmount} eSIM for ${countryInfo.name} - ${plan.validity_days} Days $${plan.retail_price.toFixed(2)} | Best Price`,
      description: `Buy cheap ${countryInfo.name} eSIM online. ${dataAmount} data for ${plan.validity_days} days. Only $${plan.retail_price.toFixed(2)}. Instant activation, no signup. Best ${countryInfo.name} travel eSIM 2025.`,
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
        index: shouldIndex,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: 'eSIM Plan | Lumbus',
      alternates: { canonical: canonicalUrl },
      robots: { index: false, follow: true },
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
