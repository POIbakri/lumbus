'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Nav } from '@/components/nav';
import { auth } from '@/lib/supabase-client';
import { triggerHaptic } from '@/lib/device-detection';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user has a valid session (from reset link)
    const checkSession = async () => {
      // Wait a moment for session to be properly set from the redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      const { session } = await auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    triggerHaptic('medium');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      triggerHaptic('heavy');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      triggerHaptic('heavy');
      return;
    }

    const { error: updateError } = await auth.updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      triggerHaptic('heavy');
    } else {
      setSuccess(true);
      setLoading(false);
      triggerHaptic('light');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan rounded-full blur-3xl opacity-10" style={{animationDelay: '1s'}}></div>

      {/* Navigation */}
      <Nav />

      {/* Update Password Form */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 leading-tight">
              {success ? 'ALL SET!' : 'NEW PASSWORD'}
            </h1>
            <p className="text-base sm:text-lg font-bold text-muted-foreground">
              {success ? 'Your password has been updated' : 'Enter your new password'}
            </p>
          </div>

          <Card className="bg-mint border-4 border-primary shadow-2xl relative overflow-hidden">
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-50 pointer-events-none"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-center">
                {success ? '✅ SUCCESS' : 'UPDATE PASSWORD'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 relative z-10">
              {success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/20 rounded-lg">
                    <p className="font-bold text-sm text-center">
                      Your password has been successfully updated!
                    </p>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground text-center">
                    Redirecting to your dashboard...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block font-bold uppercase text-sm mb-2">
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold bg-white"
                      disabled={loading}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-bold">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block font-bold uppercase text-sm mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold bg-white"
                      disabled={loading}
                      required
                      minLength={8}
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/20 text-destructive rounded-lg font-bold text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !!error.includes('Invalid or expired')}
                    className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg py-4 sm:py-6 shadow-xl"
                  >
                    {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                  </Button>

                  {error.includes('Invalid or expired') && (
                    <div className="text-center pt-4">
                      <Link href="/reset-password">
                        <Button className="w-full btn-lumbus bg-yellow text-foreground hover:bg-yellow/90 font-black text-base">
                          REQUEST NEW RESET LINK
                        </Button>
                      </Link>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {!success && (
            <div className="mt-8 text-center">
              <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-primary">
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
