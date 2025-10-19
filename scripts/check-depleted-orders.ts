/**
 * Diagnostic Script: Check for depleted orders that might not be showing in Order History
 *
 * This script checks for:
 * 1. Orders with activated_at set but data_remaining_bytes is NULL
 * 2. Orders that might be depleted but not marked as such
 * 3. Orders with esim_tran_no but no usage data
 */

import { config } from 'dotenv';
import { supabase } from '../lib/db';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkDepletedOrders() {
  console.log('=== Checking for potentially depleted orders ===\n');

  // Get all orders with their plan data
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      activated_at,
      esim_tran_no,
      iccid,
      data_usage_bytes,
      data_remaining_bytes,
      last_usage_update,
      created_at,
      plans(data_gb, name, region_code)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('No orders found.');
    return;
  }

  console.log(`Total orders: ${orders.length}\n`);

  // Issue 1: Activated orders with NULL data_remaining_bytes
  const activatedWithoutUsageData = orders.filter(o =>
    o.activated_at !== null &&
    o.data_remaining_bytes === null
  );

  console.log(`\n=== ISSUE 1: Activated orders with NULL data_remaining_bytes ===`);
  console.log(`Found ${activatedWithoutUsageData.length} orders\n`);

  activatedWithoutUsageData.forEach(order => {
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    console.log(`Order ID: ${order.id}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Plan: ${plan?.name || 'Unknown'} (${plan?.data_gb || 0} GB)`);
    console.log(`  Activated: ${order.activated_at}`);
    console.log(`  Has esim_tran_no: ${!!order.esim_tran_no}`);
    console.log(`  data_remaining_bytes: NULL`);
    console.log(`  last_usage_update: ${order.last_usage_update || 'NULL'}`);
    console.log('  ⚠️  PROBLEM: Cannot determine if depleted because usage was never fetched\n');
  });

  // Issue 2: Orders with esim_tran_no but no usage data
  const withEsimTranNoButNoUsage = orders.filter(o =>
    o.esim_tran_no !== null &&
    o.data_remaining_bytes === null
  );

  console.log(`\n=== ISSUE 2: Orders with esim_tran_no but no usage data ===`);
  console.log(`Found ${withEsimTranNoButNoUsage.length} orders\n`);

  withEsimTranNoButNoUsage.forEach(order => {
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    console.log(`Order ID: ${order.id}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Plan: ${plan?.name || 'Unknown'}`);
    console.log(`  esim_tran_no: ${order.esim_tran_no}`);
    console.log(`  Activated: ${order.activated_at || 'Not activated'}`);
    console.log(`  ⚠️  Can query usage from eSIM Access API\n`);
  });

  // Issue 3: Orders marked as depleted in status
  const statusDepleted = orders.filter(o => o.status === 'depleted');
  console.log(`\n=== Orders with status='depleted' ===`);
  console.log(`Found ${statusDepleted.length} orders\n`);

  statusDepleted.forEach(order => {
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    console.log(`Order ID: ${order.id}`);
    console.log(`  Plan: ${plan?.name || 'Unknown'}`);
    console.log(`  data_remaining_bytes: ${order.data_remaining_bytes}`);
    console.log(`  last_usage_update: ${order.last_usage_update || 'NULL'}\n`);
  });

  // Issue 4: Orders with data_remaining_bytes = 0 (truly depleted)
  const trulyDepleted = orders.filter(o =>
    o.data_remaining_bytes !== null &&
    o.data_remaining_bytes <= 0
  );

  console.log(`\n=== Orders with data_remaining_bytes <= 0 (Truly Depleted) ===`);
  console.log(`Found ${trulyDepleted.length} orders\n`);

  trulyDepleted.forEach(order => {
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    console.log(`Order ID: ${order.id}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Plan: ${plan?.name || 'Unknown'}`);
    console.log(`  data_remaining_bytes: ${order.data_remaining_bytes}`);
    console.log(`  data_usage_bytes: ${order.data_usage_bytes}`);
    console.log(`  last_usage_update: ${order.last_usage_update || 'NULL'}`);
    console.log(`  ✅ Should appear in Order History\n`);
  });

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total orders: ${orders.length}`);
  console.log(`Activated without usage data: ${activatedWithoutUsageData.length}`);
  console.log(`With esim_tran_no but no usage: ${withEsimTranNoButNoUsage.length}`);
  console.log(`Status = 'depleted': ${statusDepleted.length}`);
  console.log(`Truly depleted (data_remaining_bytes <= 0): ${trulyDepleted.length}`);

  console.log('\n=== RECOMMENDATIONS ===');
  if (activatedWithoutUsageData.length > 0) {
    console.log('⚠️  1. Fetch usage data for activated orders with esim_tran_no');
    console.log('   - Create a cron job to periodically check usage for all activated eSIMs');
  }
  if (withEsimTranNoButNoUsage.length > 0) {
    console.log('⚠️  2. Some orders have esim_tran_no but usage was never fetched');
    console.log('   - Run usage check API for these orders');
  }
}

// Run the check
checkDepletedOrders()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
