/**
 * Authenticated API client for making requests to internal APIs
 * Automatically includes Supabase auth token in requests
 */

import { supabaseClient } from './supabase-client';

/**
 * Make an authenticated fetch request
 * Automatically adds Authorization header with Supabase JWT token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current session
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Add auth header to request
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated GET request and return JSON
 */
export async function authenticatedGet<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated POST request and return JSON
 */
export async function authenticatedPost<T>(
  url: string,
  body?: unknown
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
