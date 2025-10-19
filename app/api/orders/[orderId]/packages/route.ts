/**
 * Available Top-Up Packages API
 *
 * GET /api/orders/[orderId]/packages
 *
 * Fetches available top-up packages from eSIM Access API for a specific order.
 * This ensures packages are compatible with the user's existing eSIM.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getTopUpPackages } from '@/lib/esimaccess';
import { requireUserAuth } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;
    const { orderId } = await params;

    // Get order with esim_tran_no and iccid
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, esim_tran_no, iccid, plan_id, plans(supplier_sku)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the order belongs to the authenticated user
    if (order.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if order has esim_tran_no or iccid
    if (!order.esim_tran_no && !order.iccid) {
      return NextResponse.json(
        { error: 'eSIM not yet provisioned. Cannot query top-up packages.' },
        { status: 400 }
      );
    }

    try {
      // Query available top-up packages from eSIM Access API
      const packages = await getTopUpPackages({
        esimTranNo: order.esim_tran_no || undefined,
        iccid: order.esim_tran_no ? undefined : order.iccid || undefined,
      });

      console.log('[Packages API] Found', packages.length, 'compatible packages for order:', orderId);

      return NextResponse.json({
        success: true,
        packages,
      });
    } catch (esimError) {
      console.error('Failed to fetch packages from eSIM Access:', esimError);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch available packages from eSIM Access API',
          packages: [],
        },
        { status: 200 } // Return 200 with empty packages rather than error
      );
    }
  } catch (error) {
    console.error('Packages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
