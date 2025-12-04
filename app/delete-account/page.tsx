'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { supabaseClient } from '@/lib/supabase-client';
import { triggerHaptic } from '@/lib/device-detection';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== 'delete my account') {
      setError('Please type "DELETE MY ACCOUNT" exactly to confirm');
      triggerHaptic('medium');
      return;
    }

    setIsDeleting(true);
    setError('');
    triggerHaptic('heavy');

    try {
      // Get the current session token
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      // Call the delete account API
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          confirmText: confirmText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out the user
      await supabaseClient.auth.signOut();

      // Redirect to homepage with success message
      router.push('/?account_deleted=true');
    } catch (err) {
      console.error('Delete account error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete account. Please contact support at support@getlumbus.com'
      );
      triggerHaptic('medium');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <div className="flex justify-center mb-4">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-3 sm:mb-4 leading-tight">
              DELETE MY ACCOUNT
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground">
              This action cannot be undone
            </p>
          </div>

          {!showConfirmation ? (
            <Card className="bg-white border-2 sm:border-4 border-foreground shadow-xl rounded-2xl sm:rounded-3xl">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                {/* Warning Section */}
                <div className="bg-yellow rounded-xl p-4 sm:p-6 border-2 border-secondary/20 mb-4 sm:mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black uppercase mb-2">
                        IMPORTANT WARNING
                      </h2>
                      <p className="text-xs sm:text-sm font-bold text-foreground/80">
                        Deleting your account will permanently remove:
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 ml-10 sm:ml-12">
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1">
                      <svg className="w-4 h-4 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> All your eSIM orders and data
                    </li>
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1">
                      <svg className="w-4 h-4 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Your account information and settings
                    </li>
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1">
                      <svg className="w-4 h-4 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Referral rewards and data wallet
                    </li>
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1">
                      <svg className="w-4 h-4 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Access to active eSIM plans
                    </li>
                  </ul>
                </div>

                {/* What Happens Section */}
                <div className="bg-purple rounded-xl p-4 sm:p-6 border-2 border-accent/20 mb-4 sm:mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black uppercase mb-2">
                        WHAT HAPPENS NEXT
                      </h2>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-2">
                      <span className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">1</span> Your account will be immediately deleted
                    </li>
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-2">
                      <span className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">2</span> Active eSIMs will continue to work until expiry
                    </li>
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-2">
                      <span className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">3</span> You will be logged out automatically
                    </li>
                    <li className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-2">
                      <span className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">4</span> You can create a new account anytime
                    </li>
                  </ul>
                </div>

                {/* Alternative Section */}
                <div className="bg-mint rounded-xl p-4 sm:p-6 border-2 border-primary/20 mb-6 sm:mb-8">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                    <div>
                      <h2 className="text-base sm:text-lg font-black uppercase mb-2">
                        NEED HELP?
                      </h2>
                      <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-3">
                        If you're having issues, our support team can help:
                      </p>
                      <a
                        href="mailto:support@getlumbus.com"
                        className="text-xs sm:text-sm font-black text-primary hover:text-primary/80 underline"
                      >
                        support@getlumbus.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:flex-1 btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black py-4 text-sm sm:text-base border-2 border-foreground"
                  >
                    ← BACK TO DASHBOARD
                  </Button>
                  <Button
                    onClick={() => {
                      setShowConfirmation(true);
                      triggerHaptic('medium');
                    }}
                    className="w-full sm:flex-1 btn-lumbus bg-destructive text-white hover:bg-destructive/90 font-black py-4 text-sm sm:text-base border-2 border-foreground"
                  >
                    PROCEED TO DELETE
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-2 sm:border-4 border-destructive shadow-xl rounded-2xl sm:rounded-3xl">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                {/* Final Confirmation */}
                <div className="bg-destructive/10 rounded-xl p-4 sm:p-6 border-2 border-destructive/30 mb-6">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-3">🚨</div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 text-destructive">
                      FINAL CONFIRMATION
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-4">
                      This is your last chance to cancel. Type the following text exactly to
                      confirm deletion:
                    </p>
                    <div className="bg-white rounded-lg p-3 border-2 border-foreground/20 mb-4">
                      <code className="text-sm sm:text-base font-black text-destructive">
                        DELETE MY ACCOUNT
                      </code>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => {
                        setConfirmText(e.target.value);
                        setError('');
                      }}
                      placeholder="Type here to confirm..."
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-xl border-2 border-foreground/20 font-mono text-sm sm:text-base focus:outline-none focus:border-destructive"
                      disabled={isDeleting}
                    />

                    {error && (
                      <div className="bg-destructive/10 rounded-lg p-3 border-2 border-destructive/30">
                        <p className="text-xs sm:text-sm font-bold text-destructive text-center">
                          {error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => {
                      setShowConfirmation(false);
                      setConfirmText('');
                      setError('');
                      triggerHaptic('light');
                    }}
                    disabled={isDeleting}
                    className="w-full sm:flex-1 btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black py-4 text-sm sm:text-base border-2 border-foreground disabled:opacity-50"
                  >
                    ← CANCEL
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || confirmText.toLowerCase() !== 'delete my account'}
                    className="w-full sm:flex-1 btn-lumbus bg-destructive text-white hover:bg-destructive/90 font-black py-4 text-sm sm:text-base border-2 border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'DELETING...' : 'DELETE ACCOUNT NOW'}
                  </Button>
                </div>

                {/* Security Note */}
                <div className="mt-6 text-center">
                  <p className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    This action is secure and cannot be reversed
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Note */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">
              Questions? Contact us at{' '}
              <a
                href="mailto:support@getlumbus.com"
                className="text-primary hover:text-primary/80 font-black underline"
              >
                support@getlumbus.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
