'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallPanel } from '@/components/install-panel';
import { useDeviceDetection, buildIOSUniversalLink } from '@/lib/device-detection';
import { Badge } from '@/components/ui/badge';
import { Nav } from '@/components/nav';
import { ReferralShareModal } from '@/components/referral-share-modal';
import { useAuth } from '@/lib/auth-context';
import { authenticatedGet } from '@/lib/api-client';

interface OrderData {
  id: string;
  status: string;
  hasActivationDetails: boolean;
  smdp: string | null;
  activationCode: string | null;
  plan: {
    name: string;
    region: string;
    dataGb: number;
    validityDays: number;
  };
}

export default function InstallPage() {
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deepLinkTriggered, setDeepLinkTriggered] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const deviceInfo = useDeviceDetection();

  const loadOrder = useCallback(async () => {
    try {
      // Extract token from URL if present
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const token = urlParams?.get('token');

      // Try authenticated request first, fall back to token-based access
      let data: OrderData;
      try {
        data = await authenticatedGet<OrderData>(`/api/orders/${params.orderId}`);
      } catch (authError) {
        // If authentication fails, use token if available
        if (token) {
          const response = await fetch(`/api/orders/${params.orderId}?token=${token}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to load order' }));
            throw new Error(errorData.error || 'Failed to load order');
          }
          data = await response.json();
        } else {
          throw new Error('Unauthorized - Please log in to view this order');
        }
      }
      setOrder(data);
      setLoading(false); // Always stop loading after first fetch
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(`${errorMessage} Please check your email for activation details.`);
      setLoading(false);
    }
  }, [params.orderId]);

  useEffect(() => {
    loadOrder();

    // Only keep polling if we don't have activation details yet
    const interval = setInterval(() => {
      if (!order?.hasActivationDetails) {
        loadOrder();
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [loadOrder, order?.hasActivationDetails]);

  // Replace Stripe checkout in browser history so users return here (not Stripe) after eSIM setup
  useEffect(() => {
    if (order?.id && typeof window !== 'undefined') {
      // Remove Stripe session_id from URL and replace history entry
      const url = new URL(window.location.href);
      const hasStripeParams = url.searchParams.has('session_id');

      if (hasStripeParams) {
        url.searchParams.delete('session_id');
        // Replace current history entry (Stripe redirect) with clean install page URL
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [order?.id]);

  // Auto-trigger deep link for iOS 17.4+ (ONCE ONLY)
  useEffect(() => {
    if (
      order?.hasActivationDetails && 
      !deepLinkTriggered && 
      deviceInfo.supportsUniversalLink && 
      order.smdp && 
      order.activationCode
    ) {
      // Check if we already auto-triggered this specific order
      const storageKey = `auto_install_triggered_${order.id}`;
      if (localStorage.getItem(storageKey)) {
        return; // Already done, don't annoy user
      }

      // Delay by 3 seconds to let them see the "Success" state first
      const timer = setTimeout(() => {
        if (order.smdp && order.activationCode) {
          // Mark as done BEFORE redirecting to prevent loops
          localStorage.setItem(storageKey, 'true');
          setDeepLinkTriggered(true);
          
          const deepLink = buildIOSUniversalLink(order.smdp, order.activationCode);
          window.location.href = deepLink;
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    order?.hasActivationDetails, 
    order?.id, 
    order?.smdp, 
    order?.activationCode, 
    deviceInfo.supportsUniversalLink
  ]); // Only re-run if critical data changes, ignoring object reference updates

  // Show referral modal after success (5 seconds delay) - only once per order
  useEffect(() => {
    if (order?.hasActivationDetails && user && !showReferralModal) {
      // Check if user has already dismissed this modal for this order
      const dismissedKey = `referral_modal_dismissed_${order.id}`;
      const alreadyDismissed = localStorage.getItem(dismissedKey);

      if (!alreadyDismissed) {
        const timer = setTimeout(() => {
          setShowReferralModal(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [order, user, showReferralModal]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary mb-4"></div>
          <p className="text-base sm:text-lg font-bold text-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order.hasActivationDetails) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card className="bg-yellow border-4 border-secondary shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-center">
                  ACTIVATING YOUR eSIM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-6"></div>
                  <p className="text-lg font-bold mb-2">
                    Setting up your eSIM...
                  </p>
                  {!user ? (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-muted-foreground mb-6">
                        This usually takes 10-30 seconds. You'll receive an email with installation instructions once ready.
                      </p>
                      <div className="p-4 bg-gradient-to-r from-purple to-purple/80 border-3 border-foreground rounded-xl shadow-lg">
                        <p className="text-white font-black text-sm sm:text-base mb-2">
                          CHECK YOUR EMAIL!
                        </p>
                        <p className="text-white/90 font-bold text-xs sm:text-sm">
                          We'll send you:
                        </p>
                        <ul className="text-white/90 font-bold text-xs sm:text-sm space-y-1 mt-2 text-left max-w-sm mx-auto">
                          <li>Your eSIM activation QR code</li>
                          <li>Installation instructions</li>
                          <li>Account setup link (to set your password)</li>
                        </ul>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-4">
                        This page will automatically update when your eSIM is ready. Keep this tab open or check your email!
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-muted-foreground mb-6">
                      This usually takes 10-30 seconds. You'll receive an email with installation instructions once ready.
                    </p>
                  )}
                </div>

                <div className="mt-6 p-4 bg-white rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase text-muted-foreground">Status</span>
                    <Badge className="bg-yellow text-foreground font-black uppercase">
                      {order.status === 'provisioning' ? 'ACTIVATING' : order.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase text-muted-foreground">Plan</span>
                    <span className="text-sm font-black">{order.plan.name.replace(/^["']|["']$/g, '')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase text-muted-foreground">Region</span>
                    <span className="text-sm font-black">{order.plan.region}</span>
                  </div>
                </div>

                <div className="mt-6 p-3 sm:p-4 bg-primary/10 rounded-xl">
                  <p className="text-xs sm:text-sm font-bold text-center">
                    <strong>Tip:</strong> This page will automatically update when your eSIM is ready. Keep this tab open or check your email for installation instructions.
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <Link href="/dashboard">
                    <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                      BACK TO DASHBOARD
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 px-4">
            {/* Success Badge */}
            <div className="inline-block mb-4 sm:mb-6">
              <div className="bg-mint rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-3 sm:border-4 border-foreground shadow-xl">
                <span className="font-black uppercase text-xs sm:text-sm md:text-base lg:text-lg text-foreground flex items-center gap-2"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Payment Successful</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase mb-3 sm:mb-4 md:mb-6 leading-tight px-4">
              YOUR eSIM IS READY!
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-4 sm:mb-6 text-foreground/70 px-4">
              Connected via Lumbus - Valid for {order.plan.validityDays} days
            </p>

            {/* Important Notice - Email Backup - Mobile First */}
            <div className="mt-4 sm:mt-6 mx-auto max-w-2xl px-4">
              <div className="p-5 sm:p-6 md:p-8 bg-purple border-3 sm:border-4 border-foreground rounded-xl sm:rounded-2xl shadow-xl">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <p className="font-black uppercase text-base sm:text-lg md:text-xl text-foreground leading-tight">
                      Installation instructions sent to your email
                    </p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/80 leading-relaxed">
                      Check your inbox <span className="bg-yellow px-2 py-1 rounded font-black">(and spam folder)</span> for activation details. You can install later from the email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-white border-4 border-foreground shadow-2xl mb-8">
            <CardHeader className="bg-primary border-b-4 border-foreground pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-center text-foreground">
                PLAN DETAILS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-mint p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 border-foreground/20 overflow-hidden">
                  <p className="font-black uppercase text-xs text-foreground/60 mb-1">PLAN</p>
                  <p className="font-black text-sm sm:text-base md:text-lg text-foreground leading-tight truncate">{order.plan.name.replace(/^["']|["']$/g, '')}</p>
                </div>
                <div className="bg-cyan p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 border-foreground/20 overflow-hidden">
                  <p className="font-black uppercase text-xs text-foreground/60 mb-1">REGION</p>
                  <p className="font-black text-sm sm:text-base md:text-lg text-foreground leading-tight truncate">{order.plan.region}</p>
                </div>
                <div className="bg-yellow p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 border-foreground/20 overflow-hidden">
                  <p className="font-black uppercase text-xs text-foreground/60 mb-1">DATA</p>
                  <p className="font-black text-sm sm:text-base md:text-lg text-foreground leading-tight">{order.plan.dataGb} GB</p>
                </div>
                <div className="bg-purple p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 border-foreground/20 overflow-hidden">
                  <p className="font-black uppercase text-xs text-foreground/60 mb-1">VALIDITY</p>
                  <p className="font-black text-sm sm:text-base md:text-lg text-foreground leading-tight">{order.plan.validityDays} Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <InstallPanel
            smdp={order.smdp!}
            activationCode={order.activationCode!}
            orderId={order.id}
            supportsUniversalLink={deviceInfo.supportsUniversalLink}
            platform={deviceInfo.platform}
          />

          {/* Data Roaming Required - Prominent Notice */}
          <Card className="mt-6 sm:mt-8 bg-mint border-3 sm:border-4 border-primary shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-black uppercase text-base sm:text-lg md:text-xl text-foreground mb-2">
                    TURN ON DATA ROAMING
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 mb-3">
                    After installing, you MUST enable data roaming for your eSIM to work:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="font-black text-xs uppercase text-foreground/60 mb-1">iPhone/iPad</p>
                      <p className="text-xs sm:text-sm font-bold text-foreground">Settings → Cellular → Your eSIM → Data Roaming → ON</p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="font-black text-xs uppercase text-foreground/60 mb-1">Android</p>
                      <p className="text-xs sm:text-sm font-bold text-foreground">Settings → Network → SIMs → Your eSIM → Roaming → ON</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Tips Section */}
          <Card className="mt-4 sm:mt-6 bg-yellow border-3 sm:border-4 border-foreground shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-foreground">
                IMPORTANT TIPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">When to activate</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-9">
                    Install now, but turn on data roaming only when you arrive at your destination to start the validity period.
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">Keep your SIM</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-9">
                    Don't remove your physical SIM! The eSIM works alongside it. Switch between them in settings.
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">Save the QR code</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-9">
                    Take a screenshot of the QR code so you can install later if needed (also in your email).
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">Need more data?</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-9">
                    You can purchase top-up plans from your dashboard anytime during the validity period.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-6 sm:mt-8">
            <div className="p-5 sm:p-6 md:p-8 bg-cyan border-3 sm:border-4 border-foreground rounded-xl sm:rounded-2xl shadow-xl max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                <h3 className="font-black uppercase text-xl sm:text-2xl md:text-3xl text-foreground">Need Help?</h3>
              </div>
              <p className="font-bold text-sm sm:text-base md:text-lg mb-5 sm:mb-6 text-foreground/80 text-center leading-relaxed">
                Installation instructions are in your email, or get help from our support team
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/support" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-black text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl touch-manipulation shadow-xl border-2 border-foreground">
                    CONTACT SUPPORT
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto font-black text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border-3 border-foreground rounded-xl touch-manipulation bg-white hover:bg-mint text-foreground">
                    VIEW DASHBOARD
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Referral Share Modal */}
      {showReferralModal && user && order && (
        <ReferralShareModal
          userId={user.id}
          onClose={() => {
            setShowReferralModal(false);
            // Mark as dismissed so it doesn't show again
            localStorage.setItem(`referral_modal_dismissed_${order.id}`, 'true');
          }}
        />
      )}
    </div>
  );
}
