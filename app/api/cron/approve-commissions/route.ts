/**
 * Cron Job: Approve Pending Commissions
 * GET /api/cron/approve-commissions
 *
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron)
 * to automatically approve commissions that are past the lock period.
 *
 * Vercel Cron configuration (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/approve-commissions",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { approvePendingCommissions } from '@/lib/commission';

// Secure the endpoint with a secret token
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-token-here';

export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Approve commissions past 14-day lock period
    const approvedCount = await approvePendingCommissions(14);

    console.log(`Cron: Approved ${approvedCount} commissions`);

    return NextResponse.json({
      success: true,
      approved_count: approvedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
