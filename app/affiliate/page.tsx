'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface AffiliateData {
  id: string;
  display_name: string;
  slug: string;
  commission_type: string;
  commission_value: number;
  is_active: boolean;
}

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  epc: number;
}

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadAffiliateData = useCallback(async () => {
    try {
      if (!session?.access_token || !user?.id) {
        setLoading(false);
        return;
      }

      // Get affiliate data for current user
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`/api/affiliates?user_id=${user.id}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.affiliates && data.affiliates.length > 0) {
          const affiliateData = data.affiliates[0];
          setAffiliate(affiliateData);

          // Load stats
          const statsResponse = await fetch(`/api/affiliates/${affiliateData.id}/stats`, {
            headers,
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData.stats);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user, loadAffiliateData]);

  const copyAffiliateLink = async () => {
    if (affiliate) {
      const link = `${window.location.origin}/a/${affiliate.slug}`;
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block  rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground font-bold">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-purple border-2 border-accent shadow-lg">
              <CardContent className="pt-6 text-center py-8 sm:py-12 px-4">
                <div className="text-5xl sm:text-6xl mb-4">🚀</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4">NOT AN AFFILIATE YET</h2>
                <p className="text-base sm:text-lg font-bold text-muted-foreground mb-6">
                  You're not registered as an affiliate partner. Contact support to join our affiliate program!
                </p>
                <Button
                  onClick={() => router.push('/support')}
                  className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                >
                  CONTACT SUPPORT
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const affiliateLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/a/${affiliate.slug}`;
  const conversionRate = stats && stats.totalClicks > 0 ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 sm:mb-12 ">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 leading-tight">AFFILIATE DASHBOARD</h1>
            <p className="text-base sm:text-lg font-bold text-muted-foreground">
              Welcome back, {affiliate.display_name}
            </p>
          </div>

          {/* Affiliate Link */}
          <div className="mb-8 sm:mb-12 " style={{animationDelay: '0.1s'}}>
            <Card className="bg-purple border-4 border-accent shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">YOUR AFFILIATE LINK</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-xl p-3 sm:p-4 mb-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-mint rounded-lg font-mono text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {affiliateLink}
                    </div>
                    <Button
                      onClick={copyAffiliateLink}
                      className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-4 sm:px-6 "
                    >
                      {copied ? '✓ COPIED' : 'COPY'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-white rounded-xl">
                    <p className="font-bold uppercase text-xs text-muted-foreground mb-1">Your Slug</p>
                    <p className="font-black text-base sm:text-lg">{affiliate.slug}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white rounded-xl">
                    <p className="font-bold uppercase text-xs text-muted-foreground mb-1">Commission Rate</p>
                    <p className="font-black text-base sm:text-lg">
                      {affiliate.commission_type === 'PERCENT'
                        ? `${affiliate.commission_value}%`
                        : `$${affiliate.commission_value.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 " style={{animationDelay: '0.2s'}}>
              <Card className="bg-mint border-4 border-primary shadow-xl ">
                <CardContent className="pt-6">
                  <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
                    {stats.totalClicks}
                  </div>
                  <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                    Total Clicks
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow border-4 border-secondary shadow-xl ">
                <CardContent className="pt-6">
                  <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
                    {stats.totalConversions}
                  </div>
                  <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                    Conversions
                  </div>
                  <div className="text-xs font-bold text-muted-foreground mt-2">
                    {conversionRate}% conversion rate
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan border-4 border-primary shadow-xl ">
                <CardContent className="pt-6">
                  <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
                    ${(stats.epc / 100).toFixed(2)}
                  </div>
                  <div className="font-black uppercase text-xs sm:text-sm text-muted-foreground">
                    EPC (Earnings Per Click)
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Commission Breakdown */}
          {stats && (
            <div className="" style={{animationDelay: '0.3s'}}>
              <Card className="bg-white border-2 border-foreground/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">EARNINGS BREAKDOWN</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="p-4 sm:p-6 bg-mint rounded-xl">
                      <p className="font-black uppercase text-xs text-muted-foreground mb-2">
                        Pending
                      </p>
                      <p className="text-3xl sm:text-4xl font-black text-primary">
                        ${(stats.pendingCommissions / 100).toFixed(2)}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground mt-2">
                        Subject to 14-day refund window
                      </p>
                    </div>

                    <div className="p-4 sm:p-6 bg-yellow rounded-xl">
                      <p className="font-black uppercase text-xs text-muted-foreground mb-2">
                        Approved
                      </p>
                      <p className="text-3xl sm:text-4xl font-black text-primary">
                        ${(stats.approvedCommissions / 100).toFixed(2)}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground mt-2">
                        Ready for payout
                      </p>
                    </div>

                    <div className="p-4 sm:p-6 bg-cyan rounded-xl">
                      <p className="font-black uppercase text-xs text-muted-foreground mb-2">
                        Paid
                      </p>
                      <p className="text-3xl sm:text-4xl font-black">
                        ${(stats.paidCommissions / 100).toFixed(2)}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground mt-2">
                        Lifetime earnings
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-purple rounded-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-black uppercase text-xs sm:text-sm text-muted-foreground mb-1">
                          Total Revenue Generated
                        </p>
                        <p className="text-4xl sm:text-5xl font-black">
                          ${(stats.totalRevenue / 100).toFixed(2)}
                        </p>
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
