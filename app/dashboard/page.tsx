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
import { DataWallet } from '@/components/data-wallet';
import { AppDownloadBanner } from '@/components/app-download-banner';
import { SocialMediaLinks } from '@/components/social-media-links';
import { FlagIcon } from '@/components/flag-icon';

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


  // Helper to calculate remaining bytes with fallback logic
  const getDataRemainingBytes = (o: OrderWithPlan): number => {
    if (o.data_remaining_bytes != null) {
      return o.data_remaining_bytes;
    }
    // Fallback: calculate from total_bytes or plan data
    const totalBytes = (o as any).total_bytes || ((o.plan?.data_gb || 0) * 1024 * 1024 * 1024);
    const usedBytes = o.data_usage_bytes || 0;
    return Math.max(0, totalBytes - usedBytes);
  };

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
    // Check if depleted - use helper with fallback logic for consistency
    if (getDataRemainingBytes(order) <= 0) {
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

  // Get time remaining with precise hours/minutes support
  const getTimeRemaining = (order: OrderWithPlan): { days: number; hours: number; minutes: number; totalMs: number } => {
    const validityDays = order.plan?.validity_days || 0;

    // If eSIM hasn't been activated yet, return full validity period
    if (!order.activated_at) {
      return { days: validityDays, hours: 0, minutes: 0, totalMs: validityDays * 24 * 60 * 60 * 1000 };
    }

    // Use expires_at if available (more accurate), otherwise calculate from activated_at
    let expiryDate: Date;
    const orderWithExpiry = order as OrderWithPlan & { expires_at?: string };
    if (orderWithExpiry.expires_at) {
      expiryDate = new Date(orderWithExpiry.expires_at);
      // Validate the parsed date - fall back to calculation if invalid
      if (isNaN(expiryDate.getTime())) {
        const activationDate = new Date(order.activated_at);
        expiryDate = new Date(activationDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
      }
    } else {
      const activationDate = new Date(order.activated_at);
      expiryDate = new Date(activationDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    }

    // Final validation - if still invalid, return full validity as fallback
    if (isNaN(expiryDate.getTime())) {
      return { days: validityDays, hours: 0, minutes: 0, totalMs: validityDays * 24 * 60 * 60 * 1000 };
    }

    const now = new Date();
    const totalMs = expiryDate.getTime() - now.getTime();

    if (totalMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, totalMs: 0 };
    }

    const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));

    return { days, hours, minutes, totalMs };
  };

  // Format time remaining for display
  const formatTimeRemaining = (order: OrderWithPlan): string => {
    const { days, hours, minutes, totalMs } = getTimeRemaining(order);

    if (totalMs <= 0) {
      return 'Expired';
    }

    // If more than 1 day, show days
    if (days >= 1) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }

    // If less than 1 day but more than 1 hour, show hours
    if (hours >= 1) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    // If less than 1 hour, show minutes
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  };

  const getDaysRemaining = (order: OrderWithPlan) => {
    const { totalMs } = getTimeRemaining(order);
    // Return -1 for expired, otherwise use ceil to match original behavior
    // This ensures styling thresholds work correctly (e.g., <= 5 days warning)
    if (totalMs <= 0) return -1;
    // Use ceil to round up - 12 hours remaining = 1 day for styling purposes
    return Math.ceil(totalMs / (24 * 60 * 60 * 1000));
  };

  const isOrderExpired = (order: OrderWithPlan) => {
    return getTimeRemaining(order).totalMs <= 0;
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
        `Get 10% OFF + 1GB FREE data on your first eSIM purchase with Lumbus! Use my referral link: ${referralStats.referral_link}`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const shareViaTwitter = () => {
    if (referralStats?.referral_link) {
      const text = encodeURIComponent(
        `Get 10% OFF + 1GB FREE data with your first eSIM from Lumbus! Stay connected in 150+ countries. Use my link:`
      );
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralStats.referral_link)}`,
        '_blank'
      );
    }
  };

  const shareViaEmail = () => {
    if (referralStats?.referral_link) {
      const subject = encodeURIComponent('Get 10% OFF + 1GB FREE data with Lumbus eSIM');
      const body = encodeURIComponent(
        `Hey! I've been using Lumbus for my international travel connectivity and thought you might like it too.\n\nUse my referral link to get 10% OFF + 1GB FREE data on your first eSIM purchase:\n${referralStats.referral_link}\n\nYou get 10% off plus 1GB free data, and I get 1GB free data too! Stay connected in 150+ countries without roaming fees!`
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
  // IMPORTANT: Exclude top-up orders - they share the same ICCID as the original and shouldn't show as separate eSIMs
  const activeOrders = orders.filter(o => {
    // Top-up orders should never show as separate eSIMs
    if ((o as any).is_topup === true) return false;

    const status = o.status;
    const isDepleted = getDataRemainingBytes(o) <= 0;
    const expired = isOrderExpired(o);

    // Explicitly exclude cancelled, revoked, or failed orders
    const isInvalidStatus = ['cancelled', 'revoked', 'failed', 'unknown'].includes(status);

    // Show completed, provisioning, or active orders that aren't depleted, expired, or invalid
    return (status === 'completed' || status === 'provisioning' || status === 'active') && !isDepleted && !expired && !isInvalidStatus;
  });

  // Past orders: Show depleted OR expired eSIMs (exclude top-ups)
  const pastOrders = orders.filter(o => {
    // Top-up orders should never show as separate eSIMs
    if ((o as any).is_topup === true) return false;

    const isDepleted = getDataRemainingBytes(o) <= 0;
    const expired = isOrderExpired(o);
    return isDepleted || expired;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      {/* Dashboard Content */}
      <div className="pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4">
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
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  Refer Friends for Extra GB →
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
                      // Use data_remaining_bytes from DB (most accurate, includes top-ups)
                      // Use != null to catch both null and undefined
                      if (o.data_remaining_bytes != null) {
                        return sum + (o.data_remaining_bytes / (1024 * 1024 * 1024));
                      }
                      // Fallback: calculate from total_bytes or plan data
                      const totalBytes = (o as any).total_bytes || ((o.plan?.data_gb || 0) * 1024 * 1024 * 1024);
                      const usedBytes = o.data_usage_bytes || 0;
                      const remainingGB = Math.max(0, totalBytes - usedBytes) / (1024 * 1024 * 1024);
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
                  <div className="mb-4 flex justify-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                  </div>
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
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase">
                              READY TO ACTIVATE ({readyOrders.length})
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {readyOrders.map((order, index) => {
                              const daysRemaining = getDaysRemaining(order);
                              const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;
                              // Use total_bytes if available (includes top-ups), otherwise fall back to plan data
                              const totalBytes = (order as any).total_bytes || ((order.plan?.data_gb || 0) * 1024 * 1024 * 1024);
                              const totalDataGB = totalBytes / (1024 * 1024 * 1024);
                              const totalDataFormatted = formatPlanData(totalDataGB);

                              return (
                                <Card
                                  key={order.id}
                                  className="bg-yellow border-2 border-foreground/10 hover:border-secondary/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                                  style={{animationDelay: `${index * 0.1}s`}}
                                >
                                  {/* Subtle pulse indicator */}
                                  <div className="absolute top-4 right-4 w-2 h-2 bg-secondary rounded-full animate-pulse"></div>

                                  <CardContent className="p-4 sm:p-5">
                                    {/* Header: Flag + Region + Status */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        {order.plan?.region_code && <FlagIcon countryCode={order.plan.region_code} className="w-10 h-7 sm:w-12 sm:h-8" />}
                                        <div>
                                          <div className="font-black uppercase text-xs sm:text-sm text-foreground">
                                            {order.plan?.region_code}
                                          </div>
                                          <div className="text-xs text-foreground/60 font-medium">
                                            {countryInfo?.name}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge className={`${getStatusColor(getDisplayStatus(order))} font-black uppercase text-xs px-2 sm:px-3 py-1`}>
                                        {getDisplayStatus(order)}
                                      </Badge>
                                    </div>

                                    {/* Plan Name */}
                                    <h3 className="font-bold text-sm sm:text-base text-foreground/80 mb-4 line-clamp-2">
                                      {order.plan?.name.replace(/^["']|["']$/g, '')}
                                    </h3>

                                    {/* Stats Grid: Data + Validity */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                                      <div className="bg-white/60 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                                        <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Data</div>
                                        <div className="text-base sm:text-lg font-black text-foreground">{totalDataFormatted}</div>
                                      </div>
                                      <div className="bg-white/60 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                                        <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Validity</div>
                                        <div className="text-base sm:text-lg font-black text-foreground">{order.plan?.validity_days} days</div>
                                      </div>
                                    </div>

                                    {/* Activation Notice */}
                                    <div className="mb-4 p-3 bg-white/60 rounded-xl">
                                      <div className="flex items-center gap-2 mb-1">
                                        <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="font-black text-xs uppercase">Not Activated Yet</span>
                                      </div>
                                      <p className="text-xs text-foreground/60">
                                        Tap below to install. Your {daysRemaining} days start after activation.
                                      </p>
                                    </div>

                                    {/* Activate Button */}
                                    <Link href={`/install/${order.id}`} className="block">
                                      <Button className="w-full bg-foreground hover:bg-foreground/90 text-white font-black text-sm sm:text-base py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all shadow-lg">
                                        <span className="flex items-center justify-center gap-2">
                                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                          ACTIVATE SIM NOW
                                        </span>
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
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase">
                              ACTIVE & USING ({activeOnlyOrders.length})
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {activeOnlyOrders.map((order, index) => {
                  const daysRemaining = getDaysRemaining(order);
                  const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;

                  // Calculate data usage - use total_bytes if available (includes top-ups)
                  const totalBytes = (order as any).total_bytes || ((order.plan?.data_gb || 0) * 1024 * 1024 * 1024);
                  const totalGB = totalBytes / (1024 * 1024 * 1024);

                  const dataUsedBytes = order.data_usage_bytes || 0;
                  const dataUsedGB = dataUsedBytes / (1024 * 1024 * 1024);

                  // Use data_remaining_bytes from DB if available (most accurate after top-ups)
                  // Use != null to catch both null and undefined
                  const dataRemainingBytes = order.data_remaining_bytes != null
                    ? order.data_remaining_bytes
                    : Math.max(0, totalBytes - dataUsedBytes);
                  const dataRemainingGB = dataRemainingBytes / (1024 * 1024 * 1024);

                  // Progress bar shows USED percentage (fills up as you use data)
                  const dataUsedPercentage = totalBytes > 0 ? (dataUsedBytes / totalBytes) * 100 : 0;

                  // Format data for display
                  const formatData = (gb: number) => {
                    // Show 0 MB only if truly 0 (less than 0.001 MB = 1 KB)
                    if (gb < 0.000001) return '0 MB';
                    return formatDataUsage(gb); // Use precise formatting for usage
                  };

                  const totalDataFormatted = formatPlanData(totalGB); // Use total including top-ups

                  // Check if plan is depleted - use calculated dataRemainingBytes for consistency
                  // (includes fallback logic when DB value is null/undefined)
                  const isDepleted = dataRemainingBytes <= 0;

                  return (
                    <Card
                      key={order.id}
                      className="bg-mint border-2 border-foreground/10 hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <CardContent className="p-4 sm:p-5">
                        {/* Header: Flag + Region + Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {order.plan?.region_code && <FlagIcon countryCode={order.plan.region_code} className="w-10 h-7 sm:w-12 sm:h-8" />}
                            <div>
                              <div className="font-black uppercase text-xs sm:text-sm text-foreground">
                                {order.plan?.region_code}
                              </div>
                              <div className="text-xs text-foreground/60 font-medium">
                                {countryInfo?.name}
                              </div>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(getDisplayStatus(order))} font-black uppercase text-xs px-2 sm:px-3 py-1`}>
                            {getDisplayStatus(order)}
                          </Badge>
                        </div>

                        {/* Plan Name */}
                        <h3 className="font-bold text-sm sm:text-base text-foreground/80 mb-4 line-clamp-2">
                          {order.plan?.name.replace(/^["']|["']$/g, '')}
                        </h3>

                        {/* Stats Grid: Data + Validity + Days Left */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                          <div className="bg-white/60 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                            <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Data</div>
                            <div className="text-base sm:text-lg font-black text-foreground">{totalDataFormatted}</div>
                          </div>
                          <div className="bg-cyan/40 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                            <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Valid</div>
                            <div className="text-base sm:text-lg font-black text-foreground">{order.plan?.validity_days} days</div>
                          </div>
                          <div className={`${daysRemaining <= 5 && order.activated_at ? 'bg-destructive/20' : 'bg-white/60'} rounded-lg sm:rounded-xl p-2 sm:p-3 text-center`}>
                            <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Left</div>
                            <div className={`text-base sm:text-lg font-black ${daysRemaining <= 0 ? 'text-destructive' : daysRemaining <= 5 && order.activated_at ? 'text-destructive' : 'text-foreground'}`}>
                              {formatTimeRemaining(order)}
                            </div>
                          </div>
                        </div>

                        {/* Data Usage Progress */}
                        <div className="mb-4 p-3 bg-white/60 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-foreground/60 uppercase">Usage</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black">{formatData(dataRemainingGB)} left</span>
                              {order.activated_at && (
                                <button
                                  onClick={() => refreshUsageData(order.id)}
                                  disabled={refreshingUsage[order.id]}
                                  className="text-primary hover:text-primary/80 disabled:opacity-50"
                                  title="Refresh usage"
                                >
                                  <svg className={`w-3.5 h-3.5 ${refreshingUsage[order.id] ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                dataUsedPercentage < 50 ? 'bg-primary' :
                                dataUsedPercentage < 80 ? 'bg-yellow-500' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${dataUsedPercentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-xs font-medium text-foreground/50">{formatData(dataUsedGB)} used</span>
                            <span className="text-xs font-medium text-foreground/50">{dataUsedPercentage.toFixed(0)}%</span>
                          </div>
                          {dataUsedPercentage > 80 && dataUsedPercentage < 100 && (
                            <p className="text-xs font-bold text-destructive mt-2 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                              Running low! Consider topping up.
                            </p>
                          )}
                        </div>

                        {/* Warnings */}
                        {order.activated_at && daysRemaining > 0 && daysRemaining <= 5 && (
                          <p className="text-xs font-bold text-destructive mb-4 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            Expiring soon! Purchase a new plan.
                          </p>
                        )}
                        {!order.activated_at && daysRemaining > 0 && (
                          <p className="text-xs font-bold text-primary mb-4 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Validity starts when activated
                          </p>
                        )}
                        {daysRemaining <= 0 && (
                          <p className="text-xs font-bold text-destructive mb-4 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            Expired. Purchase a new plan.
                          </p>
                        )}

                        {/* Quick Help Toggle (only for activated eSIMs) */}
                        {order.activated_at && (
                          <div className="mb-4">
                            <button
                              onClick={() => {
                                setShowQuickHelp(prev => ({ ...prev, [order.id]: !prev[order.id] }));
                                triggerHaptic('light');
                              }}
                              className="w-full px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors font-bold text-xs flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2 text-foreground/70">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                                Quick Help
                              </span>
                              <svg className={`w-4 h-4 text-foreground/50 transition-transform ${showQuickHelp[order.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {showQuickHelp[order.id] && (
                              <div className="mt-2 p-3 bg-foreground/5 rounded-lg space-y-2">
                                <div className="text-xs">
                                  <span className="font-black">Data Roaming:</span>
                                  <span className="text-foreground/70"> Settings → Cellular → Data Roaming ON</span>
                                </div>
                                <div className="text-xs">
                                  <span className="font-black">Set as Data Line:</span>
                                  <span className="text-foreground/70"> Select your eSIM for mobile data</span>
                                </div>
                                <Link href="/how-it-works" className="block mt-2">
                                  <Button className="w-full bg-foreground text-white hover:bg-foreground/90 font-black text-xs py-2 rounded-lg">
                                    FULL INSTRUCTIONS
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Button */}
                        {!order.activated_at ? (
                          <Link href={`/install/${order.id}`} className="block">
                            <Button className="w-full bg-foreground hover:bg-foreground/90 text-white font-black text-sm sm:text-base py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all">
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                ACTIVATE SIM
                              </span>
                            </Button>
                          </Link>
                        ) : (
                          order.iccid && !isDepleted && daysRemaining > 0 && (
                            <Link href={`/topup/${order.id}`} className="block">
                              <Button className="w-full bg-foreground hover:bg-foreground/90 text-white font-black text-sm sm:text-base py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all">
                                <span className="flex items-center justify-center gap-2">
                                  + TOP UP DATA
                                </span>
                              </Button>
                            </Link>
                          )
                        )}
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
                  ORDER HISTORY ({pastOrders.length})
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
                      // Use total_bytes if available (includes top-ups), otherwise fall back to plan data
                      const totalBytes = (order as any).total_bytes || ((order.plan?.data_gb || 0) * 1024 * 1024 * 1024);
                      const totalDataGB = totalBytes / (1024 * 1024 * 1024);
                      const totalDataFormatted = formatPlanData(totalDataGB);
                      // Format order reference (last 8 characters of order ID)
                      const orderRef = order.id.slice(-8).toUpperCase();

                      // Check both depleted and expired status - use helper for consistency
                      const isDepleted = getDataRemainingBytes(order) <= 0;
                      const isExpired = isOrderExpired(order);

                      return (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl  "
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {order.plan?.region_code && <FlagIcon countryCode={order.plan.region_code} className="w-10 h-7 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-base sm:text-lg mb-1 truncate">{order.plan?.name.replace(/^["']|["']$/g, '')}</div>
                              <div className="text-xs font-bold text-muted-foreground mb-1">{countryInfo?.name}</div>
                              <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> {totalDataFormatted}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {order.plan?.validity_days} days</span>
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
                          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                            {/* Show both badges if order is both depleted AND expired */}
                            {isDepleted && (
                              <Badge className="bg-red-500 text-white font-black uppercase text-xs px-2 sm:px-3 py-1">
                                depleted
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge className="bg-orange-500 text-white font-black uppercase text-xs px-2 sm:px-3 py-1">
                                expired
                              </Badge>
                            )}
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
            <div id="refer-earn" className="mb-6 sm:mb-8 md:mb-12 " style={{animationDelay: '0.3s'}}>
              <div className="mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase">REFER & EARN</h2>
              </div>
              <Card className="bg-white border-2 sm:border-4 border-foreground shadow-xl rounded-2xl sm:rounded-3xl">
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                  {/* Header Badge */}
                  <div className="text-center mb-6 sm:mb-8">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-3 sm:mb-4 leading-tight">
                      REFER FRIENDS
                    </h3>
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
                      <div className="bg-primary px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-foreground">
                        <div className="text-xs font-bold text-foreground/70 mb-1">THEY GET</div>
                        <div className="text-lg sm:text-xl font-black">10% OFF</div>
                        <div className="text-lg sm:text-xl font-black">+ 1GB FREE</div>
                      </div>
                      <div className="text-2xl sm:text-3xl">+</div>
                      <div className="bg-secondary px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-foreground">
                        <div className="text-xs font-bold text-foreground/70 mb-1">YOU GET</div>
                        <div className="text-xl sm:text-2xl font-black">1GB FREE</div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-foreground/60">
                      Share your link, earn data rewards
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    {/* Left: Share Section */}
                    <div>

                      {/* Referral Link */}
                      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-4 sm:p-5 mb-4 border-2 border-foreground/20 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                          <div className="font-black uppercase text-sm">
                            Your Referral Link
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="px-4 py-3 bg-white rounded-xl font-mono text-xs sm:text-sm break-all border-2 border-foreground/10 shadow-sm">
                            {referralStats.referral_link}
                          </div>
                          <Button
                            onClick={copyReferralLink}
                            className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 hover:scale-105 font-black py-4 text-base border-2 border-foreground shadow-lg transition-transform"
                          >
                            {copiedLink ? (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                COPIED!
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                COPY LINK
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Share Buttons */}
                      <div className="space-y-3">
                        <div className="font-black uppercase text-xs text-foreground/60 mb-2">
                          SHARE YOUR LINK
                        </div>
                        <Button
                          onClick={shareViaWhatsApp}
                          className="w-full btn-lumbus bg-[#25D366] text-white hover:bg-[#128C7E] hover:scale-105 font-black py-4 text-base flex items-center justify-center gap-3 border-2 border-foreground shadow-lg transition-transform"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          <span>WHATSAPP</span>
                        </Button>
                        <Button
                          onClick={shareViaTwitter}
                          className="w-full btn-lumbus bg-white hover:bg-gray-100 hover:scale-105 font-black py-4 text-base flex items-center justify-center gap-3 border-2 border-foreground shadow-lg transition-transform"
                        >
                          <svg className="w-6 h-6 flex-shrink-0 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span className="text-black font-black">X</span>
                        </Button>
                        <Button
                          onClick={shareViaEmail}
                          className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 hover:scale-105 font-black py-4 text-base flex items-center justify-center gap-3 border-2 border-foreground shadow-lg transition-transform"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          <span>EMAIL</span>
                        </Button>
                      </div>
                    </div>

                    {/* Right: Stats Section */}
                    <div>
                      <div className="space-y-3">
                        {/* Total Clicks */}
                        <div className="bg-cyan rounded-2xl p-4 sm:p-5 border-2 border-primary shadow-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-black uppercase text-xs text-foreground/70 mb-1">
                                TOTAL CLICKS
                              </div>
                              <div className="text-3xl sm:text-4xl font-black text-foreground">
                                {referralStats.total_clicks}
                              </div>
                              <div className="text-xs font-bold text-foreground/70 mt-2">
                                {referralStats.total_clicks === 0 ? 'Start sharing to get clicks!' : `${((referralStats.total_referrals / Math.max(referralStats.total_clicks, 1)) * 100).toFixed(1)}% conversion rate`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Friends Referred */}
                        <div className="bg-mint rounded-2xl p-4 sm:p-5 border-2 border-primary shadow-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-black uppercase text-xs text-foreground/70 mb-1">
                                FRIENDS JOINED
                              </div>
                              <div className="text-3xl sm:text-4xl font-black text-foreground">
                                {referralStats.total_referrals}
                              </div>
                              <div className="text-xs font-bold text-foreground/70 mt-2">
                                {referralStats.total_referrals === 0 ? 'Invite your first friend!' : `${referralStats.total_referrals} ${referralStats.total_referrals === 1 ? 'friend' : 'friends'} signed up`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Data Earned */}
                        <div className="bg-yellow rounded-2xl p-4 sm:p-5 border-2 border-secondary shadow-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-black uppercase text-xs text-foreground/70 mb-1">
                                DATA EARNED
                              </div>
                              <div className="text-3xl sm:text-4xl font-black text-foreground">
                                {(referralStats.earned_rewards / 1024).toFixed(1)} GB
                              </div>
                              <div className="text-xs font-bold text-foreground/70 mt-2">
                                {referralStats.earned_rewards === 0 ? 'Start earning free data!' : 'Keep sharing to earn more!'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pending Rewards */}
                        {referralStats.pending_rewards > 0 && (
                          <div className="bg-purple rounded-2xl p-4 sm:p-5 border-2 border-accent shadow-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-black uppercase text-xs text-white/90 mb-1">
                                  PENDING DATA
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-white">
                                  {(referralStats.pending_rewards / 1024).toFixed(1)} GB
                                </div>
                                <div className="text-xs font-bold text-white/90 mt-2">
                                  Credited when orders complete
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* App Download Banner */}
          <div className="mb-6 sm:mb-8 md:mb-12" style={{animationDelay: '0.35s'}}>
            <AppDownloadBanner variant="dashboard" dismissible={true} />
          </div>

          {/* Data Wallet Section */}
          <div className="mb-6 sm:mb-8 md:mb-12" style={{animationDelay: '0.4s'}}>
            <DataWallet />
          </div>

          {/* Account Settings Section */}
          <div className="mb-6 sm:mb-8 md:mb-12" style={{animationDelay: '0.5s'}}>
            <Card className="bg-purple border-2 sm:border-3 md:border-4 border-accent shadow-xl rounded-2xl sm:rounded-3xl">
              <CardHeader className="border-b-2 border-accent/20 px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase flex items-center gap-2 sm:gap-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="break-all">ACCOUNT SETTINGS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Privacy Policy */}
                  <Link href="/privacy" className="block">
                    <Button
                      variant="outline"
                      className="w-full btn-lumbus bg-white hover:bg-gray-50 font-black py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm md:text-base border-2 border-foreground justify-between"
                    >
                      <span className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <span className="truncate">PRIVACY POLICY</span>
                      </span>
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>

                  {/* Terms of Service */}
                  <Link href="/terms" className="block">
                    <Button
                      variant="outline"
                      className="w-full btn-lumbus bg-white hover:bg-gray-50 font-black py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm md:text-base border-2 border-foreground justify-between"
                    >
                      <span className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                        <span className="truncate">TERMS OF SERVICE</span>
                      </span>
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>

                  {/* Request Data Deletion */}
                  <Link href="/deletedata" className="block">
                    <Button
                      variant="outline"
                      className="w-full btn-lumbus bg-white hover:bg-gray-50 font-black py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm md:text-base border-2 border-foreground justify-between"
                    >
                      <span className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        <span className="truncate">DATA DELETION</span>
                      </span>
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>

                  {/* Help Center */}
                  <Link href="/help" className="block">
                    <Button
                      variant="outline"
                      className="w-full btn-lumbus bg-white hover:bg-gray-50 font-black py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm md:text-base border-2 border-foreground justify-between"
                    >
                      <span className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                        <span className="truncate">HELP CENTER</span>
                      </span>
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>

                  {/* Support Email */}
                  <a href="mailto:support@getlumbus.com" className="block">
                    <Button
                      variant="outline"
                      className="w-full btn-lumbus bg-white hover:bg-gray-50 font-black py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm md:text-base border-2 border-foreground justify-between"
                    >
                      <span className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        <span className="truncate">CONTACT SUPPORT</span>
                      </span>
                      <span className="ml-1">→</span>
                    </Button>
                  </a>

                  {/* Delete Account - Danger Zone */}
                  <Link href="/delete-account" className="block sm:col-span-2 lg:col-span-1">
                    <Button
                      variant="outline"
                      className="w-full btn-lumbus bg-destructive text-white hover:bg-destructive/90 font-black py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm md:text-base border-2 border-foreground justify-between"
                      onClick={() => triggerHaptic('heavy')}
                    >
                      <span className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        <span className="truncate">DELETE ACCOUNT</span>
                      </span>
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>
                </div>

                {/* Account Info */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/10 rounded-lg sm:rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-bold text-white/70 mb-1">EMAIL</p>
                      <p className="text-xs sm:text-sm font-bold text-white break-all">{user?.email || 'Loading...'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/70 mb-1">USER ID</p>
                      <p className="text-xs sm:text-sm font-mono text-white break-all">{user?.id || 'Loading...'}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Follow Section */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/10 rounded-lg sm:rounded-xl">
                  <p className="text-xs font-bold text-white/70 mb-3 uppercase">Follow Us On Social Media</p>
                  <SocialMediaLinks variant="dashboard" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
