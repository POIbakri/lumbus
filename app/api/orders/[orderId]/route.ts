import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, qr_url, smdp, activation_code, created_at, plans(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Sanitize response (never expose internal IDs, secrets, or full URLs)
    const plan: any = order.plans;
    return NextResponse.json({
      id: order.id,
      status: order.status,
      hasActivationDetails: !!(order.smdp && order.activation_code),
      smdp: order.smdp,
      activationCode: order.activation_code,
      plan: {
        name: plan?.name,
        region: plan?.region_code,
        dataGb: plan?.data_gb,
        validityDays: plan?.validity_days,
      },
      createdAt: order.created_at,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
