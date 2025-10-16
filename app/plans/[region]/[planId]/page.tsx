'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Nav } from '@/components/nav';
import { Plan } from '@/lib/db';
import { triggerHaptic } from '@/lib/device-detection';
import Link from 'next/link';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPlan = useCallback(async () => {
    // Mock data - in production, fetch from API
    const mockPlans: Plan[] = [
      {
        id: '1',
        name: 'Japan 5GB - 30 Days',
        region_code: 'JP',
        data_gb: 5,
        validity_days: 30,
        supplier_sku: 'ESIMACCESS_JP_5GB_30D',
        retail_price: 19.99,
        currency: 'USD',
        is_active: true,
      },
      {
        id: '2',
        name: 'Europe 10GB - 30 Days',
        region_code: 'EU',
        data_gb: 10,
        validity_days: 30,
        supplier_sku: 'ESIMACCESS_EU_10GB_30D',
        retail_price: 29.99,
        currency: 'USD',
        is_active: true,
      },
      {
        id: '3',
        name: 'USA 5GB - 30 Days',
        region_code: 'US',
        data_gb: 5,
        validity_days: 30,
        supplier_sku: 'ESIMACCESS_US_5GB_30D',
        retail_price: 24.99,
        currency: 'USD',
        is_active: true,
      },
      {
        id: '4',
        name: 'Global 3GB - 7 Days',
        region_code: 'GLOBAL',
        data_gb: 3,
        validity_days: 7,
        supplier_sku: 'ESIMACCESS_GLOBAL_3GB_7D',
        retail_price: 14.99,
        currency: 'USD',
        is_active: true,
      },
    ];

    const foundPlan = mockPlans.find((p) => p.id === params.planId);
    setPlan(foundPlan || null);
  }, [params.planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleCheckout = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!plan) return;

    setLoading(true);
    setError('');
    triggerHaptic('medium');

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Plan not found</p>
          <Link href="/plans">
            <Button>Back to Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      <div className="relative pt-32 pb-20 px-4 bg-mint overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-cyan rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{animationDelay: '1s'}}></div>

        <div className="container mx-auto relative z-10">
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 font-black uppercase text-sm hover:text-primary mb-12 px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-up"
          >
            ← BACK TO PLANS
          </Link>

          <div className="max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
            <Card className="group bg-white border-4 border-primary shadow-2xl hover-lift relative overflow-hidden">
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan/10 rounded-tr-full"></div>

              <CardHeader className="pb-6 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <Badge className="bg-foreground text-white font-black uppercase text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full shadow-xl transform hover:scale-110 transition-transform duration-300">
                    {plan.region_code}
                  </Badge>
                  <div className="text-left sm:text-right">
                    <div className="text-4xl sm:text-5xl font-black text-foreground">
                      ${plan.retail_price}
                    </div>
                    <div className="text-xs font-black uppercase text-muted-foreground mt-1">
                      {plan.currency}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase leading-tight">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="group/stat p-4 sm:p-6 md:p-8 bg-yellow rounded-2xl border-4 border-foreground/5 hover-lift shadow-lg">
                    <div className="text-xs font-black uppercase text-muted-foreground mb-2">Data</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">{plan.data_gb} GB</div>
                  </div>
                  <div className="group/stat p-4 sm:p-6 md:p-8 bg-cyan rounded-2xl border-4 border-foreground/5 hover-lift shadow-lg">
                    <div className="text-xs font-black uppercase text-muted-foreground mb-2">Valid for</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">{plan.validity_days} days</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black uppercase text-xl">WHAT'S INCLUDED:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span className="font-bold">{plan.data_gb}GB high-speed data</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span className="font-bold">Valid for {plan.validity_days} days</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span className="font-bold">Instant activation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span className="font-bold">No contracts or commitments</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t-2 border-primary pt-6">
                  <h3 className="font-black uppercase text-xl mb-4">COMPLETE YOUR PURCHASE</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block font-bold uppercase text-sm mb-2">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border-2 border-foreground/20 rounded-lg focus:outline-none focus:border-primary font-bold"
                        disabled={loading}
                      />
                      <p className="text-xs font-bold uppercase text-muted-foreground mt-2">
                        We'll send your eSIM here
                      </p>
                    </div>

                    {error && (
                      <div className="p-4 bg-destructive/20 text-destructive rounded-lg font-bold">
                        {error}
                      </div>
                    )}

                    <Button
                      onClick={handleCheckout}
                      disabled={loading || !email}
                      className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 text-lg py-7 font-black"
                    >
                      {loading ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                    </Button>

                    <p className="text-xs text-center font-bold uppercase text-muted-foreground">
                      Secure payment via Stripe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
