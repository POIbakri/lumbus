/**
 * Admin API: Check for depleted orders diagnostic
 * GET /api/admin/check-depleted
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // Get all orders with their plan data
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        activated_at,
        esim_tran_no,
        iccid,
        data_usage_bytes,
        data_remaining_bytes,
        last_usage_update,
        created_at,
        plans(data_gb, name, region_code)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No orders found' });
    }

    // Issue 1: Activated orders with NULL data_remaining_bytes
    const activatedWithoutUsageData = orders.filter(o =>
      o.activated_at !== null &&
      o.data_remaining_bytes === null
    );

    // Issue 2: Orders with esim_tran_no but no usage data
    const withEsimTranNoButNoUsage = orders.filter(o =>
      o.esim_tran_no !== null &&
      o.data_remaining_bytes === null
    );

    // Issue 3: Orders marked as depleted in status
    const statusDepleted = orders.filter(o => o.status === 'depleted');

    // Issue 4: Orders with data_remaining_bytes = 0 (truly depleted)
    const trulyDepleted = orders.filter(o =>
      o.data_remaining_bytes !== null &&
      o.data_remaining_bytes <= 0
    );

    return NextResponse.json({
      summary: {
        total_orders: orders.length,
        activated_without_usage_data: activatedWithoutUsageData.length,
        with_esim_tran_no_but_no_usage: withEsimTranNoButNoUsage.length,
        status_depleted: statusDepleted.length,
        truly_depleted: trulyDepleted.length,
      },
      issues: {
        activated_without_usage_data: activatedWithoutUsageData.map(o => ({
          id: o.id,
          status: o.status,
          plan: Array.isArray(o.plans) ? o.plans[0] : o.plans,
          activated_at: o.activated_at,
          has_esim_tran_no: !!o.esim_tran_no,
          esim_tran_no: o.esim_tran_no,
          last_usage_update: o.last_usage_update,
        })),
        with_esim_tran_no_but_no_usage: withEsimTranNoButNoUsage.map(o => ({
          id: o.id,
          status: o.status,
          plan: Array.isArray(o.plans) ? o.plans[0] : o.plans,
          esim_tran_no: o.esim_tran_no,
          activated_at: o.activated_at,
        })),
        status_depleted: statusDepleted.map(o => ({
          id: o.id,
          plan: Array.isArray(o.plans) ? o.plans[0] : o.plans,
          data_remaining_bytes: o.data_remaining_bytes,
          last_usage_update: o.last_usage_update,
        })),
        truly_depleted: trulyDepleted.map(o => ({
          id: o.id,
          status: o.status,
          plan: Array.isArray(o.plans) ? o.plans[0] : o.plans,
          data_remaining_bytes: o.data_remaining_bytes,
          data_usage_bytes: o.data_usage_bytes,
          last_usage_update: o.last_usage_update,
        })),
      },
    });
  } catch (error) {
    console.error('Check depleted API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
