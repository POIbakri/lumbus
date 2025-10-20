'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's a hash in the URL (from Supabase magic link)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (accessToken && refreshToken) {
            // Explicitly set the session from the URL tokens
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              router.push('/login');
              return;
            }

            if (data.session) {
              // Session successfully set
              if (type === 'recovery') {
                // This is a password recovery - redirect to reset password
                router.push('/auth/reset-password');
              } else {
                // Regular login - redirect to dashboard
                router.push('/dashboard');
              }
              return;
            }
          }
        }

        // No hash parameters - check if there's an existing session
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (err) {
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
