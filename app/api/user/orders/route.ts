/**
 * User Orders API
 * GET /api/user/orders - Get all orders for the authenticated user
 *
 * Returns all orders with plan details joined for the logged-in user.
 * Used by mobile app dashboard to display user's eSIM orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  try {
    console.log('[User Orders API] Request received');

    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      console.log('[User Orders API] Authentication failed');
      return auth.error;
    }

    const userId = auth.user.id;
    console.log('[User Orders API] Fetching orders for user:', userId);

    // Fetch all orders for the user with plan details joined
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        smdp,
        activation_code,
        iccid,
        data_usage_bytes,
        data_remaining_bytes,
        last_usage_update,
        stripe_session_id,
        amount_cents,
        currency,
        created_at,
        updated_at,
        plans!orders_plan_id_fkey (
          id,
          name,
          region_code,
          data_gb,
          validity_days,
          retail_price,
          currency
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[User Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[User Orders API] Successfully fetched ${orders?.length || 0} orders`);

    // Format the response to ensure plans is always an object
    const formattedOrders = orders?.map((order: any) => ({
      ...order,
      plan: Array.isArray(order.plans) ? order.plans[0] : order.plans,
      plans: undefined, // Remove the plans array
    })) || [];

    return NextResponse.json({
      orders: formattedOrders,
      count: formattedOrders.length,
    });

  } catch (error) {
    console.error('[User Orders API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
