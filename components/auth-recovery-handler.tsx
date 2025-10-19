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
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        // This is a password recovery flow
        // Set the session and redirect to reset password page
        supabaseClient.auth.getSession().then(() => {
          router.push('/auth/reset-password');
        });
      }
    }
  }, [router]);

  return null;
}
