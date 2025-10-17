'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Nav } from '@/components/nav';
import { useAuth } from '@/lib/auth-context';
import { supabaseClient } from '@/lib/supabase-client';
import { triggerHaptic } from '@/lib/device-detection';
import { Order, Plan } from '@/lib/db';

interface OrderWithPlan extends Order {
  plan: Plan;
}

interface TopUpPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default function TopUpPage({ params }: TopUpPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { orderId } = use(params);

  const [order, setOrder] = useState<OrderWithPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && orderId) {
      loadOrderAndPlans();
    }
  }, [user, orderId]);

  const loadOrderAndPlans = async () => {
    try {
      // Load the order
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .select('*, plan:plans(*)')
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (orderError) throw orderError;

      const transformedOrder = {
        ...orderData,
        plan: Array.isArray(orderData.plan) ? orderData.plan[0] : orderData.plan,
      };

      setOrder(transformedOrder as OrderWithPlan);

      // Load available top-up plans for the same region
      const regionCode = transformedOrder.plan?.region_code;
      if (regionCode) {
        const { data: plansData, error: plansError } = await supabaseClient
          .from('plans')
          .select('*')
          .eq('region_code', regionCode)
          .eq('is_active', true)
          .order('retail_price', { ascending: true });

        if (plansError) throw plansError;

        setAvailablePlans(plansData || []);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (planId: string) => {
    if (!order) return;

    setCheckoutLoading(planId);
    triggerHaptic('medium');

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isTopUp: true,
          existingOrderId: order.id,
          iccid: order.iccid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block  rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground font-bold">Loading top-up options...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-black uppercase mb-4">ORDER NOT FOUND</h1>
            <p className="text-lg font-bold text-muted-foreground mb-8">
              This order doesn't exist or you don't have access to it.
            </p>
            <Link href="/dashboard">
              <Button className="btn-lumbus bg-foreground text-white">
                BACK TO DASHBOARD
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dataUsedBytes = order.data_usage_bytes || 0;
  const totalDataBytes = (order.plan?.data_gb || 0) * 1024 * 1024 * 1024;
  const dataUsedGB = dataUsedBytes / (1024 * 1024 * 1024);
  const usagePercent = totalDataBytes > 0 ? (dataUsedBytes / totalDataBytes) * 100 : 0;

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 ">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary font-black mb-4 hover:underline">
              ← BACK TO DASHBOARD
            </Link>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-4">
              TOP UP YOUR ESIM
            </h1>
            <p className="text-lg font-bold text-muted-foreground">
              Add more data to your existing eSIM - {order.plan?.name}
            </p>
          </div>

          {/* Current eSIM Status */}
          <Card className="bg-mint border-4 border-primary shadow-xl mb-8 " style={{animationDelay: '0.1s'}}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-black uppercase mb-2">
                    CURRENT ESIM
                  </CardTitle>
                  <p className="font-bold text-muted-foreground">{order.plan?.name}</p>
                </div>
                <Badge className="bg-primary text-foreground font-black uppercase px-3 py-1">
                  {order.plan?.region_code}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Data Usage */}
                <div className="p-4 bg-white rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black uppercase text-xs">Current Usage</span>
                    <span className="font-black text-sm">{dataUsedGB.toFixed(1)} / {order.plan?.data_gb} GB</span>
                  </div>
                  <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    ></div>
                  </div>
                  {usagePercent > 80 && (
                    <p className="text-xs font-bold text-destructive mt-2">
                      ⚠️ Running low on data!
                    </p>
                  )}
                </div>

                {/* ICCID */}
                <div className="p-4 bg-white rounded-xl">
                  <div className="font-black uppercase text-xs mb-2">ICCID</div>
                  <div className="font-mono text-sm break-all">{order.iccid || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Top-Up Plans */}
          <div className="mb-8">
            <h2 className="text-3xl font-black uppercase mb-6 " style={{animationDelay: '0.2s'}}>
              AVAILABLE TOP-UP PLANS
            </h2>

            {availablePlans.length === 0 ? (
              <Card className="bg-yellow border-2 border-secondary shadow-lg">
                <CardContent className="pt-6 text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="font-black text-2xl mb-2">NO PLANS AVAILABLE</h3>
                  <p className="font-bold text-muted-foreground">
                    No top-up plans are currently available for this region.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlans.map((plan, index) => (
                  <Card
                    key={plan.id}
                    className="bg-cyan border-4 border-secondary shadow-xl    "
                    style={{animationDelay: `${0.3 + index * 0.1}s`}}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-secondary text-foreground font-black uppercase text-xs px-3 py-1">
                          TOP-UP
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-black">{plan.region_code}</div>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black uppercase">{plan.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Plan Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📊</span>
                          <div>
                            <div className="font-black text-2xl">{plan.data_gb} GB</div>
                            <div className="text-xs font-bold text-muted-foreground uppercase">Data</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-3xl">⏰</span>
                          <div>
                            <div className="font-black text-2xl">{plan.validity_days} Days</div>
                            <div className="text-xs font-bold text-muted-foreground uppercase">Validity</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-3xl">💰</span>
                          <div>
                            <div className="font-black text-2xl">
                              {plan.currency === 'USD' ? '$' : plan.currency}
                              {plan.retail_price.toFixed(2)}
                            </div>
                            <div className="text-xs font-bold text-muted-foreground uppercase">Price</div>
                          </div>
                        </div>
                      </div>

                      {/* Top-Up Button */}
                      <Button
                        onClick={() => handleTopUp(plan.id)}
                        disabled={checkoutLoading === plan.id}
                        className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black py-6 text-lg "
                      >
                        {checkoutLoading === plan.id ? (
                          <>
                            <span className="inline-block  mr-2">⏳</span>
                            LOADING...
                          </>
                        ) : (
                          'TOP UP NOW'
                        )}
                      </Button>

                      <p className="text-xs font-bold text-muted-foreground text-center">
                        Data will be added to your existing eSIM
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <Card className="bg-purple border-2 border-accent shadow-lg " style={{animationDelay: '0.4s'}}>
            <CardContent className="pt-6">
              <h3 className="text-xl font-black uppercase mb-4">HOW TOP-UP WORKS</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <div className="font-black">Select a Top-Up Plan</div>
                    <div className="text-sm font-bold text-muted-foreground">
                      Choose the amount of data you want to add
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <div className="font-black">Complete Payment</div>
                    <div className="text-sm font-bold text-muted-foreground">
                      Pay securely with Stripe (Apple Pay, Google Pay, or card)
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <div className="font-black">Data Added Automatically</div>
                    <div className="text-sm font-bold text-muted-foreground">
                      Your existing eSIM will be topped up within minutes
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <div>
                    <div className="font-black">Keep Using Your eSIM</div>
                    <div className="text-sm font-bold text-muted-foreground">
                      No need to install anything - just continue using your device
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
