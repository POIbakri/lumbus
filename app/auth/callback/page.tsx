'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import { supabaseClient } from '@/lib/supabase-client';

/**
 * Send welcome email for new users after email confirmation
 * This is triggered when users land on this page after clicking confirmation link
 * The API checks webhook_events for duplicates to prevent double emails
 */
function sendWelcomeEmailFallback(userId: string, email: string, userName?: string) {
  // Delay 5 seconds to allow webhook to record event first (prevents race condition duplicates)
  setTimeout(() => {
    const payload = JSON.stringify({ userId, email, userName });

    // Try sendBeacon first (most reliable for fire-and-forget)
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'text/plain' });
        const queued = navigator.sendBeacon('/api/user/welcome-email', blob);
        if (queued) return;
      }
    } catch {
      // sendBeacon threw, fall through to fetch
    }

    // Fallback to fetch with keepalive
    fetch('/api/user/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Silently ignore - this is fire-and-forget
    });
  }, 5000);
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's a hash in the URL (from Supabase magic link/OAuth)
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
                return;
              }

              // Handle welcome email for new users who just confirmed their email
              // This is the main trigger for welcome emails after email confirmation
              const user = data.session.user;
              const createdAt = new Date(user.created_at);
              const now = new Date();
              // Consider "new" if created within last 10 minutes (allows for email confirmation delay)
              const isNewUser = (now.getTime() - createdAt.getTime()) < 600000;

              if (isNewUser && user.email) {
                // Extract name from user metadata (OAuth providers often include this)
                const userName = user.user_metadata?.full_name || user.user_metadata?.name;

                // Send welcome email (delayed 5s to avoid race conditions with webhook)
                // The API checks webhook_events for duplicates, so no double emails
                sendWelcomeEmailFallback(user.id, user.email, userName);

                // Track OAuth signup (email signups are tracked in signup page)
                const provider = user.app_metadata?.provider;
                if (provider && provider !== 'email') {
                  track('Signup', { method: provider });
                }
              }

              // Redirect to dashboard
              router.push('/dashboard');
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
