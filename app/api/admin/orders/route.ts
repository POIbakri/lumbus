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
      .select('id, status, created_at, stripe_session_id, users(email), plans(name)')
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
      users: { email: string }[];
      plans: { name: string }[];
    }) => ({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      stripe_session_id: order.stripe_session_id,
      user_email: order.users?.[0]?.email,
      plan_name: order.plans?.[0]?.name,
    }));

    return NextResponse.json(formattedOrders || []);
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
