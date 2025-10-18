import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Get all affiliates
    const { data: affiliates, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Failed to load affiliates:', error);
      return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 });
    }

    // For each affiliate, fetch stats separately
    const affiliatesWithStats = await Promise.all(
      (affiliates || []).map(async (affiliate: any) => {
        // Get click count
        const { count: clickCount } = await supabase
          .from('affiliate_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliate.id);

        // Get conversions count
        const { count: conversionCount } = await supabase
          .from('order_attributions')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliate.id);

        // Get commissions
        const { data: commissions } = await supabase
          .from('affiliate_commissions')
          .select('amount_cents, status')
          .eq('affiliate_id', affiliate.id);

        const totalCommissionsEarned = (commissions || [])
          .filter((c: any) => c.status === 'APPROVED')
          .reduce((sum: number, c: any) => sum + (c.amount_cents / 100), 0);

        const pendingCommissions = (commissions || [])
          .filter((c: any) => c.status === 'PENDING')
          .reduce((sum: number, c: any) => sum + (c.amount_cents / 100), 0);

        const totalClicks = clickCount || 0;
        const totalConversions = conversionCount || 0;

        return {
          ...affiliate,
          stats: {
            total_clicks: totalClicks,
            total_conversions: totalConversions,
            total_commissions_earned: totalCommissionsEarned,
            pending_commissions: pendingCommissions,
            conversion_rate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00',
          },
        };
      })
    );

    return NextResponse.json(affiliatesWithStats);
  } catch (error) {
    console.error('Admin affiliates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
