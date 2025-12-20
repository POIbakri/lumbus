/**
 * API endpoint for user signup
 * Allows mobile apps to specify their own redirect URL for email confirmation
 *
 * POST /api/auth/signup
 * Body: { email, password, redirectUrl?, source? }
 *
 * Mobile app usage:
 * - Pass redirectUrl: 'https://getlumbus.com/auth/confirm' for universal links (recommended)
 * - Or pass redirectUrl: 'lumbus://auth/confirm' for custom URL scheme
 *
 * IMPORTANT: The redirectUrl must also be added to Supabase Dashboard:
 * Authentication → URL Configuration → Redirect URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Default redirect URL
const DEFAULT_WEB_REDIRECT = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  : 'https://getlumbus.com/auth/callback';

// Allowed redirect URL patterns (security: only allow our domains/schemes)
const ALLOWED_REDIRECT_PATTERNS = [
  /^https:\/\/getlumbus\.com\//,
  /^https:\/\/www\.getlumbus\.com\//,
  /^lumbus:\/\//,  // Custom URL scheme for app
  /^https:\/\/.*\.vercel\.app\//,  // Allow Vercel preview deployments
];

function isValidRedirectUrl(url: string): boolean {
  return ALLOWED_REDIRECT_PATTERNS.some(pattern => pattern.test(url));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, redirectUrl, source } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Determine redirect URL
    let finalRedirectUrl = DEFAULT_WEB_REDIRECT;

    if (redirectUrl) {
      if (isValidRedirectUrl(redirectUrl)) {
        finalRedirectUrl = redirectUrl;
      } else {
        console.warn(`Invalid redirect URL attempted: ${redirectUrl}`);
        // Continue with default - don't expose validation details to client
      }
    }

    // Create Supabase client (server-side, no persistence needed)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sign up the user - Supabase automatically sends confirmation email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: finalRedirectUrl,
        data: {
          signup_source: source || 'api',
        },
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      console.error('Signup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Check if user already exists (Supabase returns user with identities: [] for existing)
    if (data.user && data.user.identities?.length === 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      message: 'Please check your email to confirm your account',
    });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
