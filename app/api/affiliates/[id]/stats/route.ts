/**
 * Affiliate Statistics API
 * GET /api/affiliates/[id]/stats - Get affiliate performance stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateStats } from '@/lib/referral';
import { requireUserAuth } from '@/lib/server-auth';
import { checkAdminAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

/**
 * GET /api/affiliates/[id]/stats
 * Get comprehensive affiliate statistics
 * Accessible by: admin OR the affiliate themselves
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if admin
    const isAdmin = checkAdminAuth(req);

    if (!isAdmin) {
      // If not admin, require user auth and check if they own this affiliate
      const auth = await requireUserAuth(req);
      if (auth.error) {
        return auth.error;
      }

      // Check if the authenticated user is associated with this affiliate
      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select('user_id')
        .eq('id', id)
        .single();

      if (error || !affiliate) {
        return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
      }

      if (affiliate.user_id !== auth.user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view your own affiliate stats' },
          { status: 403 }
        );
      }
    }

    const stats = await getAffiliateStats(id);

    return NextResponse.json({
      affiliate_id: id,
      stats,
    });
  } catch (error) {
    console.error('Get affiliate stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
