/**
 * Cron Job: Expire orders based on validity period
 *
 * This endpoint automatically marks orders as 'expired' when their
 * validity period has elapsed after activation.
 *
 * Runs every hour via Vercel Cron
 *
 * GET /api/cron/expire-orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow requests from Vercel Cron (has Authorization: Bearer <CRON_SECRET>)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // For local testing, allow if no CRON_SECRET is set
  if (!cronSecret) {
    console.warn('[Expire Cron] No CRON_SECRET set, allowing request (local dev only)');
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Expire Cron] Starting order expiration job...');

  try {
    // Get all activated orders that are not already expired, depleted, cancelled, revoked, or failed
    // We need to check: active, completed, provisioning (edge case where order was provisioned but never activated)
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        activated_at,
        plan_id,
        plans!inner(validity_days)
      `)
      .not('activated_at', 'is', null) // Only check orders that have been activated
      .in('status', ['active', 'completed', 'provisioning'])
      .order('activated_at', { ascending: true });

    if (error) {
      console.error('[Expire Cron] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      console.log('[Expire Cron] No activated orders to check');
      return NextResponse.json({
        success: true,
        message: 'No activated orders to check',
        expired: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[Expire Cron] Found ${orders.length} activated orders to check`);

    let totalExpired = 0;
    const expiredOrders: any[] = [];
    const now = new Date();

    // Check each order for expiration
    for (const order of orders) {
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

      if (!plan || !plan.validity_days || !order.activated_at) {
        continue;
      }

      // Calculate expiration date
      const activationDate = new Date(order.activated_at);
      const expirationDate = new Date(
        activationDate.getTime() + plan.validity_days * 24 * 60 * 60 * 1000
      );

      // Check if order has expired
      if (now > expirationDate) {
        // Update order status to expired
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[Expire Cron] Failed to expire order ${order.id}:`, updateError);
        } else {
          totalExpired++;
          const daysExpired = Math.floor(
            (now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          expiredOrders.push({
            order_id: order.id,
            old_status: order.status,
            new_status: 'expired',
            activated_at: order.activated_at,
            expired_at: expirationDate.toISOString(),
            days_since_expiry: daysExpired,
          });

          console.log(
            `[Expire Cron] Expired order ${order.id} (activated: ${order.activated_at}, expired: ${expirationDate.toISOString()})`
          );
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Expire Cron] Job completed in ${duration}ms: ${totalExpired} orders expired`);

    return NextResponse.json({
      success: true,
      total_checked: orders.length,
      expired: totalExpired,
      duration_ms: duration,
      expired_orders: expiredOrders,
    });
  } catch (error: any) {
    console.error('[Expire Cron] Job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
