'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallPanel } from '@/components/install-panel';
import { useDeviceDetection, buildIOSUniversalLink } from '@/lib/device-detection';
import { Badge } from '@/components/ui/badge';
import { SuccessAnimation } from '@/components/success-animation';
import { Nav } from '@/components/nav';
import { ReferralShareModal } from '@/components/referral-share-modal';
import { useAuth } from '@/lib/auth-context';

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
      const response = await fetch(`/api/orders/${params.orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const data = await response.json();
      setOrder(data);

      // Stop polling once we have activation details
      if (data.hasActivationDetails) {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load order. Please check your email for activation details.');
      setLoading(false);
    }
  }, [params.orderId]);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [loadOrder]);

  // Auto-trigger deep link for iOS 17.4+ when activation details are ready
  useEffect(() => {
    if (order?.hasActivationDetails && !deepLinkTriggered && deviceInfo.supportsUniversalLink && order.smdp && order.activationCode) {
      // Delay by 2 seconds to show success animation first
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

  // Show referral modal after success (5 seconds delay to let user see the success animation)
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order.hasActivationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Preparing Your eSIM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground mb-2">
                Your eSIM is being activated...
              </p>
              <p className="text-sm text-muted-foreground">
                This usually takes a few seconds.
              </p>
            </div>
            <div className="mt-6 p-4 bg-accent/50 rounded-lg">
              <p className="text-sm">
                <strong>Order Status:</strong>{' '}
                <Badge variant="secondary">{order.status}</Badge>
              </p>
              <p className="text-sm mt-2">
                <strong>Plan:</strong> {order.plan.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 animate-slide-up px-4">
            {/* Success Animation with Planet and Signal */}
            <SuccessAnimation />

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 animate-slide-up leading-tight" style={{animationDelay: '0.2s'}}>
              YOUR ESIM IS READY!
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-bold animate-slide-up" style={{animationDelay: '0.3s'}}>
              Connected via Lumbus — Expires in {order.plan.validityDays} days
            </p>

            {/* Auto Deep Link Notification for iOS 17.4+ */}
            {deviceInfo.supportsUniversalLink && !deepLinkTriggered && (
              <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-xl inline-block animate-slide-up" style={{animationDelay: '0.4s'}}>
                <p className="font-black uppercase text-sm text-primary">
                  📲 Opening eSIM installer automatically...
                </p>
              </div>
            )}

            {deepLinkTriggered && (
              <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-xl inline-block animate-slide-up">
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
                <p className="font-black text-base sm:text-lg">{order.plan.name}</p>
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
