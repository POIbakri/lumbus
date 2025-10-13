'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Nav } from '@/components/nav';
import { auth } from '@/lib/supabase-client';
import { triggerHaptic } from '@/lib/device-detection';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    triggerHaptic('medium');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      triggerHaptic('heavy');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      triggerHaptic('heavy');
      return;
    }

    const { error: signUpError } = await auth.signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      triggerHaptic('heavy');
    } else {
      setSuccess(true);
      triggerHaptic('light');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    triggerHaptic('medium');
    const { error: googleError } = await auth.signInWithGoogle();

    if (googleError) {
      setError(googleError.message);
      setLoading(false);
      triggerHaptic('heavy');
    }
  };

  const handleAppleSignUp = async () => {
    setLoading(true);
    triggerHaptic('medium');
    const { error: appleError } = await auth.signInWithApple();

    if (appleError) {
      setError(appleError.message);
      setLoading(false);
      triggerHaptic('heavy');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center animate-slide-up">
          <div className="inline-block p-8 bg-primary rounded-full mb-6 animate-bounce-subtle">
            <div className="text-6xl">✓</div>
          </div>
          <h1 className="heading-xl mb-4">
            WELCOME TO LUMBUS!
          </h1>
          <p className="text-xl font-bold text-muted-foreground">
            Check your email to verify your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-cyan rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-yellow rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{animationDelay: '1s'}}></div>

      {/* Navigation */}
      <Nav />

      {/* Sign Up Form */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md relative z-10">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="heading-xl mb-4">
              GET STARTED
            </h1>
            <p className="text-lg font-bold text-muted-foreground">
              Create your account and stay connected worldwide
            </p>
          </div>

          <Card className="bg-yellow border-4 border-secondary shadow-2xl hover-lift card-stack relative overflow-hidden animate-slide-up" style={{animationDelay: '0.1s'}}>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-50 pointer-events-none"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="heading-md text-center">CREATE ACCOUNT</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              {/* Social Sign Up */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="w-full btn-lumbus bg-white text-foreground border-2 border-foreground/20 hover:bg-foreground/5 font-black text-base py-6 shadow-lg touch-ripple elastic-bounce"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </span>
                </Button>

                <Button
                  onClick={handleAppleSignUp}
                  disabled={loading}
                  className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base py-6 shadow-lg touch-ripple elastic-bounce"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Sign up with Apple
                  </span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-foreground/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-yellow font-black uppercase">Or with email</span>
                </div>
              </div>

              {/* Email Sign Up Form */}
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block font-bold uppercase text-sm mb-2">
                    Email
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

                <div>
                  <label htmlFor="password" className="block font-bold uppercase text-sm mb-2">
                    Password
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
                  />
                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    Minimum 6 characters
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
                  className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-lg py-6 shadow-xl touch-ripple elastic-bounce pulse-glow"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </Button>
              </form>

              <p className="text-xs font-bold text-center text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>

              <div className="border-t-2 border-foreground/10 pt-6 text-center">
                <p className="font-bold text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-black">
                    SIGN IN
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/plans" className="font-bold text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
