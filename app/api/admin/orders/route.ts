import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        stripe_session_id,
        data_usage_bytes,
        data_remaining_bytes,
        iccid,
        plan_id,
        user_id,
        users!orders_user_id_fkey(email),
        plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days, retail_price, currency)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }

    const formattedOrders = orders?.map((order: any) => ({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      stripe_session_id: order.stripe_session_id,
      data_usage_bytes: order.data_usage_bytes,
      data_remaining_bytes: order.data_remaining_bytes,
      iccid: order.iccid,
      user_email: order.users?.email || 'N/A',
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
