/**
 * Admin API: Fix usage data by fetching from eSIM Access
 * GET /api/admin/fix-usage
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { checkEsimUsage } from '@/lib/esimaccess';

export async function GET() {
  try {
    const results: any[] = [];

    // Get all orders with esim_tran_no but missing or outdated usage data
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        esim_tran_no,
        activated_at,
        data_remaining_bytes,
        last_usage_update,
        plans(name, data_gb)
      `)
      .not('esim_tran_no', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No orders with esim_tran_no found' });
    }

    console.log(`[Fix Usage] Found ${orders.length} orders with esim_tran_no`);

    // Process each order
    for (const order of orders) {
      try {
        console.log(`\n[Fix Usage] Checking order ${order.id} (esim_tran_no: ${order.esim_tran_no})`);

        // Fetch usage from eSIM Access API
        const usageData = await checkEsimUsage([order.esim_tran_no]);

        if (!usageData || usageData.length === 0) {
          console.log(`[Fix Usage] No usage data available for ${order.esim_tran_no}`);
          results.push({
            order_id: order.id,
            esim_tran_no: order.esim_tran_no,
            status: 'no_usage_data',
            message: 'eSIM Access returned no usage data',
          });
          continue;
        }

        const usage = usageData[0];
        const dataUsedBytes = usage.dataUsage;
        const totalDataBytes = usage.totalData;
        let dataRemainingBytes = Math.max(0, totalDataBytes - dataUsedBytes);

        // Apply 1MB threshold
        const DEPLETION_THRESHOLD = 1048576; // 1 MB
        if (dataRemainingBytes < DEPLETION_THRESHOLD && dataRemainingBytes > 0) {
          console.log(`[Fix Usage] Data remaining (${dataRemainingBytes}) below threshold, setting to 0`);
          dataRemainingBytes = 0;
        }

        console.log(`[Fix Usage] Usage data:`, {
          dataUsedBytes,
          totalDataBytes,
          dataRemainingBytes,
          usagePercent: totalDataBytes > 0 ? ((dataUsedBytes / totalDataBytes) * 100).toFixed(2) + '%' : '0%',
        });

        // Determine correct status
        let newStatus = order.status;
        if (dataRemainingBytes <= 0) {
          newStatus = 'depleted';
        } else if (order.status === 'depleted' && dataRemainingBytes > 0) {
          // Fix incorrectly marked depleted orders
          newStatus = 'active';
        }

        // Update database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            data_usage_bytes: dataUsedBytes,
            data_remaining_bytes: dataRemainingBytes,
            last_usage_update: usage.lastUpdateTime,
            status: newStatus,
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[Fix Usage] Failed to update order ${order.id}:`, updateError);
          results.push({
            order_id: order.id,
            esim_tran_no: order.esim_tran_no,
            status: 'error',
            error: updateError.message,
          });
        } else {
          console.log(`[Fix Usage] ✅ Updated order ${order.id}`);
          results.push({
            order_id: order.id,
            esim_tran_no: order.esim_tran_no,
            status: 'updated',
            old_status: order.status,
            new_status: newStatus,
            old_remaining: order.data_remaining_bytes,
            new_remaining: dataRemainingBytes,
            data_used_gb: (dataUsedBytes / (1024 * 1024 * 1024)).toFixed(3),
            data_total_gb: (totalDataBytes / (1024 * 1024 * 1024)).toFixed(3),
            data_remaining_gb: (dataRemainingBytes / (1024 * 1024 * 1024)).toFixed(3),
            usage_percent: totalDataBytes > 0 ? ((dataUsedBytes / totalDataBytes) * 100).toFixed(1) : '0',
            last_update: usage.lastUpdateTime,
          });
        }
      } catch (orderError: any) {
        console.error(`[Fix Usage] Error processing order ${order.id}:`, orderError);
        results.push({
          order_id: order.id,
          esim_tran_no: order.esim_tran_no,
          status: 'error',
          error: orderError.message,
        });
      }
    }

    return NextResponse.json({
      total_orders: orders.length,
      results,
      summary: {
        updated: results.filter(r => r.status === 'updated').length,
        errors: results.filter(r => r.status === 'error').length,
        no_usage_data: results.filter(r => r.status === 'no_usage_data').length,
      },
    });
  } catch (error: any) {
    console.error('Fix usage API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
