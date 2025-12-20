'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

/**
 * Email Confirmation Handler
 *
 * This page handles email confirmation links for users who:
 * 1. Don't have the mobile app installed (fallback from universal link)
 * 2. Are on desktop/web
 *
 * URL format: /auth/confirm?token=...&type=signup
 *
 * The mobile app handles this via deep link: lumbus://auth/confirm?token=...&type=signup
 */

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL parameters
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite';

        // Also check for hash parameters (Supabase redirect format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // If we have access tokens in hash, session is already set by Supabase redirect
        if (accessToken && refreshToken) {
          const { error } = await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus('error');
            setErrorMessage('Failed to set session. Please try logging in.');
            return;
          }

          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1500);
          return;
        }

        // If we have a token, verify it with Supabase
        const verifyToken = token || tokenHash;
        if (verifyToken && type) {
          const { error } = await supabaseClient.auth.verifyOtp({
            token_hash: verifyToken,
            type: type === 'signup' ? 'email' : type,
          });

          if (error) {
            console.error('Email verification error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Verification failed. The link may have expired.');
            return;
          }

          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1500);
          return;
        }

        // No valid parameters found
        setStatus('error');
        setErrorMessage('Invalid confirmation link. Please request a new one.');

      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'verifying' && (
          <>
            <div className="inline-block rounded-full h-12 w-12 border-b-2 border-primary mb-4 animate-spin"></div>
            <h1 className="text-2xl font-black uppercase mb-2">Verifying Email</h1>
            <p className="text-muted-foreground font-bold">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-block p-6 bg-green-500 rounded-full mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black uppercase mb-2">Email Verified!</h1>
            <p className="text-muted-foreground font-bold">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-block p-6 bg-red-500 rounded-full mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-black uppercase mb-2">Verification Failed</h1>
            <p className="text-muted-foreground font-bold mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-primary text-white font-black uppercase rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="w-full px-6 py-3 bg-gray-100 text-foreground font-black uppercase rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Up Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block rounded-full h-12 w-12 border-b-2 border-primary mb-4 animate-spin"></div>
        <p className="text-muted-foreground font-bold">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmContent />
    </Suspense>
  );
}
