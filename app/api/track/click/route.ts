/**
 * Tracking API - Click Attribution
 * POST /api/track/click
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackClick } from '@/lib/referral';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 50, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Cookie security settings - use secure flag if production OR HTTPS
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = request.url?.startsWith('https://') || false;
    const useSecureCookies = isProduction || isHttps;
    const cookieSameSite = isProduction ? 'strict' : 'lax';

    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Rate limit check
    if (!checkRateLimit(ip, 50, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse body
    const body = await request.json();
    const {
      affiliate_slug,
      ref_code,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      landing_path,
    } = body;

    // Get or create session ID
    const cookies = request.cookies;
    let sessionId = cookies.get('sid')?.value;

    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined;

    // Track the click
    const click = await trackClick({
      affiliateSlug: affiliate_slug,
      refCode: ref_code,
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      utmContent: utm_content,
      utmTerm: utm_term,
      userAgent,
      ipAddress: ip,
      landingPath: landing_path || '/',
      sessionId,
    });

    // Set cookies
    const response = NextResponse.json({
      ok: true,
      click_id: click?.id || null,
    });

    // Set session cookie
    response.cookies.set('sid', sessionId, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: cookieSameSite,
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: '/',
    });

    // Set affiliate click cookie
    if (click && click.affiliate_id) {
      response.cookies.set('afid', click.id.toString(), {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: cookieSameSite,
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: '/',
      });
    }

    // Set referral code cookie
    if (ref_code) {
      response.cookies.set('rfcd', ref_code, {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: cookieSameSite,
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Track click error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
