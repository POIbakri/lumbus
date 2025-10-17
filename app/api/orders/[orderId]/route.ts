import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Plan } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        qr_url,
        smdp,
        activation_code,
        created_at,
        plans (
          name,
          region_code,
          data_gb,
          validity_days
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Sanitize response (never expose internal IDs, secrets, or full URLs)
    // Supabase returns plans as an object or array depending on relationship type
    const plan = (Array.isArray(order.plans) ? order.plans[0] : order.plans) as Plan | null;

    console.log('[Order API] Order:', order.id, 'Plan data:', plan);

    // Extract region from plan name (e.g., "Japan 5GB - 30 Days" -> "Japan")
    const extractRegionFromName = (name: string): string => {
      // Remove quotes if present
      const cleanName = name.replace(/^["']|["']$/g, '');
      const match = cleanName.match(/^([^0-9]+?)\s+\d+/);
      return match ? match[1].trim() : cleanName.split(' ')[0];
    };

    // Remove quotes from plan name if present
    const cleanPlanName = (name: string): string => {
      return name.replace(/^["']|["']$/g, '');
    };

    return NextResponse.json({
      id: order.id,
      status: order.status,
      hasActivationDetails: !!(order.smdp && order.activation_code),
      smdp: order.smdp,
      activationCode: order.activation_code,
      plan: {
        name: plan?.name ? cleanPlanName(plan.name) : 'Unknown Plan',
        region: plan?.name ? extractRegionFromName(plan.name) : 'Unknown Region',
        dataGb: plan?.data_gb || 0,
        validityDays: plan?.validity_days || 0,
      },
      createdAt: order.created_at,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
