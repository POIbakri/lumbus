'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback - full URL:', window.location.href);
        console.log('Auth callback - hash:', window.location.hash);

        // Check if there's a hash in the URL (from Supabase magic link)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          console.log('Hash params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type: type,
          });

          if (accessToken && refreshToken) {
            console.log('Setting session with tokens...');
            // Explicitly set the session from the URL tokens
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Failed to set session:', error);
              router.push('/login');
              return;
            }

            console.log('Session set successfully:', !!data.session);

            if (data.session) {
              // Session successfully set
              if (type === 'recovery') {
                console.log('Recovery flow - redirecting to reset password');
                // This is a password recovery - redirect to reset password
                router.push('/auth/reset-password');
              } else {
                console.log('Regular login - redirecting to dashboard');
                // Regular login - redirect to dashboard
                router.push('/dashboard');
              }
              return;
            } else {
              console.error('Session was not set even though no error occurred');
            }
          } else {
            console.error('Missing tokens in hash - accessToken:', !!accessToken, 'refreshToken:', !!refreshToken);
          }
        } else {
          console.log('No hash in URL');
        }

        // No hash parameters - check if there's an existing session
        console.log('Checking for existing session...');
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
          console.log('Found existing session, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('No session found, redirecting to login');
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
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
