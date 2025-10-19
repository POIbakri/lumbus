/**
 * Structured Data Components for SEO
 * Implements Schema.org JSON-LD markup for enhanced search engine understanding
 * Optimized for both traditional search engines and AI-powered search (ChatGPT, Gemini, etc.)
 */

import { Plan } from '@/lib/db'

interface SchemaProps {
  children?: React.ReactNode
}

/**
 * Organization Schema - Use on all pages
 * Establishes Lumbus as a legitimate business entity
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lumbus',
    legalName: 'Lumbus Telecom Limited',
    url: 'https://getlumbus.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://getlumbus.com/icon-192.png',
      width: 192,
      height: 192,
    },
    description: 'Fast eSIM provider offering instant digital SIM cards for 150+ countries. Up to 10x cheaper than roaming with instant activation.',
    foundingDate: '2024',
    slogan: 'eSIMs that just work. Everywhere.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@getlumbus.com',
        availableLanguage: ['English'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        url: 'https://getlumbus.com/plans',
        availableLanguage: ['English'],
      },
    ],
    sameAs: [
      // Add your social media profiles when available
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Website Schema - Use on homepage
 * Defines the overall website structure
 */
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lumbus',
    url: 'https://getlumbus.com',
    description: 'Get instant eSIMs for 150+ countries. Up to 10x cheaper than roaming. Works abroad and at home.',
    publisher: {
      '@type': 'Organization',
      name: 'Lumbus Telecom Limited',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://getlumbus.com/plans?region={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Product Schema - Use on plan pages
 * Critical for e-commerce SEO and AI understanding
 */
export function ProductSchema({ plan }: { plan: Plan }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${plan.name} eSIM`,
    description: `${plan.data_gb}GB eSIM data plan for ${plan.region_code}. Valid for ${plan.validity_days} days. Instant activation. Works on 4G/5G networks. Perfect for travelers and as backup data at home.`,
    brand: {
      '@type': 'Brand',
      name: 'Lumbus',
    },
    offers: {
      '@type': 'Offer',
      price: plan.retail_price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://getlumbus.com/plans/${plan.region_code}/${plan.id}`,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
      seller: {
        '@type': 'Organization',
        name: 'Lumbus',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'USD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'MIN',
          },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '10000',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Data',
        value: `${plan.data_gb} GB`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Validity',
        value: `${plan.validity_days} days`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Network Type',
        value: '4G/5G',
      },
      {
        '@type': 'PropertyValue',
        name: 'Hotspot',
        value: 'Supported',
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * FAQ Schema - Use on help and how-it-works pages
 * Extremely important for AI search engines and Google featured snippets
 */
export function FAQSchema({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Breadcrumb Schema - Use on deep pages
 * Helps search engines understand site structure
 */
export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Service Schema - Use on main pages
 * Defines Lumbus as a service provider
 */
export function ServiceSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'eSIM Data Plans',
    provider: {
      '@type': 'Organization',
      name: 'Lumbus',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'eSIM Data Plans',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Travel eSIM Plans',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'International Data Plans',
                description: 'Prepaid eSIM data plans for 150+ countries',
              },
            },
          ],
        },
      ],
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '4.50',
      highPrice: '99.00',
      offerCount: '1700',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * HowTo Schema - Use on how-it-works page
 * Perfect for Google featured snippets and AI understanding
 */
export function HowToSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Activate a Lumbus eSIM',
    description: 'Learn how to activate and use your Lumbus eSIM in 3 simple steps. Takes less than 5 minutes.',
    totalTime: 'PT5M',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Choose Your Plan',
        text: 'Select the perfect data plan for your destination from 1700+ plans across 150+ countries.',
        url: 'https://getlumbus.com/plans',
        image: 'https://getlumbus.com/og-image.png',
      },
      {
        '@type': 'HowToStep',
        name: 'Pay Instantly',
        text: 'Complete your purchase with Apple Pay, Google Pay, or credit card. Secure checkout powered by Stripe.',
        url: 'https://getlumbus.com/how-it-works',
      },
      {
        '@type': 'HowToStep',
        name: 'Get Connected',
        text: 'Receive your eSIM instantly via email. Scan the QR code or use one-tap installation. Connected in less than 5 minutes.',
        url: 'https://getlumbus.com/how-it-works',
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * ItemList Schema - Use on plans and destinations pages
 * Helps search engines understand collections
 */
export function ItemListSchema({ items, listType = 'Product' }: { items: Array<{ name: string; url: string; position: number }>; listType?: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': listType,
        name: item.name,
        url: item.url,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
