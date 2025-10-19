'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

/**
 * Handles password recovery redirects when Supabase sends users to the homepage
 * instead of the auth callback page
 */
export function AuthRecoveryHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if URL has recovery hash parameters
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        // This is a password recovery flow
        // Set the session explicitly and redirect to reset password page
        supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(() => {
          // Wait a bit to ensure session is persisted
          setTimeout(() => {
            router.push('/auth/reset-password');
          }, 500);
        });
      }
    }
  }, [router]);

  return null;
}
