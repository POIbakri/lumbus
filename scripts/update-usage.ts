/**
 * Script: Update eSIM Usage Data
 *
 * Fetches usage data from eSIM Access API for all activated eSIMs
 * and updates the database.
 *
 * Usage: npx tsx scripts/update-usage.ts
 */

import { config } from 'dotenv';
import { supabase } from '../lib/db';
import { checkEsimUsage } from '../lib/esimaccess';

// Load environment variables
config({ path: '.env.local' });

async function updateUsage() {
  const startTime = Date.now();
  console.log('[Update Usage] Starting...\n');

  try {
    // Get all orders with esim_tran_no
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, esim_tran_no, status, data_remaining_bytes, activated_at')
      .not('esim_tran_no', 'is', null)
      .in('status', ['active', 'completed', 'provisioning', 'depleted'])
      .order('last_usage_update', { ascending: true, nullsFirst: true });

    if (error) {
      console.error('Database error:', error);
      process.exit(1);
    }

    if (!orders || orders.length === 0) {
      console.log('No orders to update');
      return;
    }

    console.log(`Found ${orders.length} orders with esim_tran_no\n`);

    // Process in batches of 10 (eSIM Access API limit)
    const BATCH_SIZE = 10;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);
      const esimTranNos = batch.map(o => o.esim_tran_no).filter(Boolean) as string[];

      console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: Processing ${esimTranNos.length} eSIMs...`);

      try {
        // Fetch usage data from eSIM Access API
        const usageData = await checkEsimUsage(esimTranNos);

        if (!usageData || usageData.length === 0) {
          console.log('  No usage data returned');
          continue;
        }

        // Update each order
        for (const usage of usageData) {
          const order = batch.find(o => o.esim_tran_no === usage.esimTranNo);
          if (!order) continue;

          const dataUsedBytes = usage.dataUsage;
          const totalDataBytes = usage.totalData;
          let dataRemainingBytes = Math.max(0, totalDataBytes - dataUsedBytes);

          // Apply 1MB threshold
          const DEPLETION_THRESHOLD = 1048576; // 1 MB
          if (dataRemainingBytes < DEPLETION_THRESHOLD && dataRemainingBytes > 0) {
            dataRemainingBytes = 0;
          }

          // Determine status
          let newStatus = order.status;
          if (dataRemainingBytes <= 0 && order.status !== 'depleted') {
            newStatus = 'depleted';
          } else if (dataRemainingBytes > 0 && order.status === 'depleted') {
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
            console.error(`  ✗ Failed to update ${order.id}:`, updateError.message);
            totalErrors++;
          } else {
            const usagePercent = totalDataBytes > 0 ? ((dataUsedBytes / totalDataBytes) * 100).toFixed(1) : '0';
            const remainingGB = (dataRemainingBytes / (1024 * 1024 * 1024)).toFixed(3);
            const statusChange = newStatus !== order.status ? ` (${order.status} → ${newStatus})` : '';
            console.log(`  ✓ Updated ${order.id}: ${usagePercent}% used, ${remainingGB} GB remaining${statusChange}`);
            totalUpdated++;
          }
        }
      } catch (batchError: any) {
        console.error(`  ✗ Batch error:`, batchError.message);
        totalErrors += batch.length;
      }

      // Delay between batches
      if (i + BATCH_SIZE < orders.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n=== Summary ===`);
    console.log(`Total orders: ${orders.length}`);
    console.log(`Updated: ${totalUpdated}`);
    console.log(`Errors: ${totalErrors}`);
    console.log(`Duration: ${duration}ms`);
  } catch (error: any) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
updateUsage()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
