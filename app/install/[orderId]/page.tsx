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
      const data = await authenticatedGet<OrderData>(`/api/orders/${params.orderId}`);
      console.log('[Install Page] Order data received:', {
        id: data.id,
        status: data.status,
        hasActivationDetails: data.hasActivationDetails,
        hasSmdp: !!data.smdp,
        hasActivationCode: !!data.activationCode,
        smdp: data.smdp,
        activationCode: data.activationCode
      });
      setOrder(data);
      setLoading(false); // Always stop loading after first fetch
    } catch (err) {
      console.error('[Install Page] Error loading order:', err);
      setError('Failed to load order. Please check your email for activation details.');
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
                  <p className="text-sm font-bold text-muted-foreground mb-6">
                    This usually takes 10-30 seconds. You'll receive an email with installation instructions once ready.
                  </p>
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 leading-tight">
              YOUR eSIM IS READY!
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-bold mb-4">
              Connected via Lumbus — Expires in {order.plan.validityDays} days
            </p>
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl inline-block max-w-md">
              <p className="font-bold uppercase text-sm text-red-700">
                📧 Installation instructions have been sent to your email
              </p>
              <p className="text-xs text-red-600 mt-1">
                Check your inbox (and junk/spam folder) for activation details and QR code
              </p>
            </div>

            {/* Auto Deep Link Notification for iOS 17.4+ */}
            {deviceInfo.supportsUniversalLink && !deepLinkTriggered && (
              <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-xl inline-block">
                <p className="font-black uppercase text-sm text-primary">
                  📲 Opening eSIM installer automatically...
                </p>
              </div>
            )}

            {deepLinkTriggered && (
              <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-xl inline-block ">
                <p className="font-black uppercase text-sm text-primary">
                  ✓ eSIM installer opened! Follow the prompts to complete setup.
                </p>
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

          <div className="mt-8 text-center p-6 bg-yellow rounded-xl">
            <p className="font-bold uppercase text-sm">
              Need help? Check your email or visit our{' '}
              <a href="/support" className="text-primary hover:underline">
                support page
              </a>
              .
            </p>
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
