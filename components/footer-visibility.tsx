'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'

const HIDDEN_PREFIXES = ['/admin', '/dashboard', '/auth', '/api']

export function FooterVisibility() {
  const pathname = usePathname() ?? ''
  const shouldHide = HIDDEN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (shouldHide) {
    return null
  }

  return <Footer />
}

