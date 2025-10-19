'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get auth code from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken) {
        // For password recovery, we need to explicitly set the session
        if (type === 'recovery' && refreshToken) {
          // Set session using the tokens from the URL
          await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // Wait a bit to ensure session is persisted
          await new Promise(resolve => setTimeout(resolve, 500));

          router.push('/auth/reset-password');
        } else {
          // Regular sign-in flow
          await supabaseClient.auth.getSession();
          router.push('/dashboard');
        }
      } else {
        // No token, redirect to login
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block  rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground font-bold">Completing sign in...</p>
      </div>
    </div>
  );
}
