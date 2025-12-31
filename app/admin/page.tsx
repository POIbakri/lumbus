'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCountryInfo } from '@/lib/countries';
import { AdminDiscountCodes } from '@/components/admin-discount-codes';
import { AdminManageData } from '@/components/admin-manage-data';
import { FlagIcon } from '@/components/flag-icon';
import { SUPPORTED_CURRENCIES, type Currency } from '@/lib/currency';

type TabType = 'overview' | 'orders' | 'affiliates' | 'rewards' | 'payouts' | 'discounts' | 'data' | 'email' | 'analytics' | 'refunds';

interface EmailUser {
  id: string;
  email: string;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  user_email: string;
  stripe_session_id: string | null;
  payment_method: string | null;
  amount_cents: number | null;
  currency: string;
  data_usage_bytes: number | null;
  data_remaining_bytes: number | null;
  total_bytes: number | null;
  iccid: string | null;
  is_topup: boolean;
  topup_source: string | null;
  discount_code: string | null;
  discount_percent: number | null;
  plan: {
    name: string;
    region_code: string;
    data_gb: number;
    validity_days: number;
    retail_price: number;
    currency?: string;
  } | null;
}

interface Affiliate {
  id: string;
  display_name: string;
  email: string;
  website: string | null;
  audience_description: string;
  traffic_sources: string;
  promotional_methods: string;
  slug: string;
  commission_value: number;
  application_status: string;
  applied_at: string;
  stats?: {
    total_clicks: number;
    total_conversions: number;
    total_commissions_earned: number;
    pending_commissions: number;
    conversion_rate: string;
  };
}

interface Reward {
  id: string;
  order_id: string;
  referrer_email: string;
  referred_email: string;
  reward_type: string;
  reward_value_mb: number;
  reward_value_gb: string;
  status: string;
  created_at: string;
  applied_at: string | null;
  notes: string | null;
}

interface Commission {
  id: string;
  order_id: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_email: string;
  affiliate_slug: string;
  customer_email: string;
  commission_cents: number;
  commission_usd: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

interface AnalyticsData {
  event_type: string;
  period_days: number;
  today: { total: number; ios: number; android: number };
  daily: Record<string, { total: number; ios: number; android: number }>;
  total: number;
}

interface RefundableOrder {
  id: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  stripe_session_id: string | null;
  amount_cents: number | null;
  currency: string;
  is_topup: boolean;
  refunded_at: string | null;
  refund_reason: string | null;
  plan: {
    name: string;
    data_gb: number;
    retail_price: number;
  } | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Unfiltered orders for overview stats
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardStats, setRewardStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionStats, setCommissionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [rewardStatusFilter, setRewardStatusFilter] = useState('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');

  // Email tab state
  const [emailUsers, setEmailUsers] = useState<EmailUser[]>([]);
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailType, setEmailType] = useState('welcome');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  // Custom email state
  const [customSubject, setCustomSubject] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customContent, setCustomContent] = useState('');

  // Analytics tab state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState(7);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Refunds tab state
  const [refundSearch, setRefundSearch] = useState('');
  const [refundUser, setRefundUser] = useState<{ id: string; email: string } | null>(null);
  const [refundOrders, setRefundOrders] = useState<RefundableOrder[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState<string | null>(null);
  const [refundResult, setRefundResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'rewards') loadRewards();
    if (activeTab === 'payouts') loadCommissions();
    if (activeTab === 'email') loadEmailUsers();
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab, orderStatusFilter, rewardStatusFilter, commissionStatusFilter, analyticsPeriod]);

  // Load email users when search changes and clear selections
  useEffect(() => {
    if (activeTab === 'email') {
      setSelectedEmails([]); // Clear selections when search changes
      const timeoutId = setTimeout(() => loadEmailUsers(), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [emailSearch]);

  const loadData = async () => {
    try {
      await Promise.all([loadAllOrders(), loadOrders(), loadAffiliates(), loadRewards(), loadCommissions()]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load all orders (unfiltered) for overview statistics
  const loadAllOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders?status=all');
      if (response.status === 401) {
        setError('Authentication required');
        return;
      }
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setAllOrders(data);
    } catch (err) {
      console.error('Failed to load all orders:', err);
    }
  };

  // Load filtered orders for the Orders tab
  const loadOrders = async () => {
    try {
      const response = await fetch(`/api/admin/orders?status=${orderStatusFilter}`);
      if (response.status === 401) {
        setError('Authentication required');
        return;
      }
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const loadAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates');
      if (response.status === 401) {
        setError('Authentication required');
        return;
      }
      if (!response.ok) throw new Error('Failed to load affiliates');
      const data = await response.json();
      setAffiliates(data);
    } catch (err) {
      console.error('Failed to load affiliates:', err);
    }
  };

  const loadRewards = async () => {
    try {
      const response = await fetch(`/api/admin/rewards?status=${rewardStatusFilter}`);
      if (!response.ok) throw new Error('Failed to load rewards');
      const data = await response.json();
      setRewards(data.rewards || []);
      setRewardStats(data.stats);
    } catch (err) {
      console.error('Failed to load rewards:', err);
    }
  };

  const loadCommissions = async () => {
    try {
      const url = commissionStatusFilter !== 'all'
        ? `/api/admin/payouts?status=${commissionStatusFilter}`
        : '/api/admin/payouts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load commissions');
      const data = await response.json();
      setCommissions(data.commissions || []);
      setCommissionStats(data.stats);
    } catch (err) {
      console.error('Failed to load commissions:', err);
    }
  };

  const loadEmailUsers = async () => {
    try {
      const url = emailSearch
        ? `/api/admin/email?search=${encodeURIComponent(emailSearch)}`
        : '/api/admin/email';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setEmailUsers(data.users || []);
      setTotalUsers(data.totalUsers || 0);
    } catch (err) {
      console.error('Failed to load email users:', err);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/analytics/events?event_type=first_open&days=${analyticsPeriod}`);
      if (!response.ok) throw new Error('Failed to load analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const searchRefundUser = async (isRefresh = false) => {
    if (!refundSearch.trim()) return;

    setRefundLoading(true);
    if (!isRefresh) {
      setRefundUser(null);
      setRefundOrders([]);
      setRefundResult(null);
    }

    try {
      const response = await fetch(`/api/admin/refunds?email=${encodeURIComponent(refundSearch.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        // Only show error if not a refresh, to avoid overwriting success message
        if (!isRefresh) {
          setRefundResult({ success: false, message: data.error || 'User not found' });
        }
        return;
      }

      setRefundUser(data.user);
      setRefundOrders(data.orders || []);
    } catch (err) {
      // Only show error if not a refresh, to avoid overwriting success message
      if (!isRefresh) {
        setRefundResult({ success: false, message: 'Failed to search for user' });
      }
    } finally {
      setRefundLoading(false);
    }
  };

  const processRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to issue a refund for this order? This action cannot be undone.')) {
      return;
    }

    setRefundProcessing(orderId);
    setRefundResult(null);

    try {
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: 'Admin initiated refund' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRefundResult({ success: false, message: data.error || 'Failed to process refund' });
        return;
      }

      setRefundResult({ success: true, message: data.message });
      // Refresh the orders list without clearing the success message
      await searchRefundUser(true);
    } catch (err) {
      setRefundResult({ success: false, message: 'Failed to process refund' });
    } finally {
      setRefundProcessing(null);
    }
  };

  const handleSendEmail = async (sendToAll: boolean = false) => {
    const targetType = sendToAll ? `${emailType}_all` : emailType;

    // Milestone summary doesn't need recipients - it goes to admins
    const isMilestoneSummary = emailType === 'milestone_summary';
    const isCustomEmail = emailType === 'custom';

    if (!isMilestoneSummary && !sendToAll && selectedEmails.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    // Validate custom email fields
    if (isCustomEmail && (!customSubject || !customTitle || !customContent)) {
      alert('Please fill in all required fields (Subject, Title, and Content)');
      return;
    }

    if (sendToAll && !confirm(`Are you sure you want to send this email to ALL users (${totalUsers})?`)) {
      return;
    }

    setEmailSending(true);
    setEmailResult(null);

    try {
      const requestBody: Record<string, unknown> = {
        emailType: targetType,
        recipients: sendToAll ? [] : selectedEmails,
      };

      // Add custom email fields if applicable
      if (isCustomEmail) {
        requestBody.customSubject = customSubject;
        requestBody.customTitle = customTitle;
        requestBody.customSubtitle = customSubtitle;
        requestBody.customContent = customContent;
      }

      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setEmailResult({ sent: data.sent, failed: data.failed });
      if (!sendToAll) {
        setSelectedEmails([]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setEmailSending(false);
    }
  };

  const toggleEmailSelection = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const selectAllEmails = () => {
    const visibleEmails = emailUsers.map(u => u.email);
    const allVisibleSelected = visibleEmails.length > 0 &&
      visibleEmails.every(email => selectedEmails.includes(email));

    if (allVisibleSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(visibleEmails);
    }
  };

  // Check if all visible emails are selected (for button text)
  const allVisibleSelected = emailUsers.length > 0 &&
    emailUsers.every(u => selectedEmails.includes(u.email));

  const handleApprove = async (affiliateId: string) => {
    setActionLoading(affiliateId);
    try {
      const response = await fetch(`/api/affiliates/${affiliateId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to approve affiliate');
      await loadAffiliates();
    } catch (err) {
      alert('Failed to approve affiliate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (affiliateId: string) => {
    const reason = rejectionReason[affiliateId];
    if (!reason || !confirm('Are you sure you want to reject this affiliate application?')) return;

    setActionLoading(affiliateId);
    try {
      const response = await fetch(`/api/affiliates/${affiliateId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject affiliate');
      await loadAffiliates();
      setRejectionReason((prev) => {
        const newState = { ...prev };
        delete newState[affiliateId];
        return newState;
      });
    } catch (err) {
      alert('Failed to reject affiliate');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center glass p-8 rounded-3xl float-shadow">
          <div className="inline-block rounded-full h-12 w-12 border-b-2 border-primary mb-4 animate-spin"></div>
          <p className="font-black text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center glass p-8 rounded-3xl float-shadow">
          <p className="text-destructive font-black text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'glass-mint border-primary/30',
      completed: 'glass-mint border-primary/30',
      paid: 'glass-yellow border-secondary/30',
      provisioning: 'glass-yellow border-secondary/30',
      pending: 'glass-purple border-accent/30',
      failed: 'bg-destructive/20 border-destructive/30',
      PENDING: 'glass-yellow border-secondary/30',
      APPROVED: 'glass-mint border-primary/30',
      APPLIED: 'glass-mint border-primary/30',
      PAID: 'glass-cyan border-primary/30',
      VOID: 'bg-destructive/20 border-destructive/30',
    };
    return styles[status] || 'glass border-foreground/20';
  };

  // Overview statistics use allOrders (unfiltered) to show accurate totals
  const totalRevenue = allOrders.reduce((sum, order) => {
    if (['completed', 'active'].includes(order.status) && order.plan) {
      return sum + order.plan.retail_price;
    }
    return sum;
  }, 0);

  const successfulOrders = allOrders.filter(o => ['completed', 'active'].includes(o.status)).length;
  const topupOrders = allOrders.filter(o => o.is_topup).length;
  const pendingAffiliates = affiliates.filter(a => a.application_status === 'pending').length;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'affiliates', label: 'Affiliates' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'discounts', label: 'Discount Codes' },
    { id: 'data', label: 'Manage Data' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'email', label: 'Email' },
    { id: 'analytics', label: 'App Analytics' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logotrans.png"
                  alt="Lumbus"
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin Dashboard</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Lumbus Control Center</p>
                </div>
              </div>
              <div className="glass rounded-xl px-4 py-2 border border-foreground/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Today</p>
                <p className="text-sm font-black">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 sm:mb-8 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black uppercase text-xs sm:text-sm transition-all ${
                    activeTab === tab.id
                      ? 'glass-dark text-white float-shadow'
                      : 'glass hover:glass-mint border border-foreground/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <Card className="glass-mint border border-primary/30 float-shadow hover-lift rounded-2xl sm:rounded-3xl glass-inner-glow">
                  <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">{allOrders.length}</div>
                    <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Total Orders</div>
                  </CardContent>
                </Card>
                <Card className="glass-yellow border border-secondary/30 float-shadow hover-lift rounded-2xl sm:rounded-3xl glass-inner-glow">
                  <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">{successfulOrders}</div>
                    <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Successful</div>
                  </CardContent>
                </Card>
                <Card className="glass-cyan border border-primary/30 float-shadow hover-lift rounded-2xl sm:rounded-3xl glass-inner-glow">
                  <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">${totalRevenue.toFixed(0)}</div>
                    <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Revenue (USD)</div>
                  </CardContent>
                </Card>
                <Card className="glass-purple border border-accent/30 float-shadow hover-lift rounded-2xl sm:rounded-3xl glass-inner-glow">
                  <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-1 sm:mb-2">{topupOrders}</div>
                    <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Top-ups</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders Preview */}
              <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl sm:text-2xl font-black uppercase">Recent Orders</CardTitle>
                  <Button onClick={() => setActiveTab('orders')} className="glass-dark text-white font-black text-xs px-4 py-2 rounded-xl">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 glass rounded-xl glass-inner-glow">
                        <div className="flex items-center gap-3">
                          {order.plan?.region_code && <FlagIcon countryCode={order.plan.region_code} className="w-8 h-6" />}
                          <div>
                            <p className="font-black text-sm">{order.user_email}</p>
                            <p className="text-xs text-muted-foreground">{order.plan?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.is_topup && (
                            <Badge className="glass-cyan border border-primary/30 font-black text-xs">TOP-UP</Badge>
                          )}
                          <Badge className={`${getStatusBadge(order.status)} font-black uppercase text-xs border`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Filter */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="font-black uppercase text-sm text-muted-foreground">Filter:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="glass rounded-xl px-4 py-2 font-bold text-sm border border-foreground/10 focus:outline-none focus:border-primary"
                >
                  <option value="all">All Paid Orders</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <Badge className="glass-mint border border-primary/30 font-black text-xs px-3 py-1">
                  {orders.length} orders
                </Badge>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                    <CardContent className="py-12 text-center">
                      <p className="font-black text-lg">No orders found</p>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order) => {
                    const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;
                    return (
                      <Card key={order.id} className="glass border border-foreground/20 hover:border-primary/30 float-shadow hover-lift rounded-2xl transition-all">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Order Info */}
                            <div className="flex items-start gap-3">
                              {order.plan?.region_code && <FlagIcon countryCode={order.plan.region_code} className="w-10 h-7 flex-shrink-0" />}
                              <div className="min-w-0">
                                <p className="font-black text-sm truncate">{order.plan?.name?.replace(/"/g, '') || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{countryInfo?.name}</p>
                                <p className="text-xs font-bold text-muted-foreground truncate mt-1">{order.user_email}</p>
                              </div>
                            </div>

                            {/* Plan Details */}
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Plan</p>
                              {order.plan && (
                                <div className="space-y-1">
                                  <p className="text-sm font-bold">{order.plan.data_gb} GB • {order.plan.validity_days} days</p>
                                  <p className="text-sm font-black text-primary">${order.plan.retail_price.toFixed(2)}</p>
                                </div>
                              )}
                            </div>

                            {/* Payment */}
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Payment</p>
                              <p className="text-sm font-bold capitalize">{order.payment_method || 'stripe'}</p>
                              <p className="text-xs text-muted-foreground">{order.paid_at ? new Date(order.paid_at).toLocaleDateString() : 'N/A'}</p>
                            </div>

                            {/* Type & Discount */}
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Type</p>
                              <div className="flex flex-wrap gap-2">
                                {order.is_topup ? (
                                  <Badge className="glass-cyan border border-primary/30 font-black text-xs">
                                    TOP-UP {order.topup_source ? `(${order.topup_source})` : ''}
                                  </Badge>
                                ) : (
                                  <Badge className="glass-mint border border-primary/30 font-black text-xs">NEW</Badge>
                                )}
                                {order.discount_code && (
                                  <Badge className="glass-yellow border border-secondary/30 font-black text-xs">
                                    {order.discount_code} ({order.discount_percent}%)
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Status</p>
                              <Badge className={`${getStatusBadge(order.status)} font-black uppercase text-xs border`}>
                                {order.status}
                              </Badge>
                              {order.iccid && (
                                <p className="text-xs font-mono mt-2 truncate">{order.iccid.substring(0, 12)}...</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Affiliates Tab */}
          {activeTab === 'affiliates' && (
            <div className="space-y-6">
              {/* Pending Applications */}
              {affiliates.filter(a => a.application_status === 'pending').length > 0 && (
                <Card className="glass-yellow border border-secondary/30 float-shadow rounded-2xl sm:rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-black uppercase flex items-center gap-2">
                      Pending Applications
                      <Badge className="glass-purple border border-accent/30 font-black text-sm">
                        {affiliates.filter(a => a.application_status === 'pending').length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {affiliates.filter(a => a.application_status === 'pending').map((affiliate) => (
                      <Card key={affiliate.id} className="glass border border-foreground/20 rounded-2xl">
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <h3 className="text-xl sm:text-2xl font-black mb-1">{affiliate.display_name}</h3>
                                <p className="text-sm font-bold text-muted-foreground">{affiliate.email}</p>
                                {affiliate.website && (
                                  <a href={affiliate.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                                    {affiliate.website}
                                  </a>
                                )}
                              </div>
                              <div className="text-sm font-bold text-muted-foreground">
                                Applied: {new Date(affiliate.applied_at).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4 glass rounded-xl p-4 glass-inner-glow">
                              <div>
                                <p className="font-black uppercase text-xs text-muted-foreground mb-1">Slug</p>
                                <p className="text-sm font-bold font-mono">/{affiliate.slug}</p>
                              </div>
                              <div>
                                <p className="font-black uppercase text-xs text-muted-foreground mb-1">Commission</p>
                                <p className="text-sm font-bold">{affiliate.commission_value}%</p>
                              </div>
                              <div>
                                <p className="font-black uppercase text-xs text-muted-foreground mb-1">Traffic Sources</p>
                                <p className="text-sm font-bold">{affiliate.traffic_sources}</p>
                              </div>
                            </div>

                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-1">Audience Description</p>
                              <p className="text-sm font-bold">{affiliate.audience_description}</p>
                            </div>

                            <div className="border-t border-foreground/10 pt-4">
                              <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                                Rejection Reason (required to reject)
                              </label>
                              <textarea
                                className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={2}
                                placeholder="Enter reason for rejection..."
                                value={rejectionReason[affiliate.id] || ''}
                                onChange={(e) => setRejectionReason((prev) => ({ ...prev, [affiliate.id]: e.target.value }))}
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                onClick={() => handleApprove(affiliate.id)}
                                disabled={actionLoading === affiliate.id}
                                className="flex-1 glass-mint text-foreground font-black uppercase rounded-xl hover:scale-[1.02] transition-all"
                              >
                                {actionLoading === affiliate.id ? 'Processing...' : '✓ Approve'}
                              </Button>
                              <Button
                                onClick={() => handleReject(affiliate.id)}
                                disabled={actionLoading === affiliate.id || !rejectionReason[affiliate.id]}
                                className="flex-1 bg-destructive/90 text-white font-black uppercase rounded-xl hover:scale-[1.02] transition-all"
                              >
                                {actionLoading === affiliate.id ? 'Processing...' : '✗ Reject'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Active Affiliates */}
              {affiliates.filter(a => a.application_status === 'approved').length > 0 && (
                <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-black uppercase">Active Affiliates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {affiliates.filter(a => a.application_status === 'approved').map((affiliate) => (
                        <Card key={affiliate.id} className="glass-mint border border-primary/30 rounded-2xl hover-lift transition-all">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-lg font-black">{affiliate.display_name}</h4>
                                <p className="text-xs font-bold text-muted-foreground">{affiliate.email}</p>
                                <p className="text-xs font-mono text-primary">/{affiliate.slug}</p>
                              </div>
                              {affiliate.stats && (
                                <div className="grid grid-cols-2 gap-3 glass rounded-xl p-3 glass-inner-glow">
                                  <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground">Clicks</p>
                                    <p className="text-lg font-black">{affiliate.stats.total_clicks}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground">Sales</p>
                                    <p className="text-lg font-black">{affiliate.stats.total_conversions}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground">Conv. Rate</p>
                                    <p className="text-lg font-black">{affiliate.stats.conversion_rate}%</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-black uppercase text-muted-foreground">Earned</p>
                                    <p className="text-lg font-black text-primary">${affiliate.stats.total_commissions_earned.toFixed(2)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Stats */}
              {rewardStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="glass-mint border border-primary/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">{rewardStats.total}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Total Rewards</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-yellow border border-secondary/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">{rewardStats.pending}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Pending</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-cyan border border-primary/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">{rewardStats.applied}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Applied</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-purple border border-accent/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">{(rewardStats.total_mb_rewarded / 1024).toFixed(1)} GB</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Total Given</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filter */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="font-black uppercase text-sm text-muted-foreground">Filter:</span>
                <select
                  value={rewardStatusFilter}
                  onChange={(e) => setRewardStatusFilter(e.target.value)}
                  className="glass rounded-xl px-4 py-2 font-bold text-sm border border-foreground/10 focus:outline-none focus:border-primary"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="applied">Applied</option>
                  <option value="void">Voided</option>
                </select>
              </div>

              {/* Rewards List */}
              <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-black uppercase">Referral Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rewards.length === 0 ? (
                      <p className="text-center py-8 font-bold text-muted-foreground">No rewards found</p>
                    ) : (
                      rewards.map((reward) => (
                        <div key={reward.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 glass rounded-xl glass-inner-glow">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm">{reward.referrer_email}</span>
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="font-bold text-sm">{reward.referred_email}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reward.created_at).toLocaleDateString()} • {reward.notes}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-lg text-primary">{reward.reward_value_gb} GB</span>
                            <Badge className={`${getStatusBadge(reward.status)} font-black uppercase text-xs border`}>
                              {reward.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              {/* Stats */}
              {commissionStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="glass-yellow border border-secondary/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">${((commissionStats.pending_amount_cents || 0) / 100).toFixed(2)}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Pending ({commissionStats.pending})</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-mint border border-primary/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">${((commissionStats.approved_amount_cents || 0) / 100).toFixed(2)}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Approved ({commissionStats.approved})</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-cyan border border-primary/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">${((commissionStats.paid_amount_cents || 0) / 100).toFixed(2)}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Paid ({commissionStats.paid})</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-purple border border-accent/30 float-shadow rounded-2xl glass-inner-glow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl sm:text-3xl font-black">{commissionStats.total}</div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Total Commissions</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filter */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="font-black uppercase text-sm text-muted-foreground">Filter:</span>
                <select
                  value={commissionStatusFilter}
                  onChange={(e) => setCommissionStatusFilter(e.target.value)}
                  className="glass rounded-xl px-4 py-2 font-bold text-sm border border-foreground/10 focus:outline-none focus:border-primary"
                >
                  <option value="all">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved (Ready for Payout)</option>
                  <option value="PAID">Paid</option>
                  <option value="VOID">Voided</option>
                </select>
              </div>

              {/* Commissions List */}
              <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-black uppercase">Affiliate Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {commissions.length === 0 ? (
                      <p className="text-center py-8 font-bold text-muted-foreground">No commissions found</p>
                    ) : (
                      commissions.map((commission) => (
                        <div key={commission.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 glass rounded-xl glass-inner-glow">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm">{commission.affiliate_name}</span>
                              <span className="text-xs font-mono text-muted-foreground">/{commission.affiliate_slug}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Customer: {commission.customer_email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString()}
                              {commission.approved_at && ` • Approved: ${new Date(commission.approved_at).toLocaleDateString()}`}
                              {commission.paid_at && ` • Paid: ${new Date(commission.paid_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-lg text-primary">${commission.commission_usd}</span>
                            <Badge className={`${getStatusBadge(commission.status)} font-black uppercase text-xs border`}>
                              {commission.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Discounts Tab */}
          {activeTab === 'discounts' && (
            <AdminDiscountCodes />
          )}

          {/* Manage Data Tab */}
          {activeTab === 'data' && (
            <AdminManageData />
          )}

          {/* Refunds Tab */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              {/* Search Card */}
              <Card className="glass-purple border border-accent/30 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-black uppercase">Issue Refund</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    <div>
                      <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                        Search User by Email
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          placeholder="Enter user email..."
                          value={refundSearch}
                          onChange={(e) => setRefundSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchRefundUser()}
                          className="flex-1 glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          onClick={() => searchRefundUser()}
                          disabled={refundLoading || !refundSearch.trim()}
                          className="glass-mint text-foreground font-black uppercase text-sm rounded-xl px-6 py-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                          {refundLoading ? 'Searching...' : 'Search'}
                        </Button>
                      </div>
                    </div>

                    {/* Result Message */}
                    {refundResult && (
                      <div className={`rounded-xl p-4 ${refundResult.success ? 'glass-mint border border-primary/30' : 'bg-destructive/20 border border-destructive/30'}`}>
                        <p className="font-bold text-sm">{refundResult.message}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Orders */}
              {refundUser && (
                <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <CardTitle className="text-lg font-black uppercase">
                        Orders for {refundUser.email}
                      </CardTitle>
                      <Badge className="glass-mint border border-primary/30 font-black text-xs">
                        {refundOrders.length} paid orders
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {refundOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="font-bold text-muted-foreground">No paid orders found for this user</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {refundOrders.map((order) => (
                          <div key={order.id} className={`p-4 rounded-xl glass-inner-glow ${order.refunded_at ? 'glass-yellow' : 'glass'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-sm">{order.plan?.name || 'Unknown Plan'}</span>
                                  {order.is_topup && (
                                    <Badge className="glass-cyan border border-primary/30 font-black text-xs">TOP-UP</Badge>
                                  )}
                                  <Badge className={`${getStatusBadge(order.status)} font-black uppercase text-xs border`}>
                                    {order.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {order.plan && `${order.plan.data_gb} GB • `}
                                  Paid: {order.paid_at ? new Date(order.paid_at).toLocaleDateString() : 'N/A'}
                                </p>
                                {order.refunded_at && (
                                  <p className="text-xs font-bold text-secondary">
                                    Refunded: {new Date(order.refunded_at).toLocaleDateString()}
                                    {order.refund_reason && ` - ${order.refund_reason}`}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-black text-lg text-primary">
                                  {SUPPORTED_CURRENCIES[order.currency.toUpperCase() as Currency]?.symbol || order.currency}
                                  {order.amount_cents ? (order.amount_cents / 100).toFixed(2) : order.plan?.retail_price.toFixed(2) || '0.00'}
                                </span>
                                {order.refunded_at ? (
                                  <Badge className="glass-yellow border border-secondary/30 font-black text-xs">REFUNDED</Badge>
                                ) : (
                                  <Button
                                    onClick={() => processRefund(order.id)}
                                    disabled={refundProcessing === order.id || !order.stripe_session_id}
                                    className="bg-destructive/90 text-white font-black uppercase text-xs rounded-xl px-4 py-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                                  >
                                    {refundProcessing === order.id ? 'Processing...' : 'Refund'}
                                  </Button>
                                )}
                              </div>
                            </div>
                            {!order.stripe_session_id && !order.refunded_at && (
                              <p className="text-xs text-destructive mt-2">Cannot refund: No Stripe session found</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg font-black uppercase">Refund Instructions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="glass rounded-xl p-4 glass-inner-glow space-y-2">
                    <p className="font-bold text-sm">How to issue a refund:</p>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Search for the user by their email address</li>
                      <li>Review their paid orders and select the one to refund</li>
                      <li>Click the Refund button and confirm the action</li>
                      <li>The refund will be processed through Stripe automatically</li>
                    </ol>
                    <p className="text-xs text-muted-foreground mt-3">
                      Note: Only orders with a valid Stripe session can be refunded. Refunds typically take 5-10 business days to appear in the customer&apos;s account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              {/* Email Type Selection */}
              <Card className="glass-purple border border-primary/30 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-black uppercase">Send Emails</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    {/* Email Type Dropdown */}
                    <div>
                      <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                        Email Type
                      </label>
                      <select
                        value={emailType}
                        onChange={(e) => setEmailType(e.target.value)}
                        className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="welcome">Welcome Email</option>
                        <option value="referral_promo">Referral Promo (Share & Earn)</option>
                        <option value="app_download">App Download</option>
                        <option value="install_reminder">eSIM Install Reminder</option>
                        <option value="activation_reminder">eSIM Activation Reminder</option>
                        <option value="milestone_summary">Milestone Summary (Admin Only)</option>
                        <option value="custom">Custom Email</option>
                      </select>
                    </div>

                    {/* Email Description */}
                    <div className="glass rounded-xl p-4 glass-inner-glow">
                      {emailType === 'welcome' && (
                        <div>
                          <p className="font-bold text-sm">Sends a welcome email introducing Lumbus features.</p>
                          <p className="text-xs text-muted-foreground mt-1">Best for new users or re-engagement.</p>
                        </div>
                      )}
                      {emailType === 'referral_promo' && (
                        <div>
                          <p className="font-bold text-sm">Promotes the referral program with the user&apos;s personal code.</p>
                          <p className="text-xs text-muted-foreground mt-1">Only sends to users with referral codes.</p>
                        </div>
                      )}
                      {emailType === 'app_download' && (
                        <div>
                          <p className="font-bold text-sm">Encourages users to download the mobile app.</p>
                          <p className="text-xs text-muted-foreground mt-1">Good for web-only users.</p>
                        </div>
                      )}
                      {emailType === 'install_reminder' && (
                        <div>
                          <p className="font-bold text-sm">Reminds users to install their purchased eSIM.</p>
                          <p className="text-xs text-muted-foreground mt-1">Includes iOS and Android step-by-step instructions. Targets users with uninstalled eSIMs.</p>
                        </div>
                      )}
                      {emailType === 'activation_reminder' && (
                        <div>
                          <p className="font-bold text-sm">Reminds users to enable Data Roaming for their eSIM.</p>
                          <p className="text-xs text-muted-foreground mt-1">For users who installed but haven&apos;t started using. Critical step reminder.</p>
                        </div>
                      )}
                      {emailType === 'milestone_summary' && (
                        <div>
                          <p className="font-bold text-sm">Sends a business milestone summary email to admins.</p>
                          <p className="text-xs text-muted-foreground mt-1">Shows recent orders and revenue stats.</p>
                        </div>
                      )}
                      {emailType === 'custom' && (
                        <div>
                          <p className="font-bold text-sm">Send a fully customizable email with your own content.</p>
                          <p className="text-xs text-muted-foreground mt-1">Uses the standard Lumbus email template. You can use HTML for formatting.</p>
                        </div>
                      )}
                    </div>

                    {/* Custom Email Fields */}
                    {emailType === 'custom' && (
                      <div className="space-y-4 mt-4 p-4 glass rounded-xl border border-primary/20">
                        <div>
                          <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                            Email Subject <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            placeholder="e.g., Important Update from Lumbus"
                            className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                            Header Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="e.g., We Have News!"
                            className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Appears in the email header next to the Lumbus logo.</p>
                        </div>

                        <div>
                          <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                            Header Subtitle (Optional)
                          </label>
                          <input
                            type="text"
                            value={customSubtitle}
                            onChange={(e) => setCustomSubtitle(e.target.value)}
                            placeholder="e.g., December 2024 Update"
                            className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Optional smaller text below the title.</p>
                        </div>

                        <div>
                          <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                            Email Content (HTML) <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={customContent}
                            onChange={(e) => setCustomContent(e.target.value)}
                            placeholder={`<h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1A1A1A;">Hey there!</h2>

<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #666666;">
  We wanted to share some exciting news with you...
</p>

<div style="margin: 24px 0; padding: 20px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
  <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A; text-align: center;">
    Special Offer Inside!
  </p>
</div>`}
                            rows={12}
                            className="w-full glass rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use HTML for formatting. Colors: Primary #2EFECC (mint), Secondary #FDFD74 (yellow), Accent #87EFFF (cyan).
                          </p>
                        </div>

                        {/* Quick Templates */}
                        <div>
                          <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                            Quick Templates
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setCustomContent(`<h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1A1A1A; text-align: center;">Hey there!</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
  We have some exciting news to share with you...
</p>

<div style="margin: 24px 0; padding: 24px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
  <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-align: center;">What&apos;s New</h3>
  <p style="margin: 0; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;">
    Your exciting content goes here...
  </p>
</div>

<p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
  Questions? We&apos;re here at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
</p>`)}
                              className="glass border border-foreground/20 text-foreground font-bold text-xs rounded-lg px-3 py-2 hover:glass-mint transition-all"
                            >
                              Announcement
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomContent(`<h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1A1A1A; text-align: center;">Special Offer Just For You!</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
  We appreciate you being part of the Lumbus family. Here&apos;s something special...
</p>

<div style="margin: 24px 0; padding: 24px; background-color: #FDFD74; border-radius: 12px; border: 3px solid #1A1A1A; text-align: center;">
  <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: 1px;">Limited Time Offer</p>
  <p style="margin: 0 0 8px; font-size: 32px; font-weight: 900; color: #1A1A1A;">XX% OFF</p>
  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">Use code: YOURCODE</p>
</div>

<table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 24px 0;">
  <tr>
    <td align="center">
      <a href="https://getlumbus.com" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Shop Now
      </a>
    </td>
  </tr>
</table>

<p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
  Offer valid until [DATE]. Terms apply.
</p>`)}
                              className="glass border border-foreground/20 text-foreground font-bold text-xs rounded-lg px-3 py-2 hover:glass-yellow transition-all"
                            >
                              Promo Offer
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomContent(`<h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1A1A1A; text-align: center;">Thank You!</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
  We really appreciate your patience and support. Here&apos;s what we&apos;ve done for you...
</p>

<div style="margin: 24px 0; padding: 24px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
  <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-align: center;">What We&apos;ve Done</h3>
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 12px;">
    <tr>
      <td width="40" style="vertical-align: middle; padding-right: 12px;">
        <div style="width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 50%; text-align: center; line-height: 40px;">
          <span style="font-size: 20px;">&#10003;</span>
        </div>
      </td>
      <td style="vertical-align: middle;">
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A;">Action taken description</p>
      </td>
    </tr>
  </table>
</div>

<p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
  Questions? We&apos;re here at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
</p>`)}
                              className="glass border border-foreground/20 text-foreground font-bold text-xs rounded-lg px-3 py-2 hover:glass-cyan transition-all"
                            >
                              Thank You
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      {emailType === 'milestone_summary' ? (
                        <Button
                          onClick={() => handleSendEmail(false)}
                          disabled={emailSending}
                          className="glass-mint text-foreground font-black uppercase text-sm rounded-xl px-6 py-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                          {emailSending ? 'Sending...' : 'Send Milestone Summary'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleSendEmail(false)}
                            disabled={emailSending || selectedEmails.length === 0}
                            className="glass-mint text-foreground font-black uppercase text-sm rounded-xl px-6 py-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                          >
                            {emailSending ? 'Sending...' : `Send to Selected (${selectedEmails.length})`}
                          </Button>
                          <Button
                            onClick={() => handleSendEmail(true)}
                            disabled={emailSending}
                            className="glass-yellow text-foreground font-black uppercase text-sm rounded-xl px-6 py-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                          >
                            {emailSending ? 'Sending...' : `Send to All Users (${totalUsers})`}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Result */}
                    {emailResult && (
                      <div className={`rounded-xl p-4 ${emailResult.failed > 0 ? 'glass-yellow' : 'glass-mint'} border ${emailResult.failed > 0 ? 'border-secondary/30' : 'border-primary/30'}`}>
                        <p className="font-bold text-sm">
                          Sent: {emailResult.sent} | Failed: {emailResult.failed}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Selection (hidden for milestone summary) */}
              {emailType !== 'milestone_summary' && (
                <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-lg font-black uppercase">
                        Select Recipients
                        {selectedEmails.length > 0 && (
                          <Badge className="ml-2 glass-mint border border-primary/30">{selectedEmails.length} selected</Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          onClick={selectAllEmails}
                          className="glass border border-foreground/20 text-foreground font-black uppercase text-xs rounded-xl px-4 py-2 hover:glass-mint transition-all"
                        >
                          {allVisibleSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {/* Search */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search users by email..."
                        value={emailSearch}
                        onChange={(e) => setEmailSearch(e.target.value)}
                        className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* User List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {emailUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 font-bold">No users found</p>
                      ) : (
                        emailUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => toggleEmailSelection(user.email)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                              selectedEmails.includes(user.email)
                                ? 'glass-mint border border-primary/30'
                                : 'glass border border-foreground/10 hover:border-foreground/30'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              selectedEmails.includes(user.email)
                                ? 'bg-primary border-primary'
                                : 'border-foreground/30'
                            }`}>
                              {selectedEmails.includes(user.email) && (
                                <svg className="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Period Selection */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 1, label: 'Today' },
                    { value: 7, label: '7 Days' },
                    { value: 14, label: '14 Days' },
                    { value: 30, label: '30 Days' },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setAnalyticsPeriod(period.value)}
                      className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                        analyticsPeriod === period.value
                          ? 'glass-dark text-white'
                          : 'glass border border-foreground/10 hover:border-foreground/30'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => loadAnalytics()}
                  disabled={analyticsLoading}
                  className="glass border border-foreground/20 text-foreground font-black uppercase text-xs rounded-xl px-4 py-2 hover:glass-mint transition-all disabled:opacity-50"
                >
                  {analyticsLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading
                    </span>
                  ) : 'Refresh'}
                </Button>
              </div>

              {/* Stats Cards */}
              {(() => {
                // Calculate period totals from daily data
                const periodTotals = analyticsData?.daily
                  ? Object.values(analyticsData.daily).reduce(
                      (acc, day) => ({
                        total: acc.total + day.total,
                        ios: acc.ios + day.ios,
                        android: acc.android + day.android,
                      }),
                      { total: 0, ios: 0, android: 0 }
                    )
                  : { total: 0, ios: 0, android: 0 };

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total */}
                    <Card className="glass border border-foreground/20 float-shadow rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-muted-foreground uppercase">Total Installs</span>
                          <Badge className="glass-mint border border-primary/30 font-black text-xs">
                            {analyticsPeriod === 1 ? 'Today' : `${analyticsPeriod}d`}
                          </Badge>
                        </div>
                        <div className="text-4xl sm:text-5xl font-black">{periodTotals.total}</div>
                      </CardContent>
                    </Card>

                    {/* iOS */}
                    <Card className="glass border border-foreground/20 float-shadow rounded-2xl overflow-hidden">
                      <div className="h-1 bg-[#87EFFF]" />
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <span className="text-sm font-bold text-muted-foreground uppercase">iOS</span>
                          </div>
                          <Badge className="bg-[#87EFFF]/10 text-[#87EFFF] border-[#87EFFF]/30 font-black text-xs">
                            {periodTotals.total > 0 ? Math.round((periodTotals.ios / periodTotals.total) * 100) : 0}%
                          </Badge>
                        </div>
                        <div className="text-4xl sm:text-5xl font-black">{periodTotals.ios}</div>
                      </CardContent>
                    </Card>

                    {/* Android */}
                    <Card className="glass border border-foreground/20 float-shadow rounded-2xl overflow-hidden">
                      <div className="h-1 bg-[#2EFECC]" />
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.44-.59-3.03-.94-4.71-.94-1.68 0-3.27.35-4.71.94L5.21 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L5.96 9.48C2.94 11.07 .86 14.11.86 17.62h22.28c0-3.51-2.08-6.55-5.11-8.14M7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25m10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25"/>
                            </svg>
                            <span className="text-sm font-bold text-muted-foreground uppercase">Android</span>
                          </div>
                          <Badge className="bg-[#2EFECC]/10 text-[#2EFECC] border-[#2EFECC]/30 font-black text-xs">
                            {periodTotals.total > 0 ? Math.round((periodTotals.android / periodTotals.total) * 100) : 0}%
                          </Badge>
                        </div>
                        <div className="text-4xl sm:text-5xl font-black">{periodTotals.android}</div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Daily Breakdown */}
              <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-black uppercase">Daily Breakdown</CardTitle>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#87EFFF]" />
                        <span>iOS</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#2EFECC]" />
                        <span>Android</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="animate-spin h-8 w-8 text-muted-foreground" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : !analyticsData || Object.keys(analyticsData.daily || {}).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-bold text-muted-foreground">No install data yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Data will appear once your mobile app starts sending events
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(analyticsData.daily)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, counts]) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          const maxCount = Math.max(
                            ...Object.values(analyticsData.daily).map(d => d.total),
                            1
                          );
                          const iosWidth = (counts.ios / maxCount) * 100;
                          const androidWidth = (counts.android / maxCount) * 100;

                          return (
                            <div
                              key={date}
                              className={`p-3 rounded-xl transition-all ${
                                isToday ? 'glass-mint border border-primary/30' : 'hover:bg-foreground/5'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm min-w-[100px]">
                                    {isToday ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  {isToday && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-[#87EFFF]">{counts.ios}</span>
                                  <span className="text-xs font-bold text-[#2EFECC]">{counts.android}</span>
                                  <span className="font-black text-sm min-w-[24px] text-right">{counts.total}</span>
                                </div>
                              </div>
                              {/* Split progress bar */}
                              <div className="flex gap-1 h-2">
                                <div
                                  className="bg-[#87EFFF] rounded-l-full transition-all duration-500"
                                  style={{ width: `${iosWidth}%`, minWidth: counts.ios > 0 ? '4px' : '0' }}
                                />
                                <div
                                  className="bg-[#2EFECC] rounded-r-full transition-all duration-500"
                                  style={{ width: `${androidWidth}%`, minWidth: counts.android > 0 ? '4px' : '0' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
