import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security and SEO headers
  const headers = response.headers

  // Security Headers
  headers.set('X-DNS-Prefetch-Control', 'on')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // SEO: Add canonical URL hint (actual canonical is in metadata)
  const url = request.nextUrl.clone()
  const canonicalUrl = `https://getlumbus.com${url.pathname}`

  // Prevent indexing of filtered/paginated URLs to avoid duplicate content
  const hasQueryParams = url.search && url.search.length > 0
  const isPlansPage = url.pathname === '/plans'

  if (isPlansPage && hasQueryParams) {
    // Set noindex for filtered views like /plans?region=US
    headers.set('X-Robots-Tag', 'noindex, follow')
  }

  // Content Security Policy (adjust as needed)
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://accounts.google.com https://embed.tawk.to https://*.tawk.to https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://embed.tawk.to https://*.tawk.to",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://accounts.google.com https://appleid.apple.com https://embed.tawk.to https://va.tawk.to https://tawk.to https://vitals.vercel-insights.com https://va.vercel-scripts.com wss://*.tawk.to",
      "frame-src 'self' https://js.stripe.com https://accounts.google.com https://appleid.apple.com https://tawk.to https://*.tawk.to",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com https://appleid.apple.com",
    ].join('; ')
  )

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|xml|txt)$).*)',
  ],
}
