import { NextRequest, NextResponse } from 'next/server';
import { APP_STORE_LINKS } from '@/lib/app-store-config';

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent) ||
    (userAgent.includes('Mac') && 'ontouchend' in globalThis);

  // Android detection
  const isAndroid = /android/i.test(userAgent);

  // Determine redirect URL
  let redirectUrl: string;

  if (isIOS) {
    redirectUrl = APP_STORE_LINKS.ios;
  } else if (isAndroid) {
    redirectUrl = APP_STORE_LINKS.android;
  } else {
    // Desktop or unknown - redirect to homepage
    redirectUrl = 'https://getlumbus.com';
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
