#!/usr/bin/env node

/**
 * Find all failed orders where customer paid but didn't receive eSIM
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkFailedOrders() {
  console.log('\n💰 Checking for Failed Paid Orders');
  console.log('=' .repeat(60));

  // Find orders that are paid but failed
  const { data: failedOrders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      paid_at,
      amount_cents,
      connect_order_id,
      users!inner(email),
      plans!inner(name, retail_price)
    `)
    .in('status', ['failed', 'provisioning'])
    .not('paid_at', 'is', null)
    .is('activation_code', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching orders:', error);
    return;
  }

  if (!failedOrders || failedOrders.length === 0) {
    console.log('✅ No failed paid orders found');
    return;
  }

  console.log(`\n🚨 Found ${failedOrders.length} failed/stuck paid orders!\n`);

  let totalRevenueLost = 0;
  const affectedCustomers = new Set();

  failedOrders.forEach((order, index) => {
    const user = Array.isArray(order.users) ? order.users[0] : order.users;
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

    const amount = order.amount_cents ? order.amount_cents / 100 : plan?.retail_price || 0;
    totalRevenueLost += amount;
    affectedCustomers.add(user?.email);

    console.log(`${index + 1}. Order: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Customer: ${user?.email}`);
    console.log(`   Plan: ${plan?.name}`);
    console.log(`   Amount: $${amount.toFixed(2)}`);
    console.log(`   Paid: ${new Date(order.paid_at).toLocaleString()}`);
    console.log(`   eSIM Requested: ${order.connect_order_id ? '✅' : '❌'}`);
    console.log('');
  });

  console.log('=' .repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`   Total Orders Affected: ${failedOrders.length}`);
  console.log(`   Unique Customers: ${affectedCustomers.size}`);
  console.log(`   Total Revenue at Risk: $${totalRevenueLost.toFixed(2)}`);

  console.log('\n🔧 TO FIX:');
  console.log('1. Add funds to eSIM Access account');
  console.log('2. Run for each order:');
  console.log('   node -r dotenv/config -r tsx/cjs scripts/recover-failed-order.ts <orderId> dotenv_config_path=.env.local');

  // Save order IDs to file for batch processing
  const orderIds = failedOrders.map(o => o.id);
  console.log('\n📝 Order IDs for batch recovery:');
  orderIds.forEach(id => console.log(id));
}

checkFailedOrders().catch(console.error);