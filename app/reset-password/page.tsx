'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Nav } from '@/components/nav';
import { auth } from '@/lib/supabase-client';
import { triggerHaptic } from '@/lib/device-detection';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    triggerHaptic('medium');

    const { error: resetError } = await auth.resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      triggerHaptic('heavy');
    } else {
      setSuccess(true);
      setLoading(false);
      triggerHaptic('light');
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan rounded-full blur-3xl opacity-10" style={{animationDelay: '1s'}}></div>

      {/* Navigation */}
      <Nav />

      {/* Reset Password Form */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 leading-tight">
              RESET PASSWORD
            </h1>
            <p className="text-base sm:text-lg font-bold text-muted-foreground">
              {success ? 'Check your email!' : 'Enter your email to receive a reset link'}
            </p>
          </div>

          <Card className="bg-mint border-4 border-primary shadow-2xl relative overflow-hidden">
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-50 pointer-events-none"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-center">
                {success ? '✅ EMAIL SENT' : 'FORGOT PASSWORD'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 relative z-10">
              {success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/20 rounded-lg">
                    <p className="font-bold text-sm text-center">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground text-center">
                    Check your inbox and click the link to reset your password. The link will expire in 1 hour.
                  </p>
                  <div className="pt-4">
                    <Link href="/login">
                      <Button className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg py-4 sm:py-6 shadow-xl">
                        BACK TO SIGN IN
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block font-bold uppercase text-sm mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold bg-white"
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/20 text-destructive rounded-lg font-bold text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg py-4 sm:py-6 shadow-xl"
                  >
                    {loading ? 'SENDING...' : 'SEND RESET LINK'}
                  </Button>

                  <div className="text-center pt-4">
                    <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-primary">
                      ← Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {!success && (
            <div className="mt-8 p-4 bg-yellow/30 border-2 border-secondary rounded-xl">
              <p className="text-xs font-bold text-center">
                💡 <strong>TIP:</strong> If you purchased an eSIM without creating an account, you can access your order using the link sent to your email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
