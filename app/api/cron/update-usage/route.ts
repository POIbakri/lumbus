/**
 * Cron Job: Update eSIM usage data
 *
 * This endpoint automatically fetches usage data from eSIM Access API
 * for all activated eSIMs and updates the database.
 *
 * Runs every 3 hours via Vercel Cron
 *
 * GET /api/cron/update-usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { checkEsimUsage } from '@/lib/esimaccess';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow requests from Vercel Cron (has Authorization: Bearer <CRON_SECRET>)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // For local testing, allow if no CRON_SECRET is set
  if (!cronSecret) {
    console.warn('[Usage Cron] No CRON_SECRET set, allowing request (local dev only)');
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Usage Cron] Starting usage update job...');

  try {
    // Get all orders with esim_tran_no (these can have their usage checked)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, esim_tran_no, status, data_remaining_bytes, activated_at')
      .not('esim_tran_no', 'is', null)
      .in('status', ['active', 'completed', 'provisioning', 'depleted']) // Only check active/relevant orders
      .order('last_usage_update', { ascending: true, nullsFirst: true }); // Prioritize orders never updated

    if (error) {
      console.error('[Usage Cron] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      console.log('[Usage Cron] No orders to update');
      return NextResponse.json({
        success: true,
        message: 'No orders to update',
        processed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[Usage Cron] Found ${orders.length} orders with esim_tran_no`);

    // eSIM Access API allows max 10 eSIMs per request
    // Process in batches of 10
    const BATCH_SIZE = 10;
    let totalUpdated = 0;
    let totalErrors = 0;
    const results: any[] = [];

    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);
      const esimTranNos = batch.map(o => o.esim_tran_no).filter(Boolean) as string[];

      console.log(`[Usage Cron] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${esimTranNos.length} eSIMs`);

      try {
        // Fetch usage data from eSIM Access API
        const usageData = await checkEsimUsage(esimTranNos);

        if (!usageData || usageData.length === 0) {
          console.log('[Usage Cron] No usage data returned for batch');
          continue;
        }

        // Update each order with its usage data
        for (const usage of usageData) {
          const order = batch.find(o => o.esim_tran_no === usage.esimTranNo);
          if (!order) continue;

          const dataUsedBytes = usage.dataUsage;
          const totalDataBytes = usage.totalData;
          let dataRemainingBytes = Math.max(0, totalDataBytes - dataUsedBytes);

          // Apply 1MB threshold for depletion
          const DEPLETION_THRESHOLD = 1048576; // 1 MB
          if (dataRemainingBytes < DEPLETION_THRESHOLD && dataRemainingBytes > 0) {
            dataRemainingBytes = 0;
          }

          // Determine correct status
          let newStatus = order.status;
          if (dataRemainingBytes <= 0 && order.status !== 'depleted') {
            newStatus = 'depleted';
            console.log(`[Usage Cron] Order ${order.id} is now depleted`);
          } else if (dataRemainingBytes > 0 && order.status === 'depleted') {
            // Fix incorrectly marked depleted orders (e.g., after top-up)
            newStatus = 'active';
            console.log(`[Usage Cron] Order ${order.id} no longer depleted (may have been topped up)`);
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
            console.error(`[Usage Cron] Failed to update order ${order.id}:`, updateError);
            totalErrors++;
            results.push({
              order_id: order.id,
              esim_tran_no: order.esim_tran_no,
              status: 'error',
              error: updateError.message,
            });
          } else {
            totalUpdated++;
            results.push({
              order_id: order.id,
              esim_tran_no: order.esim_tran_no,
              status: 'updated',
              old_status: order.status,
              new_status: newStatus,
              data_remaining_gb: (dataRemainingBytes / (1024 * 1024 * 1024)).toFixed(3),
              usage_percent: totalDataBytes > 0 ? ((dataUsedBytes / totalDataBytes) * 100).toFixed(1) : '0',
            });
          }
        }
      } catch (batchError: any) {
        console.error(`[Usage Cron] Error processing batch:`, batchError);
        totalErrors += batch.length;
        batch.forEach(order => {
          results.push({
            order_id: order.id,
            esim_tran_no: order.esim_tran_no,
            status: 'error',
            error: batchError.message,
          });
        });
      }

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < orders.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Usage Cron] Job completed in ${duration}ms: ${totalUpdated} updated, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      total_orders: orders.length,
      updated: totalUpdated,
      errors: totalErrors,
      duration_ms: duration,
      results: results.slice(0, 50), // Return first 50 results to avoid huge response
    });
  } catch (error: any) {
    console.error('[Usage Cron] Job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
