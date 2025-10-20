'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Nav } from '@/components/nav';
import { useAuth } from '@/lib/auth-context';
import { supabaseClient } from '@/lib/supabase-client';
import { Order, Plan } from '@/lib/db';
import { triggerHaptic } from '@/lib/device-detection';
import { getCountryInfo } from '@/lib/countries';
import { authenticatedGet } from '@/lib/api-client';

// Format plan data amounts (for "What You Bought" - shows marketing numbers)
function formatPlanData(dataGB: number): string {
  if (dataGB >= 1) {
    return `${dataGB} GB`;
  }

  const dataMB = dataGB * 1024;

  // Round to marketing-friendly values
  if (dataMB <= 105) return '100 MB';
  if (dataMB <= 260) return '200 MB';
  if (dataMB <= 520) return '500 MB'; // 0.5 GB shown as 500 MB (marketing)
  if (dataMB <= 1000) return '1 GB';

  // For other values, round to nearest 100MB
  const roundedMB = Math.round(dataMB / 100) * 100;

  // If rounded value is 1000 MB or more, show as GB
  if (roundedMB >= 1000) {
    const gb = roundedMB / 1024;
    return gb >= 0.95 ? '1 GB' : `${gb.toFixed(1)} GB`;
  }

  return `${roundedMB} MB`;
}

// Format usage data (for Used/Remaining - shows precise values)
function formatDataUsage(dataGB: number): string {
  if (dataGB >= 1) {
    // Show whole number for exact GB values (1.00 → "1 GB", 2.00 → "2 GB")
    if (Number.isInteger(dataGB)) {
      return `${dataGB} GB`;
    }
    // Show 1 decimal for near-whole values (0.98 → "1.0 GB")
    const rounded = Math.round(dataGB * 10) / 10;
    if (rounded === Math.floor(rounded)) {
      return `${rounded.toFixed(1)} GB`;
    }
    return `${dataGB.toFixed(2)} GB`;
  }

  const dataMB = dataGB * 1024;

  // For very small amounts (< 10 MB), show 1 decimal place
  if (dataMB < 10) {
    return `${dataMB.toFixed(1)} MB`;
  }

  // For amounts < 1000 MB, show exact rounded MB
  if (dataMB < 1000) {
    return `${Math.round(dataMB)} MB`;
  }

  // If 1000 MB or more, show as GB
  return `${dataGB.toFixed(2)} GB`;
}

interface OrderWithPlan extends Order {
  plan: Plan;
}

interface ReferralStats {
  ref_code: string;
  referral_link: string;
  total_clicks: number;
  total_referrals: number;
  pending_rewards: number;
  earned_rewards: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [refreshingUsage, setRefreshingUsage] = useState<Record<string, boolean>>({});
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadOrders = useCallback(async (forceRefresh: boolean = false) => {
    try {
      // Try to load from cache first (unless force refresh)
      const cacheKey = `lumbus_orders_${user?.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const cacheExpiry = 2 * 60 * 1000; // 2 minutes

      if (!forceRefresh && cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < cacheExpiry) {
          // Use cached data
          const orders = JSON.parse(cachedData);
          setOrders(orders);
          setLoading(false);

          // Check if any orders are provisioning - if so, fetch fresh data in background
          const hasProvisioning = orders.some((o: OrderWithPlan) => o.status === 'provisioning');
          if (hasProvisioning) {
            // Refresh in background without showing loading state
            loadOrders(true);
          }
          return;
        }
      }

      // Fetch fresh data
      const { data, error } = await supabaseClient
        .from('orders')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase join format
      const transformedData = data?.map((order) => ({
        ...order,
        plan: Array.isArray(order.plan) ? order.plan[0] : order.plan,
      }));

      setOrders(transformedData as OrderWithPlan[]);

      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(transformedData));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    } catch (error) {
      // Error loading orders
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadReferralStats = useCallback(async () => {
    try {
      // Try to load from cache first
      const cacheKey = `lumbus_referral_stats_${user?.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes

      if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < cacheExpiry) {
          // Use cached data
          setReferralStats(JSON.parse(cachedData));
          return;
        }
      }

      // Fetch fresh data with authentication
      const data = await authenticatedGet<{
        ref_code: string;
        referral_link: string;
        stats: {
          total_clicks: number;
          total_signups: number;
          pending_rewards: number;
          earned_rewards: number;
        };
      }>('/api/referrals/me');

      const stats = {
        ref_code: data.ref_code,
        referral_link: data.referral_link,
        total_clicks: data.stats.total_clicks || 0,
        total_referrals: data.stats.total_signups || 0,
        pending_rewards: data.stats.pending_rewards || 0,
        earned_rewards: data.stats.earned_rewards || 0,
      };
      setReferralStats(stats);

      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(stats));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    } catch (error) {
      // Error loading referral stats
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadOrders();
      loadReferralStats();
    }
  }, [user, loadOrders, loadReferralStats]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-primary text-foreground';
      case 'ready':
        return 'bg-cyan border-2 border-primary text-foreground';
      case 'provisioning':
      case 'preparing':
      case 'activating':
        return 'bg-yellow text-foreground';
      case 'pending':
      case 'paid':
        return 'bg-purple text-white';
      case 'failed':
        return 'bg-destructive text-white';
      case 'depleted':
        return 'bg-red-500 text-white';
      case 'expired':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getDisplayStatus = (order: OrderWithPlan): string => {
    // Check if depleted
    if (order.data_remaining_bytes !== null && order.data_remaining_bytes <= 0) {
      return 'depleted';
    }

    // Check if expired
    if (isOrderExpired(order)) {
      return 'expired';
    }

    // Show "READY" for orders that have activation details but haven't been activated yet
    // This includes both "completed" orders and "provisioning" orders that have received activation details
    if (!order.activated_at && order.smdp && order.activation_code) {
      return 'ready';
    }

    // Show user-friendly status names
    if (order.status === 'provisioning') {
      return 'ready';
    }

    return order.status;
  };

  const getDataPercentage = (remaining: number, total: number) => {
    return Math.min(100, (remaining / total) * 100);
  };

  const getDaysRemaining = (order: OrderWithPlan) => {
    const validityDays = order.plan?.validity_days || 0;

    // If eSIM hasn't been activated yet (no activated_at date), return full validity period
    if (!order.activated_at) {
      return validityDays;
    }

    // Calculate from activation date
    const activationDate = new Date(order.activated_at);
    const expiry = new Date(activationDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const remaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return remaining; // Can be negative for expired plans
  };

  const isOrderExpired = (order: OrderWithPlan) => {
    return getDaysRemaining(order) <= 0;
  };

  const copyReferralLink = async () => {
    if (referralStats?.referral_link) {
      try {
        await navigator.clipboard.writeText(referralStats.referral_link);
        setCopiedLink(true);
        triggerHaptic('light');
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (error) {
        // Copy failed
      }
    }
  };

  const shareViaWhatsApp = () => {
    if (referralStats?.referral_link) {
      const message = encodeURIComponent(
        `Get 10% off your first eSIM purchase with Lumbus! Use my referral link: ${referralStats.referral_link}`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const shareViaTwitter = () => {
    if (referralStats?.referral_link) {
      const text = encodeURIComponent(
        `Get 10% off your first eSIM with @LumbusTravel! Stay connected in 150+ countries. Use my link:`
      );
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralStats.referral_link)}`,
        '_blank'
      );
    }
  };

  const shareViaEmail = () => {
    if (referralStats?.referral_link) {
      const subject = encodeURIComponent('Get 10% off Lumbus eSIM');
      const body = encodeURIComponent(
        `Hey! I've been using Lumbus for my international travel connectivity and thought you might like it too.\n\nUse my referral link to get 10% off your first eSIM purchase:\n${referralStats.referral_link}\n\nStay connected in 150+ countries without roaming fees!`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const refreshUsageData = async (orderId: string) => {
    setRefreshingUsage(prev => ({ ...prev, [orderId]: true }));
    triggerHaptic('light');

    try {
      const usageData = await authenticatedGet<{
        data_usage_bytes: number;
        data_remaining_bytes: number;
        last_update: string;
      }>(`/api/orders/${orderId}/usage`);

      // Update the order in the state with new usage data
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              data_usage_bytes: usageData.data_usage_bytes,
              data_remaining_bytes: usageData.data_remaining_bytes,
              last_usage_update: usageData.last_update,
            };
          }
          return order;
        });

        // Update cache with new usage data
        const cacheKey = `lumbus_orders_${user?.id}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedOrders));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

        return updatedOrders;
      });

      triggerHaptic('light');
    } catch (error) {
      triggerHaptic('medium');
    } finally {
      setRefreshingUsage(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block  rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Filter for truly active orders (completed/provisioning/active) that are not depleted or expired
  const activeOrders = orders.filter(o => {
    const status = o.status;
    const isDepleted = o.data_remaining_bytes !== null && o.data_remaining_bytes <= 0;
    const expired = isOrderExpired(o);

    // Show completed, provisioning, or active orders that aren't depleted or expired
    return (status === 'completed' || status === 'provisioning' || status === 'active') && !isDepleted && !expired;
  });

  // Past orders: ONLY show truly depleted eSIMs
  const pastOrders = orders.filter(o => {
    const isDepleted = o.data_remaining_bytes !== null && o.data_remaining_bytes <= 0;
    return isDepleted;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      {/* Dashboard Content */}
      <div className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8 md:mb-12 ">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mb-2 sm:mb-4 leading-tight">
              YOUR DASHBOARD
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground truncate">
                Welcome back, {user?.email}
              </p>
              {referralStats && (
                <a
                  href="#refer-earn"
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-black text-primary hover:text-primary/80 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('refer-earn')?.scrollIntoView({ behavior: 'smooth' });
                    triggerHaptic('light');
                  }}
                >
                  🎁 Refer Friends for Extra GB →
                </a>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 " style={{animationDelay: '0.1s'}}>
            <Card className="bg-mint border-2 sm:border-4 border-primary shadow-xl   ">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">
                  {activeOrders.length}
                </div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                  eSIMs
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow border-2 sm:border-4 border-secondary shadow-xl   ">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">
                  {(() => {
                    // Calculate total data remaining across all active eSIMs
                    const totalRemaining = activeOrders.reduce((sum, o) => {
                      // Use marketing values for consistency
                      const planGB = o.plan?.data_gb || 0;
                      const planMB = planGB * 1024;

                      // Get marketing total
                      let marketingTotalMB = planMB;
                      if (planMB <= 105) marketingTotalMB = 100;
                      else if (planMB <= 260) marketingTotalMB = 200;
                      else if (planMB <= 520) marketingTotalMB = 500;
                      else if (planMB <= 1000) marketingTotalMB = 1000;

                      const marketingTotalBytes = marketingTotalMB * 1024 * 1024;
                      const usedBytes = o.data_usage_bytes || 0;
                      const remainingBytes = Math.max(0, marketingTotalBytes - usedBytes);
                      const remainingGB = remainingBytes / (1024 * 1024 * 1024);
                      return sum + remainingGB;
                    }, 0);

                    // Use precise formatting for stats (shows 0.9 GB instead of 1 GB)
                    return totalRemaining > 0 ? formatDataUsage(totalRemaining) : '0 MB';
                  })()}
                </div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                  Data Remaining
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan border-2 sm:border-4 border-primary shadow-xl   ">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">
                  {(() => {
                    // Count unique countries from active orders
                    const uniqueCountries = new Set(
                      activeOrders.map(o => o.plan?.region_code).filter(Boolean)
                    );
                    return uniqueCountries.size;
                  })()}
                </div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                  {activeOrders.length > 0 ? 'Countries Connected' : 'Countries'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active eSIMs */}
          <div className="mb-6 sm:mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase">eSIMs</h2>
              <Link href="/plans" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black    text-xs sm:text-sm md:text-base px-4 sm:px-6 py-3">
                  + BUY NEW eSIM
                </Button>
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <Card className="bg-purple border-2 border-accent shadow-lg ">
                <CardContent className="pt-4 sm:pt-6 text-center py-6 sm:py-8 md:py-12 px-3 sm:px-4">
                  <div className="text-5xl sm:text-6xl mb-4">📱</div>
                  <h3 className="font-black text-xl sm:text-2xl mb-2">NO ACTIVE eSIMs</h3>
                  <p className="text-sm sm:text-base font-bold text-muted-foreground mb-6">
                    Get started by purchasing your first eSIM
                  </p>
                  <Link href="/plans" className="inline-block w-full sm:w-auto">
                    <Button className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                      BROWSE PLANS
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Separate into Ready and Active groups */}
                {(() => {
                  const readyOrders = activeOrders.filter(o => !o.activated_at);
                  const activeOnlyOrders = activeOrders.filter(o => o.activated_at);

                  return (
                    <>
                      {/* Ready to Activate Section */}
                      {readyOrders.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="text-3xl">📲</div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase">
                              READY TO ACTIVATE ({readyOrders.length})
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {readyOrders.map((order, index) => {
                              const daysRemaining = getDaysRemaining(order);
                              const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;
                              const totalData = order.plan?.data_gb || 0;
                              const totalDataFormatted = formatPlanData(totalData);

                              return (
                                <Card
                                  key={order.id}
                                  className="bg-yellow border-4 border-secondary shadow-xl   relative overflow-hidden  "
                                  style={{animationDelay: `${index * 0.1}s`}}
                                >
                                  {/* Pulsing Animation for Ready eSIMs */}
                                  <div className="absolute inset-0 bg-white/30 animate-pulse pointer-events-none"></div>

                                  <CardHeader className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                      <Badge className={`${getStatusColor(getDisplayStatus(order))} font-black uppercase text-xs sm:text-sm px-3 py-1.5`}>
                                        ✨ {getDisplayStatus(order)}
                                      </Badge>
                                      <div className="flex items-center gap-2">
                                        {countryInfo && <span className="text-4xl">{countryInfo.flag}</span>}
                                        <div className="text-right">
                                          <div className="text-lg font-black">{order.plan?.region_code}</div>
                                          <div className="text-xs font-bold text-muted-foreground">{countryInfo?.name}</div>
                                        </div>
                                      </div>
                                    </div>
                                    <CardTitle className="text-xl sm:text-2xl font-black uppercase">{order.plan?.name.replace(/^["']|["']$/g, '')}</CardTitle>
                                  </CardHeader>

                                  <CardContent className="space-y-4 relative z-10">
                                    {/* What You Bought */}
                                    <div className="p-3 sm:p-4 bg-white rounded-xl border-2 border-secondary/40">
                                      <div className="font-black uppercase text-xs text-muted-foreground mb-3">📦 What You Bought</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-yellow p-2 rounded-lg">
                                          <div className="text-xs font-bold text-muted-foreground mb-1">Total Data</div>
                                          <div className="text-lg font-black">{totalDataFormatted}</div>
                                        </div>
                                        <div className="bg-yellow p-2 rounded-lg">
                                          <div className="text-xs font-bold text-muted-foreground mb-1">Validity</div>
                                          <div className="text-lg font-black">{order.plan?.validity_days} days</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Activation Notice */}
                                    <div className="p-3 sm:p-4 bg-white rounded-xl border-2 border-secondary">
                                      <div className="flex items-start gap-2">
                                        <span className="text-2xl">⏳</span>
                                        <div>
                                          <div className="font-black text-sm mb-1">NOT ACTIVATED YET</div>
                                          <p className="text-xs font-bold text-muted-foreground">
                                            Your eSIM is ready! Tap "ACTIVATE SIM" below to install it on your device. Your {daysRemaining} days validity will start after activation.
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Prominent Activate Button */}
                                    <Link href={`/install/${order.id}`} className="block">
                                      <Button className="w-full btn-lumbus bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-105 font-black text-lg sm:text-xl py-5 sm:py-6 shadow-xl transition-all">
                                        📲 ACTIVATE SIM NOW
                                      </Button>
                                    </Link>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Active & Using Section */}
                      {activeOnlyOrders.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="text-3xl">✅</div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase">
                              ACTIVE & USING ({activeOnlyOrders.length})
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {activeOnlyOrders.map((order, index) => {
                  const daysRemaining = getDaysRemaining(order);
                  const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;

                  // Calculate real data usage from database
                  // Use marketing values for user-facing math (500 MB not 512 MB)
                  const planGB = order.plan?.data_gb || 0;
                  const planMB = planGB * 1024;

                  // Get marketing-friendly total (e.g., 500 MB instead of 512 MB)
                  let marketingTotalMB = planMB;
                  if (planMB <= 105) marketingTotalMB = 100;
                  else if (planMB <= 260) marketingTotalMB = 200;
                  else if (planMB <= 520) marketingTotalMB = 500; // 512 MB shown as 500 MB
                  else if (planMB <= 1000) marketingTotalMB = 1000;

                  const marketingTotalBytes = marketingTotalMB * 1024 * 1024;
                  const dataUsedBytes = order.data_usage_bytes || 0;
                  const dataUsedGB = dataUsedBytes / (1024 * 1024 * 1024);
                  const dataRemainingBytes = Math.max(0, marketingTotalBytes - dataUsedBytes);
                  const dataRemainingGB = dataRemainingBytes / (1024 * 1024 * 1024);

                  // Progress bar shows USED percentage (fills up as you use data)
                  const dataUsedPercentage = marketingTotalBytes > 0 ? (dataUsedBytes / marketingTotalBytes) * 100 : 0;

                  // Format data for display
                  const formatData = (gb: number) => {
                    // Show 0 MB only if truly 0 (less than 0.001 MB = 1 KB)
                    if (gb < 0.000001) return '0 MB';
                    return formatDataUsage(gb); // Use precise formatting for usage
                  };

                  const totalData = order.plan?.data_gb || 0;
                  const totalDataFormatted = formatPlanData(totalData); // Use marketing-friendly formatting for plan data

                  // Check if plan is depleted
                  const isDepleted = order.data_remaining_bytes !== null && order.data_remaining_bytes <= 0;

                  return (
                    <Card
                      key={order.id}
                      className="bg-mint border-4 border-primary shadow-xl   relative overflow-hidden  "
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100   pointer-events-none"></div>

                      <CardHeader className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={`${getStatusColor(getDisplayStatus(order))} font-black uppercase text-xs px-2 sm:px-3 py-1`}>
                            {getDisplayStatus(order)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {countryInfo && <span className="text-4xl">{countryInfo.flag}</span>}
                            <div className="text-right">
                              <div className="text-lg font-black">{order.plan?.region_code}</div>
                              <div className="text-xs font-bold text-muted-foreground">{countryInfo?.name}</div>
                            </div>
                          </div>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-black uppercase">{order.plan?.name.replace(/^["']|["']$/g, '')}</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4 relative z-10">
                        {/* What You Bought */}
                        <div className="p-3 sm:p-4 bg-white rounded-xl border-2 border-primary/20">
                          <div className="font-black uppercase text-xs text-muted-foreground mb-3">📦 What You Bought</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-mint p-2 rounded-lg">
                              <div className="text-xs font-bold text-muted-foreground mb-1">Total Data</div>
                              <div className="text-lg font-black">{totalDataFormatted}</div>
                            </div>
                            <div className="bg-mint p-2 rounded-lg">
                              <div className="text-xs font-bold text-muted-foreground mb-1">Validity</div>
                              <div className="text-lg font-black">{order.plan?.validity_days} days</div>
                            </div>
                          </div>
                        </div>

                        {/* Data Usage */}
                        <div className="p-3 sm:p-4 bg-white rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black uppercase text-xs">📊 Data Usage</span>
                            {order.activated_at && (
                              <button
                                onClick={() => refreshUsageData(order.id)}
                                disabled={refreshingUsage[order.id]}
                                className="text-xs font-black text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {refreshingUsage[order.id] ? '🔄 Refreshing...' : '🔄 Refresh'}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between mb-2">
                            <div>
                              <div className="text-xs font-bold text-muted-foreground">Used</div>
                              <div className="text-sm font-black text-destructive">{formatData(dataUsedGB)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-muted-foreground">Remaining</div>
                              <div className="text-sm font-black text-primary">{formatData(dataRemainingGB)}</div>
                            </div>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden mb-2">
                            <div
                              className={`h-full rounded-full transition-all ${
                                dataUsedPercentage < 50 ? 'bg-primary' :
                                dataUsedPercentage < 80 ? 'bg-yellow-500' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${dataUsedPercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs font-bold text-center">{dataUsedPercentage.toFixed(0)}% used</div>
                          {order.last_usage_update && (
                            <p className="text-xs font-bold text-muted-foreground mt-2">
                              Last updated: {new Date(order.last_usage_update).toLocaleString()}
                            </p>
                          )}
                          {dataUsedPercentage > 80 && dataUsedPercentage < 100 && (
                            <p className="text-xs font-bold text-destructive mt-2">
                              ⚠️ Running low on data! Consider topping up.
                            </p>
                          )}
                        </div>

                        {/* Expiry */}
                        <div className="p-3 sm:p-4 bg-white rounded-xl">
                          <div className="flex justify-between items-center">
                            <span className="font-black uppercase text-xs">Days Remaining</span>
                            {daysRemaining <= 0 ? (
                              <span className="font-black text-xl sm:text-2xl text-destructive">
                                EXPIRED
                              </span>
                            ) : (
                              <span className={`font-black text-xl sm:text-2xl ${order.activated_at && daysRemaining <= 5 ? 'text-destructive' : ''}`}>
                                {daysRemaining}
                              </span>
                            )}
                          </div>
                          {/* Only show expiry warning if eSIM has been activated */}
                          {order.activated_at && daysRemaining > 0 && daysRemaining <= 5 && (
                            <p className="text-xs font-bold text-destructive mt-2">
                              ⚠️ Expiring soon! Purchase a new plan to stay connected.
                            </p>
                          )}
                          {!order.activated_at && daysRemaining > 0 && (
                            <p className="text-xs font-bold text-primary mt-2">
                              ⏳ Validity starts when you activate the eSIM
                            </p>
                          )}
                          {daysRemaining <= 0 && (
                            <p className="text-xs font-bold text-destructive mt-2">
                              ⚠️ This plan has expired. Purchase a new plan to stay connected.
                            </p>
                          )}
                        </div>

                        {/* Quick Help Section (only for activated eSIMs) */}
                        {order.activated_at && (
                          <div className="p-3 sm:p-4 bg-white rounded-xl border-2 border-primary/20">
                            <button
                              onClick={() => {
                                setShowQuickHelp(prev => ({ ...prev, [order.id]: !prev[order.id] }));
                                triggerHaptic('light');
                              }}
                              className="w-full flex items-center justify-between text-left"
                            >
                              <span className="font-black uppercase text-xs">❓ Quick Help & Instructions</span>
                              <span className="text-lg">{showQuickHelp[order.id] ? '▼' : '▶'}</span>
                            </button>

                            {showQuickHelp[order.id] && (
                              <div className="mt-4 space-y-3 text-sm">
                                <div className="p-3 bg-mint rounded-lg">
                                  <div className="font-black mb-2">📡 Enable Data Roaming</div>
                                  <p className="text-xs font-bold text-muted-foreground">
                                    <strong>iPhone:</strong> Settings → Cellular → Cellular Data Options → Data Roaming (ON)
                                  </p>
                                  <p className="text-xs font-bold text-muted-foreground mt-1">
                                    <strong>Android:</strong> Settings → Network & Internet → Mobile Network → Roaming (ON)
                                  </p>
                                </div>

                                <div className="p-3 bg-mint rounded-lg">
                                  <div className="font-black mb-2">🔍 Check Installation Status</div>
                                  <p className="text-xs font-bold text-muted-foreground">
                                    <strong>iPhone:</strong> Settings → Cellular → Check for your eSIM plan
                                  </p>
                                  <p className="text-xs font-bold text-muted-foreground mt-1">
                                    <strong>Android:</strong> Settings → Network & Internet → SIMs → Check for your eSIM
                                  </p>
                                </div>

                                <div className="p-3 bg-mint rounded-lg">
                                  <div className="font-black mb-2">⚙️ Select eSIM for Data</div>
                                  <p className="text-xs font-bold text-muted-foreground">
                                    Make sure your eSIM is selected as the data line in your device settings
                                  </p>
                                </div>

                                <Link href="/how-it-works">
                                  <Button className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-xs py-3">
                                    VIEW FULL INSTRUCTIONS
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 sm:gap-3">
                          {/* Show "ACTIVATE SIM" for orders that haven't been activated yet (including provisioning) */}
                          {!order.activated_at ? (
                            <Link href={`/install/${order.id}`} className="flex-1">
                              <Button className="w-full btn-lumbus bg-primary text-white hover:bg-primary/90 font-black text-base sm:text-lg py-4 sm:py-5 ">
                                📲 ACTIVATE SIM
                              </Button>
                            </Link>
                          ) : (
                            <>
                              {/* For activated eSIMs, only show TOP UP button (no VIEW DETAILS needed) */}
                              {order.iccid && !isDepleted && daysRemaining > 0 && (
                                <Link href={`/topup/${order.id}`} className="flex-1">
                                  <Button className="w-full btn-lumbus bg-secondary text-foreground hover:bg-secondary/90 font-black text-base sm:text-lg py-4 sm:py-5 ">
                                    + TOP UP
                                  </Button>
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      );
    })()}
  </>
)}
</div>

          {/* Order History */}
          {pastOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase">
                  ORDER HISTORY (DEPLETED) ({pastOrders.length})
                </h2>
                <Button
                  onClick={() => {
                    setShowOrderHistory(!showOrderHistory);
                    triggerHaptic('light');
                  }}
                  className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-xs sm:text-sm px-4 py-2"
                >
                  {showOrderHistory ? '▼ HIDE' : '▶ SHOW'}
                </Button>
              </div>

              {showOrderHistory && (
                <Card className="bg-yellow border-2 border-secondary shadow-lg  ">
                  <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6">
                    <div className="space-y-3 sm:space-y-4">
                      {pastOrders.map((order) => {
                      const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;
                      const totalData = order.plan?.data_gb || 0;
                      const totalDataFormatted = formatPlanData(totalData);
                      // Format order reference (last 8 characters of order ID)
                      const orderRef = order.id.slice(-8).toUpperCase();

                      return (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl  "
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {countryInfo && <span className="text-3xl flex-shrink-0">{countryInfo.flag}</span>}
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-base sm:text-lg mb-1 truncate">{order.plan?.name.replace(/^["']|["']$/g, '')}</div>
                              <div className="text-xs font-bold text-muted-foreground mb-1">{countryInfo?.name}</div>
                              <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 flex-wrap">
                                <span>📊 {totalDataFormatted}</span>
                                <span>•</span>
                                <span>⏰ {order.plan?.validity_days} days</span>
                                <span>•</span>
                                <span>Order #{orderRef}</span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            <Badge className={`${getStatusColor(getDisplayStatus(order))} font-black uppercase text-xs px-2 sm:px-3 py-1`}>
                              {getDisplayStatus(order)}
                            </Badge>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Referral Section */}
          {referralStats && (
            <div id="refer-earn" className="mb-6 sm:mb-8 md:mb-12 " style={{animationDelay: '0.4s'}}>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-3 sm:mb-4 md:mb-6">REFER & EARN</h2>
              <Card className="bg-purple border-2 sm:border-4 border-accent shadow-xl">
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6">
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    {/* Left: Share Section */}
                    <div>
                      <div className="mb-6">
                        <div className="text-4xl sm:text-5xl mb-4">🎁</div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-3">SHARE & GET REWARDED</h3>
                        <p className="text-sm sm:text-base font-bold text-foreground/70 mb-4">
                          Give your friends 10% off their first order. Get 1GB of free data when they make a purchase!
                        </p>
                      </div>

                      {/* Referral Link */}
                      <div className="bg-white rounded-xl p-3 sm:p-4 mb-4">
                        <div className="font-black uppercase text-xs mb-2 text-muted-foreground">
                          Your Referral Link
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-mint rounded-lg font-mono text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {referralStats.referral_link}
                          </div>
                          <Button
                            onClick={copyReferralLink}
                            className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-4 sm:px-6 "
                          >
                            {copiedLink ? '✓ COPIED' : 'COPY'}
                          </Button>
                        </div>
                      </div>

                      {/* Share Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={shareViaWhatsApp}
                          className="w-full btn-lumbus bg-[#25D366] text-white hover:bg-[#128C7E] font-black py-4  flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">💬</span> SHARE VIA WHATSAPP
                        </Button>
                        <Button
                          onClick={shareViaTwitter}
                          className="w-full btn-lumbus bg-[#1DA1F2] text-white hover:bg-[#0d8bd9] font-black py-4  flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">🐦</span> SHARE ON TWITTER
                        </Button>
                        <Button
                          onClick={shareViaEmail}
                          className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black py-4  flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">✉️</span> SHARE VIA EMAIL
                        </Button>
                      </div>
                    </div>

                    {/* Right: Stats Section */}
                    <div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-4">YOUR STATS</h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white rounded-xl p-4 sm:p-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                              Total Clicks
                            </span>
                            <span className="text-2xl sm:text-3xl font-black">
                              {referralStats.total_clicks}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 sm:p-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                              Friends Referred
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-primary">
                              {referralStats.total_referrals}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 sm:p-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                              Data Earned
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-primary">
                              {(referralStats.earned_rewards / 1024).toFixed(1)} GB
                            </span>
                          </div>
                        </div>

                        {referralStats.pending_rewards > 0 && (
                          <div className="bg-yellow rounded-xl p-4 sm:p-6 border-2 border-secondary">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-black uppercase text-xs sm:text-sm">
                                Pending Data
                              </span>
                              <span className="text-2xl sm:text-3xl font-black">
                                {(referralStats.pending_rewards / 1024).toFixed(1)} GB
                              </span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground mt-2">
                              Will be credited once your friends' orders are completed
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
