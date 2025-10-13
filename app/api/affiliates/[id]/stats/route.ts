/**
 * Affiliate Statistics API
 * GET /api/affiliates/[id]/stats - Get affiliate performance stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateStats } from '@/lib/referral';

/**
 * GET /api/affiliates/[id]/stats
 * Get comprehensive affiliate statistics
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication check - only admin or the affiliate themselves

    const { id } = await params;

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
