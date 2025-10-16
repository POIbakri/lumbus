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
        users(email),
        plans(name, region_code, data_gb, validity_days, retail_price)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }

    const formattedOrders = orders?.map((order: {
      id: string;
      status: string;
      created_at: string;
      stripe_session_id: string | null;
      data_usage_bytes: number | null;
      data_remaining_bytes: number | null;
      iccid: string | null;
      users: { email: string }[];
      plans: {
        name: string;
        region_code: string;
        data_gb: number;
        validity_days: number;
        retail_price: number;
      }[];
    }) => ({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      stripe_session_id: order.stripe_session_id,
      data_usage_bytes: order.data_usage_bytes,
      data_remaining_bytes: order.data_remaining_bytes,
      iccid: order.iccid,
      user_email: order.users?.[0]?.email,
      plan: order.plans?.[0] || null,
    }));

    return NextResponse.json(formattedOrders || []);
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
