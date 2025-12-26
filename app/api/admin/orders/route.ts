import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'all', 'active', 'completed', 'failed'
    const includeTestUsers = searchParams.get('includeTestUsers') === 'true';

    let query = supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        paid_at,
        stripe_session_id,
        payment_method,
        amount_cents,
        currency,
        data_usage_bytes,
        data_remaining_bytes,
        total_bytes,
        iccid,
        is_topup,
        topup_source,
        plan_id,
        user_id,
        users!orders_user_id_fkey(email, is_test_user),
        plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days, retail_price, currency)
      `)
      .order('created_at', { ascending: false });

    // Filter by status - only show orders where payment went through
    if (status === 'active') {
      query = query.eq('status', 'active');
    } else if (status === 'completed') {
      query = query.eq('status', 'completed');
    } else if (status === 'failed') {
      query = query.eq('status', 'failed');
    } else {
      // Default: show only paid orders (active, completed, paid)
      query = query.in('status', ['paid', 'active', 'completed']);
    }

    // Filter out test users by default
    if (!includeTestUsers) {
      query = query.eq('users.is_test_user', false);
    }

    query = query.limit(100);

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }

    // Filter out orders from test users (since Supabase join filter may not work perfectly)
    const filteredOrders = includeTestUsers
      ? orders
      : orders?.filter((order: any) => !order.users?.is_test_user);

    const formattedOrders = filteredOrders?.map((order: any) => ({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      stripe_session_id: order.stripe_session_id,
      payment_method: order.payment_method,
      amount_cents: order.amount_cents,
      currency: order.currency || 'USD',
      data_usage_bytes: order.data_usage_bytes,
      data_remaining_bytes: order.data_remaining_bytes,
      total_bytes: order.total_bytes,
      iccid: order.iccid,
      is_topup: order.is_topup || false,
      topup_source: order.topup_source,
      user_email: order.users?.email || 'N/A',
      is_test_user: order.users?.is_test_user || false,
      plan: order.plans ? {
        name: order.plans.name,
        region_code: order.plans.region_code,
        data_gb: order.plans.data_gb,
        validity_days: order.plans.validity_days,
        retail_price: order.plans.retail_price,
        currency: order.plans.currency || 'USD',
      } : null,
    }));

    return NextResponse.json(formattedOrders || []);
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
