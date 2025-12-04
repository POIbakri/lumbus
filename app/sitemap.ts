import { MetadataRoute } from 'next'
import { supabase } from '@/lib/db'
import { getCountriesByContinent, REGIONS, COUNTRIES } from '@/lib/countries'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const runtime = 'nodejs' // Ensure Node.js runtime for Supabase

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://getlumbus.com'
  const currentDate = new Date()

  // Fetch all active plans from database with error handling and pagination
  let plans: any[] = []
  try {
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('plans')
        .select('region_code, id, updated_at, name')
        .eq('is_active', true)
        .gte('data_gb', 0.5) // Only include plans >= 500MB
        .order('updated_at', { ascending: false })
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

    console.log(`Sitemap: Fetched ${plans.length} plans`)
  } catch (err) {
    console.error('Sitemap: Failed to fetch plans:', err)
  }

  // Generate plan URLs (grouped by region)
  const planUrlsByRegion = new Map<string, MetadataRoute.Sitemap[number]>()

  plans.forEach((plan) => {
    const regionUrl = `${baseUrl}/plans/${plan.region_code}/${plan.id}`
    const updatedDate = plan.updated_at ? new Date(plan.updated_at) : currentDate

    // Keep only the most recently updated plan per region for primary listing
    if (!planUrlsByRegion.has(plan.region_code) ||
        new Date(planUrlsByRegion.get(plan.region_code)!.lastModified!) < updatedDate) {
      planUrlsByRegion.set(plan.region_code, {
        url: regionUrl,
        lastModified: updatedDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
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

    // Individual plan pages (top per region)
    ...Array.from(planUrlsByRegion.values()),
  ]
}
