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
  application_status?: string;
  rejection_reason?: string | null;
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
      // Error handled silently
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
        // Error handled silently
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

  // Handle different application states
  // If no affiliate record or affiliate exists but not active
  if (!affiliate || !affiliate.is_active) {
    // Pending Application
    if (affiliate?.application_status === 'pending') {
      return (
        <div className="min-h-screen bg-white">
          <Nav />
          <div className="pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
              <Card className="bg-yellow border-4 border-secondary shadow-xl">
                <CardContent className="pt-6 text-center py-8 sm:py-12 px-4">
                  <div className="flex justify-center mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4">APPLICATION UNDER REVIEW</h2>
                  <p className="text-base sm:text-lg font-bold text-muted-foreground mb-4">
                    Thank you for applying to the Lumbus Affiliate Program!
                  </p>
                  <p className="text-base font-bold text-muted-foreground mb-6 max-w-2xl mx-auto">
                    We're currently reviewing your application. You'll receive an email notification once your application has been approved or if we need additional information. This typically takes 1-2 business days.
                  </p>
                  <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md mx-auto">
                    <p className="font-black uppercase text-xs text-muted-foreground mb-2">Your Application Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-muted-foreground">Name:</span>
                        <span className="text-sm font-black">{affiliate.display_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-muted-foreground">Status:</span>
                        <span className="text-sm font-black text-secondary uppercase">Pending Review</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground mt-6">
                    Questions? Email us at <a href="mailto:partners@lumbus.com" className="text-primary underline">partners@lumbus.com</a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // Rejected Application
    if (affiliate?.application_status === 'rejected') {
      return (
        <div className="min-h-screen bg-white">
          <Nav />
          <div className="pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
              <Card className="bg-destructive/10 border-4 border-destructive shadow-xl">
                <CardContent className="pt-6 text-center py-8 sm:py-12 px-4">
                  <div className="text-5xl sm:text-6xl mb-4">✗</div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4">APPLICATION NOT APPROVED</h2>
                  <p className="text-base sm:text-lg font-bold text-muted-foreground mb-4">
                    Unfortunately, we were unable to approve your affiliate application at this time.
                  </p>
                  {affiliate.rejection_reason && (
                    <div className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl mx-auto mb-6">
                      <p className="font-black uppercase text-xs text-muted-foreground mb-2">Reason</p>
                      <p className="text-sm font-bold text-foreground">{affiliate.rejection_reason}</p>
                    </div>
                  )}
                  <p className="text-base font-bold text-muted-foreground mb-6 max-w-2xl mx-auto">
                    If you believe this decision was made in error or if you'd like to discuss your application, please don't hesitate to contact our partnerships team.
                  </p>
                  <Button
                    onClick={() => window.location.href = 'mailto:partners@lumbus.com?subject=Affiliate Application Follow-up'}
                    className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                  >
                    CONTACT PARTNERSHIPS TEAM
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // Not Applied Yet
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-purple border-4 border-accent shadow-xl">
              <CardContent className="pt-6 text-center py-8 sm:py-12 px-4">
                <div className="text-5xl sm:text-6xl mb-4">🚀</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-4">NOT AN AFFILIATE YET</h2>
                <p className="text-base sm:text-lg font-bold text-muted-foreground mb-4">
                  You haven't applied to our affiliate program yet.
                </p>
                <p className="text-base font-bold text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join our affiliate program and earn 12% commission on every sale you refer. Get your unique tracking link, real-time analytics, and monthly payouts!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/affiliate-program')}
                    className="w-full sm:w-auto btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                  >
                    APPLY NOW
                  </Button>
                  <Button
                    onClick={() => router.push('/affiliate-program')}
                    className="w-full sm:w-auto btn-lumbus bg-white text-foreground border-2 border-foreground hover:bg-foreground/5 font-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                  >
                    LEARN MORE
                  </Button>
                </div>
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
