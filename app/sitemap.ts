import { MetadataRoute } from 'next'
import { supabase } from '@/lib/db'
import { getCountriesByContinent, REGIONS, COUNTRIES } from '@/lib/countries'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const runtime = 'nodejs' // Ensure Node.js runtime for Supabase

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://getlumbus.com'
  const currentDate = new Date()

  // Fetch only "indexable" plans from database - plans that match our SEO criteria
  // to avoid duplicate content issues with thousands of similar plan pages
  let plans: any[] = []
  try {
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('plans')
        .select('region_code, id, updated_at, name, data_gb, validity_days, retail_price')
        .eq('is_active', true)
        .gte('data_gb', 1) // Only include plans >= 1GB (popular search terms)
        .lte('data_gb', 50) // Cap at 50GB
        .gte('validity_days', 7) // At least 7 days
        .lte('validity_days', 30) // Max 30 days (typical travel durations)
        .gte('retail_price', 3) // At least $3
        .lte('retail_price', 50) // Max $50 (typical budget)
        .order('data_gb', { ascending: true })
        .range(from, from + pageSize - 1)

      if (error) {
        console.error('Sitemap: Error fetching plans:', error)
        break
      }

      if (!data || data.length === 0) break

      plans = [...plans, ...data]

      if (data.length < pageSize) break
      from += pageSize
    }

    console.log(`Sitemap: Fetched ${plans.length} indexable plans`)
  } catch (err) {
    console.error('Sitemap: Failed to fetch plans:', err)
  }

  // Generate plan URLs - only ONE best plan per region to avoid duplicate content
  // "Best" = most typical travel plan (around 5GB, 7-14 days, good price)
  const planUrlsByRegion = new Map<string, { entry: MetadataRoute.Sitemap[number], score: number }>()

  plans.forEach((plan) => {
    const regionUrl = `${baseUrl}/plans/${plan.region_code}/${plan.id}`
    const updatedDate = plan.updated_at ? new Date(plan.updated_at) : currentDate

    // Score plans to find the "best" representative plan for each region
    // Prefer: ~5GB data, 7-14 day validity, $10-20 price range
    let score = 0
    if (plan.data_gb >= 3 && plan.data_gb <= 10) score += 3 // Sweet spot data
    if (plan.data_gb === 5) score += 2 // Most searched
    if (plan.validity_days >= 7 && plan.validity_days <= 14) score += 3 // Typical trip
    if (plan.validity_days === 7) score += 1 // Common search
    if (plan.retail_price >= 8 && plan.retail_price <= 25) score += 2 // Good value range

    const existing = planUrlsByRegion.get(plan.region_code)
    if (!existing || score > existing.score) {
      planUrlsByRegion.set(plan.region_code, {
        entry: {
          url: regionUrl,
          lastModified: updatedDate,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        },
        score,
      })
    }
  })

  // NOTE: We don't include /plans?region=XX URLs in sitemap to avoid duplicate content issues
  // These are filtered views of /plans page and should not be indexed separately
  // Users can still access them via the /plans page filters

  return [
    // Homepage - Highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // Main category pages - Very high priority
    {
      url: `${baseUrl}/plans`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/destinations`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.95,
    },

    // Important informational pages
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/device`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Support & Legal pages
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },

    // Affiliate pages
    {
      url: `${baseUrl}/affiliate-program`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Destination country pages - High priority for SEO
    // Priority destinations first (Japan, Turkey, USA, UK, Thailand, UAE, Saudi Arabia)
    ...['JP', 'TR', 'US', 'GB', 'TH', 'AE', 'SA', 'SG', 'MY', 'EG', 'QA', 'FR', 'ES', 'IT'].map(code => ({
      url: `${baseUrl}/destinations/${code.toLowerCase()}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),

    // All other destination country pages
    ...Object.keys(COUNTRIES)
      .filter(code => !['JP', 'TR', 'US', 'GB', 'TH', 'AE', 'SA', 'SG', 'MY', 'EG', 'QA', 'FR', 'ES', 'IT'].includes(code))
      .map(code => ({
        url: `${baseUrl}/destinations/${code.toLowerCase()}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),

    // Individual plan pages (ONE best plan per region to avoid duplicates)
    ...Array.from(planUrlsByRegion.values()).map(v => v.entry),
  ]
}
