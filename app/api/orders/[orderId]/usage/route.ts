/**
 * Real-time Data Usage API
 *
 * GET /api/orders/[orderId]/usage
 *
 * Fetches real-time data usage from eSIM Access API and updates database.
 * Users can refresh their dashboard to see current usage.
 *
 * For test users: Uses cron-populated data from DB, with on-the-fly
 * simulation as fallback if cron hasn't run yet.
 * For real users: Fetches from eSIM Access API
 *
 * Note: eSIM Access updates usage data every 2-3 hours, so "real-time"
 * means latest available data from their system, not instant usage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { checkEsimUsage } from '@/lib/esimaccess';
import { requireUserAuth } from '@/lib/server-auth';
import { simulateTestUserUsage } from '@/lib/test-simulation';

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

    // Get order with usage data
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

    // Check if user is a test user
    const { data: userData } = await supabase
      .from('users')
      .select('is_test_user')
      .eq('id', userId)
      .single();

    const isTestUser = userData?.is_test_user === true;

    // For test users: return DB data if available, otherwise calculate on-the-fly
    // This avoids calling the real eSIM Access API for mock orders
    if (isTestUser) {
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
      const totalDataBytes = (plan?.data_gb || 0) * 1024 * 1024 * 1024;

      // Check if cron job has run by looking at last_usage_update timestamp
      const hasDbData = order.last_usage_update !== null;

      let dataUsedBytes: number;
      let dataRemainingBytes: number;
      let lastUpdate: string;

      if (hasDbData) {
        // Use cron-populated data from DB
        dataUsedBytes = order.data_usage_bytes || 0;
        dataRemainingBytes = order.data_remaining_bytes ?? totalDataBytes;
        lastUpdate = order.last_usage_update || new Date().toISOString();
        console.log('[Usage API] Returning cron-populated data for test user');
      } else {
        // Fallback: calculate on-the-fly simulation (cron hasn't run yet)
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('id, status, created_at, smdp, activation_code, plans(data_gb, validity_days)')
          .eq('id', orderId)
          .single();

        if (fullOrder) {
          const simPlan = Array.isArray(fullOrder.plans) ? fullOrder.plans[0] : fullOrder.plans;
          const simulation = simulateTestUserUsage({
            ...fullOrder,
            plan: simPlan,
          });

          if (simulation) {
            dataUsedBytes = simulation.data_usage_bytes;
            dataRemainingBytes = simulation.data_remaining_bytes;
            lastUpdate = simulation.last_usage_update;
            console.log('[Usage API] Returning on-the-fly simulated data for test user (cron not yet run)');
          } else {
            dataUsedBytes = 0;
            dataRemainingBytes = totalDataBytes;
            lastUpdate = new Date().toISOString();
          }
        } else {
          dataUsedBytes = 0;
          dataRemainingBytes = totalDataBytes;
          lastUpdate = new Date().toISOString();
        }
      }

      const dataUsedGB = dataUsedBytes / (1024 * 1024 * 1024);
      const totalDataGB = totalDataBytes / (1024 * 1024 * 1024);
      const dataRemainingGB = dataRemainingBytes / (1024 * 1024 * 1024);
      const usagePercent = totalDataBytes > 0 ? (dataUsedBytes / totalDataBytes) * 100 : 0;

      return NextResponse.json({
        success: true,
        simulated: true, // Flag to indicate this is test/simulated data
        data_usage_bytes: dataUsedBytes,
        data_remaining_bytes: dataRemainingBytes,
        data_used_gb: parseFloat(dataUsedGB.toFixed(2)),
        data_total_gb: parseFloat(totalDataGB.toFixed(2)),
        data_remaining_gb: parseFloat(dataRemainingGB.toFixed(2)),
        usage_percent: parseFloat(usagePercent.toFixed(1)),
        last_update: lastUpdate,
        updated_at: new Date().toISOString(),
      });
    }

    // For real users: fetch from eSIM Access API

    // Check if order has esim_tran_no (required for usage query)
    if (!order.esim_tran_no) {
      // Return full plan data if eSIM hasn't been provisioned yet
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
      const totalDataBytes = (plan?.data_gb || 0) * 1024 * 1024 * 1024;

      return NextResponse.json(
        {
          error: 'eSIM not yet provisioned',
          data_usage_bytes: 0,
          data_remaining_bytes: totalDataBytes, // Full data available
          last_update: null,
        },
        { status: 200 }
      );
    }

    try {
      // Fetch real-time usage from eSIM Access API
      const usageData = await checkEsimUsage([order.esim_tran_no]);

      if (!usageData || usageData.length === 0) {
        // Return full plan data if no usage data available yet
        const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
        const totalDataBytes = (plan?.data_gb || 0) * 1024 * 1024 * 1024;

        return NextResponse.json(
          {
            error: 'No usage data available yet',
            data_usage_bytes: 0,
            data_remaining_bytes: totalDataBytes, // Full data available
            last_update: null,
          },
          { status: 200 }
        );
      }

      const usage = usageData[0];
      const dataUsedBytes = usage.dataUsage;
      const totalDataBytes = usage.totalData;
      let dataRemainingBytes = Math.max(0, totalDataBytes - dataUsedBytes);

      // Handle edge case: if remaining is less than 1MB (1048576 bytes), consider it depleted
      // Some providers report tiny amounts (like a few KB) even when SIM is depleted
      const DEPLETION_THRESHOLD = 1048576; // 1 MB in bytes
      if (dataRemainingBytes < DEPLETION_THRESHOLD && dataRemainingBytes > 0) {
        console.log('[Usage API] Data remaining below threshold, setting to 0:', {
          dataRemainingBytes,
          threshold: DEPLETION_THRESHOLD
        });
        dataRemainingBytes = 0;
      }

      console.log('[Usage API] Raw data from eSIM Access:', {
        esimTranNo: order.esim_tran_no,
        dataUsedBytes,
        totalDataBytes,
        dataRemainingBytes,
        usagePercent: totalDataBytes > 0 ? ((dataUsedBytes / totalDataBytes) * 100).toFixed(2) + '%' : '0%',
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
      // If no cached data, return full plan data
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
      const totalDataBytes = (plan?.data_gb || 0) * 1024 * 1024 * 1024;

      const cachedData = {
        data_usage_bytes: order.data_usage_bytes || 0,
        data_remaining_bytes: order.data_remaining_bytes !== null && order.data_remaining_bytes !== undefined
          ? order.data_remaining_bytes
          : totalDataBytes, // Use full plan data if no cache
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
