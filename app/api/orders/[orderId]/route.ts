import { NextRequest, NextResponse } from 'next/server';
import { supabase, type Plan } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { verifyOrderAccessToken } from '@/lib/order-token';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    // Try to get authenticated user first
    const auth = await requireUserAuth(req);
    let userId = auth.error ? null : auth.user.id;

    // If no authenticated user, require valid token
    if (!userId) {
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized - Authentication or valid token required' }, { status: 401 });
      }

      const tokenPayload = verifyOrderAccessToken(token);
      if (!tokenPayload) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      // Verify token is for this specific order
      if (tokenPayload.orderId !== orderId) {
        return NextResponse.json({ error: 'Token does not match order' }, { status: 403 });
      }

      userId = tokenPayload.userId;
      console.log('[Order API] Access granted via secure token for order:', orderId);
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        qr_url,
        smdp,
        activation_code,
        created_at,
        connect_order_id,
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

    // Verify ownership - userId is now from either auth or token
    if (order.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Order does not belong to this user' }, { status: 403 });
    }

    // **NEW: If order is provisioning, try to fetch activation details from eSIM Access**
    if (order.status === 'provisioning' && order.connect_order_id) {
      try {
        console.log('[Order API] Order is provisioning, polling eSIM Access for activation details...');
        const { getOrderStatus } = await import('@/lib/esimaccess');
        const orderDetails = await getOrderStatus(order.connect_order_id);

        if (orderDetails?.esimList && orderDetails.esimList.length > 0) {
          const firstProfile = orderDetails.esimList[0];

          // Extract SMDP and activation code from LPA string
          const lpaString = firstProfile.ac;
          const parts = lpaString.split('$');
          const smdpAddress = parts.length >= 2 ? parts[1] : '';
          const activationCode = parts.length >= 3 ? parts[2] : '';

          if (smdpAddress && activationCode) {
            console.log('[Order API] Got activation details! Updating order...');

            // Update order in database
            await supabase
              .from('orders')
              .update({
                status: 'completed',
                iccid: firstProfile.iccid,
                esim_tran_no: firstProfile.esimTranNo,
                smdp: smdpAddress,
                activation_code: activationCode,
                qr_url: firstProfile.qrCodeUrl || firstProfile.shortUrl || null,
              })
              .eq('id', orderId);

            // Update the order object for response
            order.status = 'completed';
            order.smdp = smdpAddress;
            order.activation_code = activationCode;

            console.log('[Order API] Order updated to completed with activation details');
          }
        }
      } catch (pollError) {
        console.error('[Order API] Error polling eSIM Access:', pollError);
        // Continue with original order data if polling fails
      }
    }

    // For test users: Mark order as "activated" when they view install page with activation details
    // This simulates the user installing the eSIM so dashboard shows "Active & Using"
    if (order.smdp && order.activation_code) {
      // Check if user is a test user
      const { data: userData } = await supabase
        .from('users')
        .select('is_test_user')
        .eq('id', userId)
        .single();

      if (userData?.is_test_user === true) {
        // Check if order already has activated_at set
        const { data: orderCheck } = await supabase
          .from('orders')
          .select('activated_at')
          .eq('id', orderId)
          .single();

        // If not yet activated, set activated_at to now (simulates user installing the eSIM)
        if (orderCheck && !orderCheck.activated_at) {
          console.log('[Order API] Test user viewing install page - marking order as activated');
          await supabase
            .from('orders')
            .update({ activated_at: new Date().toISOString() })
            .eq('id', orderId);
        }
      }
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
