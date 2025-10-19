/**
 * Admin API: Debug all orders for filtering
 * GET /api/admin/debug-orders
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        activated_at,
        data_remaining_bytes,
        data_usage_bytes,
        created_at,
        plans(name, data_gb, validity_days, region_code)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No orders found' });
    }

    // Calculate what filter each order would pass
    const debugOrders = orders.map(o => {
      const plan = Array.isArray(o.plans) ? o.plans[0] : o.plans;
      const validityDays = plan?.validity_days || 0;

      // Calculate days remaining
      let daysRemaining = validityDays;
      if (o.activated_at) {
        const activationDate = new Date(o.activated_at);
        const expiry = new Date(activationDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      const isDepleted = o.data_remaining_bytes !== null && o.data_remaining_bytes <= 0;
      const isExpired = daysRemaining <= 0 && o.activated_at !== null;
      const isActiveStatus = o.status === 'completed' || o.status === 'provisioning' || o.status === 'active';

      // Current filter logic
      const wouldShowInActiveSims = isActiveStatus && !isDepleted && !isExpired;
      const wouldShowInOrderHistory = isDepleted; // Past orders: ONLY show truly depleted eSIMs

      return {
        id: o.id,
        status: o.status,
        plan_name: plan?.name?.replace(/^["']|["']$/g, ''),
        activated: !!o.activated_at,
        data_remaining_bytes: o.data_remaining_bytes,
        data_usage_bytes: o.data_usage_bytes,
        days_remaining: daysRemaining,
        isDepleted,
        isExpired,
        isActiveStatus,
        SHOWS_IN_ACTIVE_SIMS: wouldShowInActiveSims,
        SHOWS_IN_ORDER_HISTORY: wouldShowInOrderHistory,
      };
    });

    return NextResponse.json({
      total: orders.length,
      active_sims: debugOrders.filter(o => o.SHOWS_IN_ACTIVE_SIMS).length,
      order_history: debugOrders.filter(o => o.SHOWS_IN_ORDER_HISTORY).length,
      orders: debugOrders,
    });
  } catch (error: any) {
    console.error('Debug orders API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
