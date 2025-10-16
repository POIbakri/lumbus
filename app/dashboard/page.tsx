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
  const { user, loading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [refreshingUsage, setRefreshingUsage] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadOrders = useCallback(async () => {
    try {
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
      const transformedData = data?.map((order: any) => ({
        ...order,
        plan: Array.isArray(order.plan) ? order.plan[0] : order.plan,
      }));

      setOrders(transformedData as OrderWithPlan[]);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadReferralStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/referrals/me?user_id=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferralStats({
          ref_code: data.ref_code,
          referral_link: data.referral_link,
          total_clicks: data.stats.total_clicks || 0,
          total_referrals: data.stats.total_signups || 0,
          pending_rewards: data.stats.pending_rewards || 0,
          earned_rewards: data.stats.earned_rewards || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadOrders();
      loadReferralStats();
    }
  }, [user, loadOrders, loadReferralStats]);

  const handleSignOut = async () => {
    triggerHaptic('medium');
    await signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary text-foreground';
      case 'provisioning':
        return 'bg-yellow text-foreground';
      case 'pending':
        return 'bg-purple text-white';
      case 'failed':
        return 'bg-destructive text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getDataPercentage = (used: number, total: number) => {
    return Math.min(100, (used / total) * 100);
  };

  const getDaysRemaining = (createdAt: string, validityDays: number) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const remaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const copyReferralLink = async () => {
    if (referralStats?.referral_link) {
      try {
        await navigator.clipboard.writeText(referralStats.referral_link);
        setCopiedLink(true);
        triggerHaptic('light');
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
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
        `Get 10% off your first eSIM with @LumbusTravel! Stay connected in 190+ countries. Use my link:`
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
        `Hey! I've been using Lumbus for my international travel connectivity and thought you might like it too.\n\nUse my referral link to get 10% off your first eSIM purchase:\n${referralStats.referral_link}\n\nStay connected in 190+ countries without roaming fees!`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const refreshUsageData = async (orderId: string) => {
    setRefreshingUsage(prev => ({ ...prev, [orderId]: true }));
    triggerHaptic('light');

    try {
      const response = await fetch(`/api/orders/${orderId}/usage`);
      if (response.ok) {
        const usageData = await response.json();

        // Update the order in the state with new usage data
        setOrders(prevOrders =>
          prevOrders.map(order => {
            if (order.id === orderId) {
              return {
                ...order,
                data_usage_bytes: usageData.data_usage_bytes,
                data_remaining_bytes: usageData.data_remaining_bytes,
                last_usage_update: usageData.last_update,
              };
            }
            return order;
          })
        );

        triggerHaptic('light');
      } else {
        console.error('Failed to refresh usage data');
        triggerHaptic('medium');
      }
    } catch (error) {
      console.error('Error refreshing usage:', error);
      triggerHaptic('medium');
    } finally {
      setRefreshingUsage(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status === 'completed' || o.status === 'provisioning');
  const pastOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'provisioning');

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      {/* Dashboard Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 sm:mb-12 animate-slide-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 leading-tight">
              YOUR DASHBOARD
            </h1>
            <p className="text-base sm:text-lg font-bold text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <Card className="bg-mint border-4 border-primary shadow-xl hover-lift card-stack touch-ripple">
              <CardContent className="pt-6">
                <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
                  {activeOrders.length}
                </div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                  Active eSIMs
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow border-4 border-secondary shadow-xl hover-lift card-stack touch-ripple">
              <CardContent className="pt-6">
                <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
                  {orders.length}
                </div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                  Total Orders
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan border-4 border-primary shadow-xl hover-lift card-stack touch-ripple">
              <CardContent className="pt-6">
                <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
                  {activeOrders.reduce((sum, o) => sum + (o.plan?.data_gb || 0), 0)} GB
                </div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                  Total Data
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Section */}
          {referralStats && (
            <div className="mb-8 sm:mb-12 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 sm:mb-6">REFER & EARN</h2>
              <Card className="bg-purple border-4 border-accent shadow-xl">
                <CardContent className="pt-6">
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
                            className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-4 sm:px-6 touch-ripple"
                          >
                            {copiedLink ? '✓ COPIED' : 'COPY'}
                          </Button>
                        </div>
                      </div>

                      {/* Share Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={shareViaWhatsApp}
                          className="w-full btn-lumbus bg-[#25D366] text-white hover:bg-[#128C7E] font-black py-4 touch-ripple flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">💬</span> SHARE VIA WHATSAPP
                        </Button>
                        <Button
                          onClick={shareViaTwitter}
                          className="w-full btn-lumbus bg-[#1DA1F2] text-white hover:bg-[#0d8bd9] font-black py-4 touch-ripple flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">🐦</span> SHARE ON TWITTER
                        </Button>
                        <Button
                          onClick={shareViaEmail}
                          className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black py-4 touch-ripple flex items-center justify-center gap-2"
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
                                Pending Rewards
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

          {/* Active eSIMs */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">ACTIVE ESIMS</h2>
              <Link href="/plans" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black touch-ripple elastic-bounce pulse-glow text-sm sm:text-base px-4 sm:px-6">
                  + BUY NEW ESIM
                </Button>
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <Card className="bg-purple border-2 border-accent shadow-lg animate-slide-up">
                <CardContent className="pt-6 text-center py-8 sm:py-12 px-4">
                  <div className="text-5xl sm:text-6xl mb-4">📱</div>
                  <h3 className="font-black text-xl sm:text-2xl mb-2">NO ACTIVE ESIMS</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {activeOrders.map((order, index) => {
                  const daysRemaining = getDaysRemaining(order.created_at, order.plan?.validity_days || 30);
                  // Calculate real data usage from database
                  const totalDataBytes = (order.plan?.data_gb || 0) * 1024 * 1024 * 1024; // Convert GB to bytes
                  const dataUsedBytes = order.data_usage_bytes || 0;
                  const dataUsedGB = dataUsedBytes / (1024 * 1024 * 1024);
                  const dataPercentage = totalDataBytes > 0 ? getDataPercentage(dataUsedBytes, totalDataBytes) : 0;

                  return (
                    <Card
                      key={order.id}
                      className="bg-mint border-4 border-primary shadow-xl hover-lift card-stack relative overflow-hidden animate-slide-up touch-ripple"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                      <CardHeader className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={`${getStatusColor(order.status)} font-black uppercase text-xs px-2 sm:px-3 py-1`}>
                            {order.status}
                          </Badge>
                          <div className="text-right">
                            <div className="text-xl sm:text-2xl font-black">{order.plan?.region_code}</div>
                          </div>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-black uppercase">{order.plan?.name}</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4 relative z-10">
                        {/* Data Usage */}
                        <div className="p-3 sm:p-4 bg-white rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black uppercase text-xs">Data Usage</span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs sm:text-sm">{dataUsedGB.toFixed(1)} / {order.plan?.data_gb} GB</span>
                              <button
                                onClick={() => refreshUsageData(order.id)}
                                disabled={refreshingUsage[order.id]}
                                className="p-1 hover:bg-foreground/5 rounded-lg transition-colors disabled:opacity-50 touch-ripple"
                                title="Refresh usage data"
                              >
                                <span className={`text-sm ${refreshingUsage[order.id] ? 'animate-spin' : ''}`}>
                                  🔄
                                </span>
                              </button>
                            </div>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{ width: `${dataPercentage}%` }}
                            ></div>
                          </div>
                          {order.last_usage_update && (
                            <p className="text-xs font-bold text-muted-foreground mt-1">
                              Last updated: {new Date(order.last_usage_update).toLocaleString()}
                            </p>
                          )}
                          {dataPercentage > 80 && (
                            <p className="text-xs font-bold text-destructive mt-2">
                              ⚠️ Running low on data! Consider topping up.
                            </p>
                          )}
                          {order.status === 'provisioning' && (
                            <p className="text-xs font-bold text-primary mt-2">
                              ⏳ Your eSIM is being activated. Activation details will appear shortly.
                            </p>
                          )}
                        </div>

                        {/* Expiry */}
                        <div className="p-3 sm:p-4 bg-white rounded-xl">
                          <div className="flex justify-between items-center">
                            <span className="font-black uppercase text-xs">Days Remaining</span>
                            <span className={`font-black text-xl sm:text-2xl ${daysRemaining <= 5 ? 'text-destructive' : ''}`}>
                              {daysRemaining}
                            </span>
                          </div>
                          {daysRemaining <= 5 && (
                            <p className="text-xs font-bold text-destructive mt-2">
                              ⚠️ Expiring soon! Purchase a new plan to stay connected.
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 sm:gap-3">
                          <Link href={`/install/${order.id}`} className="flex-1">
                            <Button className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-xs sm:text-sm py-3 sm:py-4 touch-ripple">
                              VIEW DETAILS
                            </Button>
                          </Link>
                          {(order.status === 'completed' || order.status === 'active') && order.iccid && (
                            <Link href={`/topup/${order.id}`} className="flex-1">
                              <Button className="w-full btn-lumbus bg-secondary text-foreground hover:bg-secondary/90 font-black text-xs sm:text-sm py-3 sm:py-4 touch-ripple">
                                + TOP UP
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order History */}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4 sm:mb-6">ORDER HISTORY</h2>
              <Card className="bg-yellow border-2 border-secondary shadow-lg">
                <CardContent className="pt-6">
                  <div className="space-y-3 sm:space-y-4">
                    {pastOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-base sm:text-lg mb-1 truncate">{order.plan?.name}</div>
                          <div className="text-xs sm:text-sm font-bold text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                          <Badge className={`${getStatusColor(order.status)} font-black uppercase text-xs px-2 sm:px-3 py-1`}>
                            {order.status}
                          </Badge>
                          {order.status === 'completed' && (
                            <Link href={`/install/${order.id}`} className="flex-1 sm:flex-none">
                              <Button className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-xs sm:text-sm px-3 sm:px-4 py-2">
                                VIEW
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
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
