'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Nav } from '@/components/nav';
import { getCountryInfo } from '@/lib/countries';
import { AdminDiscountCodes } from '@/components/admin-discount-codes';

// Format data amounts to clean values
function formatDataAmount(dataGB: number): string {
  if (dataGB >= 1) {
    return `${dataGB} GB`;
  }

  const dataMB = dataGB * 1024;

  // Round to nearest sensible value
  if (dataMB <= 110) return '100 MB';
  if (dataMB <= 250) return '200 MB';
  if (dataMB <= 550) return '500 MB';

  // For other values, round to nearest 50MB
  return `${Math.round(dataMB / 50) * 50} MB`;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  user_email: string;
  stripe_session_id: string | null;
  data_usage_bytes: number | null;
  data_remaining_bytes: number | null;
  iccid: string | null;
  plan: {
    name: string;
    region_code: string;
    data_gb: number;
    validity_days: number;
    retail_price: number;
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

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([loadOrders(), loadAffiliates()]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.status === 401) {
        // Browser will prompt for basic auth
        setError('Authentication required');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    }
  };

  const loadAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates');
      if (response.status === 401) {
        setError('Authentication required');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load affiliates');
      }
      const data = await response.json();
      setAffiliates(data);
    } catch (err) {
      setError('Failed to load affiliates');
    }
  };

  const handleApprove = async (affiliateId: string) => {
    setActionLoading(affiliateId);
    try {
      const response = await fetch(`/api/affiliates/${affiliateId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to approve affiliate');
      }
      // Reload affiliates
      await loadAffiliates();
    } catch (err) {
      alert('Failed to approve affiliate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (affiliateId: string) => {
    const reason = rejectionReason[affiliateId];
    if (!reason || !confirm('Are you sure you want to reject this affiliate application?')) {
      return;
    }

    setActionLoading(affiliateId);
    try {
      const response = await fetch(`/api/affiliates/${affiliateId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        throw new Error('Failed to reject affiliate');
      }
      // Reload affiliates
      await loadAffiliates();
      // Clear rejection reason
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

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

  const formatDataUsage = (usedBytes: number | null, totalGB: number) => {
    if (!usedBytes && usedBytes !== 0) return null;
    const usedGB = usedBytes / (1024 * 1024 * 1024);
    const remainingGB = totalGB - usedGB;
    return {
      used: usedGB.toFixed(2),
      remaining: Math.max(0, remainingGB).toFixed(2),
      percentage: Math.min(100, (usedGB / totalGB) * 100).toFixed(0),
    };
  };

  const getDaysRemaining = (createdAt: string, validityDays: number) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const remaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const totalRevenue = orders.reduce((sum, order) => {
    if (order.status === 'completed' && order.plan) {
      return sum + order.plan.retail_price;
    }
    return sum;
  }, 0);

  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-2 sm:mb-4">LUMBUS ADMIN</h1>
            <p className="text-base sm:text-lg font-bold text-muted-foreground">Manage orders and view analytics</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-mint border-2 sm:border-4 border-primary shadow-xl">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="text-4xl sm:text-5xl font-black text-foreground mb-1 sm:mb-2">{orders.length}</div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Total Orders</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow border-2 sm:border-4 border-secondary shadow-xl">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="text-4xl sm:text-5xl font-black text-foreground mb-1 sm:mb-2">{completedOrders}</div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-cyan border-2 sm:border-4 border-primary shadow-xl">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="text-4xl sm:text-5xl font-black text-foreground mb-1 sm:mb-2">${totalRevenue.toFixed(0)}</div>
                <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">Revenue (USD)</div>
              </CardContent>
            </Card>
          </div>

          {/* Discount Codes Section */}
          <div className="mb-6 sm:mb-8">
            <AdminDiscountCodes />
          </div>

          {/* Affiliates Section */}
          {affiliates.length > 0 && (
            <Card className="border-2 sm:border-4 border-secondary shadow-xl mb-6 sm:mb-8">
              <CardHeader className="bg-yellow p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-black uppercase">
                  Affiliates Management ({affiliates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {/* Pending Applications */}
                {affiliates.filter(a => a.application_status === 'pending').length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-black uppercase mb-4 text-purple">
                      Pending Applications ({affiliates.filter(a => a.application_status === 'pending').length})
                    </h3>
                    <div className="space-y-4">
                      {affiliates.filter(a => a.application_status === 'pending').map((affiliate) => (
                    <Card key={affiliate.id} className="border-2 border-foreground/10">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-xl sm:text-2xl font-black mb-1">{affiliate.display_name}</h3>
                              <p className="text-sm font-bold text-muted-foreground">{affiliate.email}</p>
                              {affiliate.website && (
                                <a
                                  href={affiliate.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-bold text-primary hover:underline"
                                >
                                  🔗 {affiliate.website}
                                </a>
                              )}
                            </div>
                            <div className="text-sm font-bold text-muted-foreground">
                              Applied: {new Date(affiliate.applied_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Application Details */}
                          <div className="grid sm:grid-cols-3 gap-4 bg-foreground/5 p-4 rounded-lg">
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Slug</p>
                              <p className="text-sm font-bold break-all">{affiliate.slug}</p>
                            </div>
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Commission</p>
                              <p className="text-sm font-bold">{affiliate.commission_value}%</p>
                            </div>
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Status</p>
                              <Badge className="bg-purple text-white font-black uppercase text-xs">
                                {affiliate.application_status}
                              </Badge>
                            </div>
                          </div>

                          {/* Audience & Marketing Info */}
                          <div className="space-y-3">
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-1">Audience Description</p>
                              <p className="text-sm font-bold">{affiliate.audience_description}</p>
                            </div>
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-1">Traffic Sources</p>
                              <p className="text-sm font-bold">{affiliate.traffic_sources}</p>
                            </div>
                            <div>
                              <p className="font-black uppercase text-xs text-muted-foreground mb-1">Promotional Methods</p>
                              <p className="text-sm font-bold">{affiliate.promotional_methods}</p>
                            </div>
                          </div>

                          {/* Rejection Reason Input */}
                          <div className="border-t border-foreground/10 pt-4">
                            <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                              Rejection Reason (required to reject)
                            </label>
                            <textarea
                              className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none"
                              rows={2}
                              placeholder="Enter reason for rejection..."
                              value={rejectionReason[affiliate.id] || ''}
                              onChange={(e) =>
                                setRejectionReason((prev) => ({
                                  ...prev,
                                  [affiliate.id]: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={() => handleApprove(affiliate.id)}
                              disabled={actionLoading === affiliate.id}
                              className="flex-1 bg-primary text-foreground hover:bg-primary/90 font-black uppercase"
                            >
                              {actionLoading === affiliate.id ? 'Processing...' : '✓ Approve'}
                            </Button>
                            <Button
                              onClick={() => handleReject(affiliate.id)}
                              disabled={actionLoading === affiliate.id || !rejectionReason[affiliate.id]}
                              className="flex-1 bg-destructive text-white hover:bg-destructive/90 font-black uppercase"
                            >
                              {actionLoading === affiliate.id ? 'Processing...' : '✗ Reject'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                    </div>
                  </div>
                )}

                {/* Approved Affiliates */}
                {affiliates.filter(a => a.application_status === 'approved').length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-black uppercase mb-4 text-primary">
                      Active Affiliates ({affiliates.filter(a => a.application_status === 'approved').length})
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {affiliates.filter(a => a.application_status === 'approved').map((affiliate) => (
                        <Card key={affiliate.id} className="border-2 border-primary/20">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-lg font-black mb-1">{affiliate.display_name}</h4>
                                <p className="text-xs font-bold text-muted-foreground">{affiliate.email}</p>
                                <p className="text-xs font-mono text-primary">/{affiliate.slug}</p>
                              </div>

                              {affiliate.stats && (
                                <div className="grid grid-cols-2 gap-3 bg-primary/5 p-3 rounded-lg">
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
                                    <p className="text-xs font-black uppercase text-muted-foreground">Commission</p>
                                    <p className="text-lg font-black">{affiliate.commission_value}%</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs font-black uppercase text-muted-foreground">Earned</p>
                                    <p className="text-xl font-black text-primary">${affiliate.stats.total_commissions_earned.toFixed(2)}</p>
                                    {affiliate.stats.pending_commissions > 0 && (
                                      <p className="text-xs font-bold text-muted-foreground">
                                        +${affiliate.stats.pending_commissions.toFixed(2)} pending
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="text-xs font-bold text-muted-foreground">
                                Joined: {new Date(affiliate.applied_at).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejected Affiliates */}
                {affiliates.filter(a => a.application_status === 'rejected').length > 0 && (
                  <div>
                    <h3 className="text-lg font-black uppercase mb-4 text-destructive">
                      Rejected Applications ({affiliates.filter(a => a.application_status === 'rejected').length})
                    </h3>
                    <div className="space-y-3">
                      {affiliates.filter(a => a.application_status === 'rejected').map((affiliate) => (
                        <Card key={affiliate.id} className="border border-destructive/20 bg-destructive/5">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-base font-black mb-1">{affiliate.display_name}</h4>
                                <p className="text-xs font-bold text-muted-foreground">{affiliate.email}</p>
                              </div>
                              <Badge className="bg-destructive text-white font-black uppercase text-xs">
                                Rejected
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Applied: {new Date(affiliate.applied_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-2 sm:border-4 border-primary shadow-xl">
            <CardHeader className="bg-mint p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-black uppercase">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {orders.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📦</div>
                  <p className="font-black text-lg sm:text-xl">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {orders.map((order) => {
                    const countryInfo = order.plan ? getCountryInfo(order.plan.region_code) : null;
                    const dataUsage = order.plan ? formatDataUsage(order.data_usage_bytes, order.plan.data_gb) : null;
                    const daysRemaining = order.plan ? getDaysRemaining(order.created_at, order.plan.validity_days) : 0;

                    return (
                      <Card
                        key={order.id}
                        className="border border-foreground/10 hover:border-primary  "
                      >
                        <CardContent className="p-3 sm:p-4">
                          {/* Mobile: Stack all content vertically */}
                          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                            {/* Order Info */}
                            <div className="pb-3 sm:pb-0 border-b sm:border-b-0 border-foreground/10">
                              <div className="flex items-center gap-2 mb-2">
                                {countryInfo && <span className="text-2xl sm:text-3xl">{countryInfo.flag}</span>}
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-xs sm:text-sm truncate">{order.plan?.name || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{countryInfo?.name}</p>
                                </div>
                              </div>
                              <p className="text-xs font-bold text-muted-foreground truncate">{order.user_email}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()} • {order.id.substring(0, 8)}
                              </p>
                            </div>

                            {/* Plan Details */}
                            <div className="pb-3 sm:pb-0 border-b sm:border-b-0 border-foreground/10">
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Plan Details</p>
                              <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 sm:gap-1 sm:space-y-1">
                                <p className="text-xs sm:text-sm font-bold">💾 {formatDataAmount(order.plan?.data_gb || 0)}</p>
                                <p className="text-xs sm:text-sm font-bold">⏰ {order.plan?.validity_days}d</p>
                                <p className="text-xs sm:text-sm font-bold">💰 ${order.plan?.retail_price}</p>
                              </div>
                            </div>

                            {/* Usage */}
                            <div className="pb-3 sm:pb-0 border-b sm:border-b-0 border-foreground/10">
                              <p className="font-black uppercase text-xs text-muted-foreground mb-2">Usage</p>
                              {dataUsage ? (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span>Used: {dataUsage.used} GB</span>
                                    <span>{dataUsage.percentage}%</span>
                                  </div>
                                  <div className="w-full bg-foreground/10 rounded-full h-2">
                                    <div
                                      className="bg-primary h-full rounded-full "
                                      style={{ width: `${dataUsage.percentage}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs font-bold text-primary">Left: {dataUsage.remaining} GB</p>
                                  <p className="text-xs font-bold">📅 {daysRemaining} days</p>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No usage data</p>
                              )}
                            </div>

                            {/* Status */}
                            <div className="flex flex-col justify-between">
                              <div>
                                <p className="font-black uppercase text-xs text-muted-foreground mb-2">Status</p>
                                <Badge className={`${getStatusColor(order.status)} font-black uppercase text-xs`}>
                                  {order.status}
                                </Badge>
                              </div>
                              {order.iccid && (
                                <p className="text-xs font-mono mt-2 bg-foreground/5 p-2 rounded truncate">
                                  {order.iccid.substring(0, 15)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
