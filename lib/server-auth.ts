/**
 * Server-side authentication helpers for API routes
 * Uses Supabase Auth JWT tokens from request headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Get authenticated user from request
 * Checks the Authorization header for JWT token
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<{
  user: { id: string; email: string } | null;
  error: string | null;
}> {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with service role for server-side auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the JWT token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
      },
      error: null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Require authentication middleware
 * Returns error response if user is not authenticated
 */
export async function requireUserAuth(req: NextRequest): Promise<{
  user: { id: string; email: string };
  error: null;
} | {
  user: null;
  error: NextResponse;
}> {
  const { user, error } = await getAuthenticatedUser(req);

  if (!user || error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized', message: error || 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}
