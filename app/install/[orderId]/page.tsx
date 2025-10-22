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

  // Auto-trigger deep link for iOS 17.4+ when activation details are ready
  useEffect(() => {
    if (order?.hasActivationDetails && !deepLinkTriggered && deviceInfo.supportsUniversalLink && order.smdp && order.activationCode) {
      // Delay by 2 seconds to give user time to see the ready message
      setTimeout(() => {
        // Type guard ensures we have non-null values
        if (order.smdp && order.activationCode) {
          const deepLink = buildIOSUniversalLink(order.smdp, order.activationCode);
          window.location.href = deepLink;
          setDeepLinkTriggered(true);
        }
      }, 2000);
    }
  }, [order, deepLinkTriggered, deviceInfo]);

  // Show referral modal after success (5 seconds delay)
  useEffect(() => {
    if (order?.hasActivationDetails && user && !showReferralModal) {
      const timer = setTimeout(() => {
        setShowReferralModal(true);
      }, 5000);
      return () => clearTimeout(timer);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block  rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading order...</p>
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
                <CardTitle className="text-2xl sm:text-3xl font-black uppercase text-center">
                  ⏳ ACTIVATING YOUR eSIM
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
                        <p className="text-white font-black text-base mb-2">
                          📧 CHECK YOUR EMAIL!
                        </p>
                        <p className="text-white/90 font-bold text-sm">
                          We'll send you:
                        </p>
                        <ul className="text-white/90 font-bold text-sm space-y-1 mt-2 text-left max-w-sm mx-auto">
                          <li>• Your eSIM activation QR code</li>
                          <li>• Installation instructions</li>
                          <li>• Account setup link (to set your password)</li>
                        </ul>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground mt-4">
                        💡 This page will automatically update when your eSIM is ready. Keep this tab open or check your email!
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

                <div className="mt-6 p-4 bg-primary/10 rounded-xl">
                  <p className="text-sm font-bold text-center">
                    💡 <strong>Tip:</strong> This page will automatically update when your eSIM is ready. Keep this tab open or check your email for installation instructions.
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <Link href="/dashboard">
                    <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black">
                      ← BACK TO DASHBOARD
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
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-r from-mint to-cyan rounded-full px-6 sm:px-8 py-3 sm:py-4 border-2 sm:border-4 border-foreground shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">✅</span>
                  <span className="font-black uppercase text-sm sm:text-base md:text-lg">Payment Successful</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
              YOUR eSIM IS<br className="sm:hidden" /> READY!
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 text-foreground/70">
              🌐 Connected via Lumbus • Valid for {order.plan.validityDays} days
            </p>

            {/* Important Notice - Email Backup */}
            <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-purple to-purple/80 border-2 sm:border-4 border-foreground rounded-xl sm:rounded-2xl inline-block max-w-lg shadow-xl">
              <div className="flex items-start gap-3 text-left">
                <span className="text-2xl sm:text-3xl flex-shrink-0">📧</span>
                <div>
                  <p className="font-black uppercase text-sm sm:text-base text-white mb-2">
                    Installation instructions sent to your email
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white/90">
                    Check your inbox (and spam folder) for activation details. You can install later from the email.
                  </p>
                </div>
              </div>
            </div>

            {/* Auto Deep Link Notification for iOS 17.4+ */}
            {deviceInfo.supportsUniversalLink && !deepLinkTriggered && (
              <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-yellow to-yellow/80 border-2 sm:border-4 border-foreground rounded-xl sm:rounded-2xl inline-block max-w-lg shadow-xl animate-pulse">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">⚡</span>
                  <p className="font-black uppercase text-sm sm:text-base text-foreground">
                    Opening eSIM installer automatically...
                  </p>
                </div>
              </div>
            )}

            {deepLinkTriggered && (
              <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-mint to-mint/80 border-2 sm:border-4 border-foreground rounded-xl sm:rounded-2xl inline-block max-w-lg shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">✅</span>
                  <p className="font-black uppercase text-sm sm:text-base text-foreground">
                    eSIM installer opened! Follow the prompts on your screen.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Card className="bg-mint border-2 border-primary shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase">PLAN DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-4 bg-white rounded-xl">
                <p className="font-bold uppercase text-xs text-muted-foreground mb-1">Plan</p>
                <p className="font-black text-base sm:text-lg">{order.plan.name.replace(/^["']|["']$/g, '')}</p>
              </div>
              <div className="p-4 bg-white rounded-xl">
                <p className="font-bold uppercase text-xs text-muted-foreground mb-1">Region</p>
                <p className="font-black text-base sm:text-lg">{order.plan.region}</p>
              </div>
              <div className="p-4 bg-white rounded-xl">
                <p className="font-bold uppercase text-xs text-muted-foreground mb-1">Data</p>
                <p className="font-black text-base sm:text-lg">{order.plan.dataGb} GB</p>
              </div>
              <div className="p-4 bg-white rounded-xl">
                <p className="font-bold uppercase text-xs text-muted-foreground mb-1">Valid for</p>
                <p className="font-black text-base sm:text-lg">{order.plan.validityDays} days</p>
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
          <Card className="mt-8 bg-gradient-to-br from-yellow to-yellow/80 border-2 sm:border-4 border-foreground shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
                <span>💡</span> IMPORTANT TIPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/90 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⏰</span>
                    <div>
                      <h3 className="font-black uppercase text-sm mb-2">When to activate</h3>
                      <p className="text-sm font-bold text-foreground/70">
                        Install now, but turn on data roaming only when you arrive at your destination to start the validity period.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">📱</span>
                    <div>
                      <h3 className="font-black uppercase text-sm mb-2">Keep your SIM</h3>
                      <p className="text-sm font-bold text-foreground/70">
                        Don't remove your physical SIM! The eSIM works alongside it. Switch between them in settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">📸</span>
                    <div>
                      <h3 className="font-black uppercase text-sm mb-2">Save the QR code</h3>
                      <p className="text-sm font-bold text-foreground/70">
                        Take a screenshot of the QR code so you can install later if needed (also in your email).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🔄</span>
                    <div>
                      <h3 className="font-black uppercase text-sm mb-2">Need more data?</h3>
                      <p className="text-sm font-bold text-foreground/70">
                        You can purchase top-up plans from your dashboard anytime during the validity period.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center px-4">
            <div className="inline-block w-full sm:w-auto p-6 sm:p-8 bg-gradient-to-br from-cyan to-cyan/80 border-2 sm:border-4 border-foreground rounded-xl sm:rounded-2xl shadow-xl max-w-2xl">
              <h3 className="font-black uppercase text-lg sm:text-xl mb-3">Need Help?</h3>
              <p className="font-bold text-sm sm:text-base mb-4 text-foreground/80">
                Installation instructions are in your email, or get help from our support team
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/support" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 touch-manipulation">
                    💬 CONTACT SUPPORT
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 border-2 border-foreground touch-manipulation">
                    📊 VIEW DASHBOARD
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Referral Share Modal */}
      {showReferralModal && user && (
        <ReferralShareModal
          userId={user.id}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
}
