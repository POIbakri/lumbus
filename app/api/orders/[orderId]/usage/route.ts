/**
 * Real-time Data Usage API
 *
 * GET /api/orders/[orderId]/usage
 *
 * Fetches real-time data usage from eSIM Access API and updates database.
 * Users can refresh their dashboard to see current usage.
 *
 * Note: eSIM Access updates usage data every 2-3 hours, so "real-time"
 * means latest available data from their system, not instant usage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { checkEsimUsage } from '@/lib/esimaccess';
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

    // Get order with esim_tran_no
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, esim_tran_no, iccid, plan_id, data_usage_bytes, data_remaining_bytes, last_usage_update, plans(data_gb)')
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

    // Check if order has esim_tran_no (required for usage query)
    if (!order.esim_tran_no) {
      return NextResponse.json(
        {
          error: 'eSIM not yet provisioned',
          data_usage_bytes: 0,
          data_remaining_bytes: 0,
          last_update: null,
        },
        { status: 200 }
      );
    }

    try {
      // Fetch real-time usage from eSIM Access API
      const usageData = await checkEsimUsage([order.esim_tran_no]);

      if (!usageData || usageData.length === 0) {
        return NextResponse.json(
          {
            error: 'No usage data available',
            data_usage_bytes: 0,
            data_remaining_bytes: 0,
            last_update: null,
          },
          { status: 200 }
        );
      }

      const usage = usageData[0];
      const dataUsedBytes = usage.dataUsage;
      const totalDataBytes = usage.totalData;
      const dataRemainingBytes = Math.max(0, totalDataBytes - dataUsedBytes);

      console.log('[Usage API] Raw data from eSIM Access:', {
        esimTranNo: order.esim_tran_no,
        dataUsedBytes,
        totalDataBytes,
        dataRemainingBytes,
        lastUpdateTime: usage.lastUpdateTime
      });

      // Update order with latest usage data
      await supabase
        .from('orders')
        .update({
          data_usage_bytes: dataUsedBytes,
          data_remaining_bytes: dataRemainingBytes,
          last_usage_update: usage.lastUpdateTime,
        })
        .eq('id', orderId);

      console.log('[Usage API] Database updated successfully for order:', orderId);

      // Calculate percentage and GB values for response
      const dataUsedGB = dataUsedBytes / (1024 * 1024 * 1024);
      const totalDataGB = totalDataBytes / (1024 * 1024 * 1024);
      const dataRemainingGB = dataRemainingBytes / (1024 * 1024 * 1024);
      const usagePercent = totalDataBytes > 0 ? (dataUsedBytes / totalDataBytes) * 100 : 0;

      return NextResponse.json({
        success: true,
        data_usage_bytes: dataUsedBytes,
        data_remaining_bytes: dataRemainingBytes,
        data_used_gb: parseFloat(dataUsedGB.toFixed(2)),
        data_total_gb: parseFloat(totalDataGB.toFixed(2)),
        data_remaining_gb: parseFloat(dataRemainingGB.toFixed(2)),
        usage_percent: parseFloat(usagePercent.toFixed(1)),
        last_update: usage.lastUpdateTime,
        updated_at: new Date().toISOString(),
      });
    } catch (esimError) {
      console.error('Failed to fetch eSIM usage from eSIM Access:', esimError);

      // Return cached data from database if API call fails
      const cachedData = {
        data_usage_bytes: order.data_usage_bytes || 0,
        data_remaining_bytes: order.data_remaining_bytes || 0,
        last_update: order.last_usage_update || null,
      };

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch real-time data. Showing cached data.',
        ...cachedData,
      });
    }
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
