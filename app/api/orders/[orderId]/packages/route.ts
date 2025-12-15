/**
 * Available Top-Up Packages API
 *
 * GET /api/orders/[orderId]/packages
 *
 * Returns available top-up packages from local Supabase plans table.
 * Filters by the same region as the original order's plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
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

    // Get order with plan details including region
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, esim_tran_no, iccid, plan_id, plans(id, name, region_code, supplier_sku)')
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

    // Check if order has esim_tran_no or iccid (eSIM must be provisioned)
    if (!order.esim_tran_no && !order.iccid) {
      return NextResponse.json(
        { error: 'eSIM not yet provisioned. Cannot query top-up packages.' },
        { status: 400 }
      );
    }

    // Get the region from the original plan (handle array or single object)
    const originalPlan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    const regionCode = (originalPlan as any)?.region_code;

    if (!regionCode) {
      return NextResponse.json(
        { error: 'Could not determine region for this order' },
        { status: 400 }
      );
    }

    // Query local plans for the same region
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, name, region_code, data_gb, validity_days, supplier_sku, retail_price, currency')
      .eq('region_code', regionCode)
      .eq('is_active', true)
      .order('data_gb', { ascending: true });

    if (plansError) {
      console.error('[Packages API] Failed to fetch plans:', plansError);
      return NextResponse.json(
        { error: 'Failed to fetch available packages' },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const packages = (plans || []).map(plan => ({
      id: plan.id,
      packageCode: plan.supplier_sku,
      name: plan.name,
      data: `${plan.data_gb}GB`,
      dataGb: plan.data_gb,
      validity: `${plan.validity_days} Days`,
      validityDays: plan.validity_days,
      price: plan.retail_price,
      currency: plan.currency || 'USD',
      locationCode: plan.region_code,
    }));

    console.log('[Packages API] Found', packages.length, 'packages for region:', regionCode);

    return NextResponse.json({
      success: true,
      packages,
      region: regionCode,
    });
  } catch (error) {
    console.error('Packages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
