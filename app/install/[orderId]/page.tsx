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
                <span className="font-black uppercase text-xs sm:text-sm md:text-base lg:text-lg text-foreground">✓ Payment Successful</span>
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
                  <div className="text-3xl sm:text-4xl flex-shrink-0">✉️</div>
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
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-mint p-5 sm:p-6 rounded-xl border-3 border-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <p className="font-black uppercase text-xs sm:text-sm text-foreground/60 mb-2">PLAN</p>
                  <p className="font-black text-base sm:text-lg md:text-xl text-foreground leading-tight">{order.plan.name.replace(/^["']|["']$/g, '')}</p>
                </div>
                <div className="bg-cyan p-5 sm:p-6 rounded-xl border-3 border-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <p className="font-black uppercase text-xs sm:text-sm text-foreground/60 mb-2">REGION</p>
                  <p className="font-black text-base sm:text-lg md:text-xl text-foreground leading-tight">{order.plan.region}</p>
                </div>
                <div className="bg-yellow p-5 sm:p-6 rounded-xl border-3 border-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <p className="font-black uppercase text-xs sm:text-sm text-foreground/60 mb-2">DATA INCLUDED</p>
                  <p className="font-black text-base sm:text-lg md:text-xl text-foreground leading-tight">{order.plan.dataGb} GB</p>
                </div>
                <div className="bg-purple p-5 sm:p-6 rounded-xl border-3 border-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <p className="font-black uppercase text-xs sm:text-sm text-foreground/60 mb-2">VALIDITY PERIOD</p>
                  <p className="font-black text-base sm:text-lg md:text-xl text-foreground leading-tight">{order.plan.validityDays} Days</p>
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

          {/* Important Tips Section */}
          <Card className="mt-6 sm:mt-8 bg-yellow border-3 sm:border-4 border-foreground shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-foreground">
                IMPORTANT TIPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl flex-shrink-0">⏰</span>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">When to activate</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-11">
                    Install now, but turn on data roaming only when you arrive at your destination to start the validity period.
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl flex-shrink-0">📱</span>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">Keep your SIM</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-11">
                    Don't remove your physical SIM! The eSIM works alongside it. Switch between them in settings.
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl flex-shrink-0">📸</span>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">Save the QR code</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-11">
                    Take a screenshot of the QR code so you can install later if needed (also in your email).
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-foreground/10">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl flex-shrink-0">➕</span>
                    <h3 className="font-black uppercase text-sm sm:text-base text-foreground leading-tight">Need more data?</h3>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed pl-11">
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
                <span className="text-3xl sm:text-4xl">💬</span>
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
