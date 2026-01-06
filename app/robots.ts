import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://getlumbus.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/install/*',
          '/topup/*',
          '/r/*',
          '/a/*',
          // Block Next.js static chunks from being crawled
          '/_next/',
          // Block query parameter URLs (duplicate content)
          '/plans?*',
          '/destinations?*',
          // Block other non-content URLs
          '/*.js$',
          '/*.css$',
        ],
      },
      {
        // OpenAI's ChatGPT crawler
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/plans',
          '/destinations',
          '/how-it-works',
          '/help',
          '/device',
          '/affiliate-program',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/auth/',
        ],
      },
      {
        // Google's Gemini/Bard crawler
        userAgent: 'Google-Extended',
        allow: [
          '/',
          '/plans',
          '/destinations',
          '/how-it-works',
          '/help',
          '/device',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
        ],
      },
      {
        // Anthropic's Claude crawler (future-proofing)
        userAgent: 'anthropic-ai',
        allow: [
          '/',
          '/plans',
          '/destinations',
          '/how-it-works',
          '/help',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      {
        // Common Good Crawlers (for AI training with permission)
        userAgent: 'CCBot',
        allow: [
          '/',
          '/plans',
          '/destinations',
          '/help',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
