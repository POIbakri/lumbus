#!/usr/bin/env node

/**
 * Webhook Health Check Script
 * Run with: npx tsx scripts/check-webhook-health.ts
 *
 * This script checks:
 * 1. Recent webhook deliveries from eSIM Access
 * 2. Failed webhooks or missing events
 * 3. Orders waiting for webhooks
 * 4. Webhook configuration status
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) console.error('   - SUPABASE_SERVICE_KEY');
  console.error('\nMake sure .env.local exists with these variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🔍 Webhook Health Check');
  console.log('=' .repeat(60));

  // 1. Check recent webhook events
  console.log('\n📨 Recent eSIM Access Webhooks (last 24 hours):');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: webhooks, error: webhookError } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('provider', 'esimaccess')
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(10);

  if (webhookError) {
    console.error('❌ Failed to fetch webhooks:', webhookError.message);
  } else if (!webhooks || webhooks.length === 0) {
    console.log('   ⚠️ No webhooks received in the last 24 hours');
  } else {
    const eventCounts: Record<string, number> = {};
    webhooks.forEach(w => {
      eventCounts[w.event_type] = (eventCounts[w.event_type] || 0) + 1;
    });

    Object.entries(eventCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} events`);
    });

    const lastWebhook = webhooks[0];
    console.log(`   Last webhook: ${new Date(lastWebhook.created_at).toLocaleString()}`);
  }

  // 2. Check orders in provisioning status
  console.log('\n⏳ Orders Stuck in Provisioning:');
  const { data: provisioningOrders, error: provOrderError } = await supabase
    .from('orders')
    .select('id, created_at, connect_order_id')
    .eq('status', 'provisioning')
    .order('created_at', { ascending: false });

  if (provOrderError) {
    console.error('❌ Failed to fetch provisioning orders:', provOrderError.message);
  } else if (!provisioningOrders || provisioningOrders.length === 0) {
    console.log('   ✅ No orders stuck in provisioning');
  } else {
    console.log(`   ⚠️ ${provisioningOrders.length} orders waiting for activation`);

    // Show oldest stuck order
    const oldest = provisioningOrders[provisioningOrders.length - 1];
    const ageMinutes = Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / 1000 / 60);
    console.log(`   Oldest: ${oldest.id} (${ageMinutes} minutes ago)`);

    if (ageMinutes > 30) {
      console.log('   ❗ Some orders have been waiting over 30 minutes!');
    }
  }

  // 3. Check webhook idempotency records
  console.log('\n🔐 Webhook Idempotency Check:');
  const { data: idempotency, error: idempError } = await supabase
    .from('webhook_idempotency')
    .select('webhook_type, created_at')
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(10);

  if (idempError) {
    console.error('❌ Failed to fetch idempotency records:', idempError.message);
  } else if (!idempotency || idempotency.length === 0) {
    console.log('   ⚠️ No webhook idempotency records in last 24 hours');
  } else {
    const typeCounts: Record<string, number> = {};
    idempotency.forEach(i => {
      typeCounts[i.webhook_type] = (typeCounts[i.webhook_type] || 0) + 1;
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} processed`);
    });
  }

  // 4. Check for orders with payment but no activation
  console.log('\n💳 Paid Orders Without Activation:');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: paidNoActivation, error: paidError } = await supabase
    .from('orders')
    .select('id, created_at, status, paid_at')
    .in('status', ['paid', 'provisioning'])
    .is('activation_code', null)
    .lte('paid_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (paidError) {
    console.error('❌ Failed to fetch paid orders:', paidError.message);
  } else if (!paidNoActivation || paidNoActivation.length === 0) {
    console.log('   ✅ All recent paid orders have activation details');
  } else {
    console.log(`   ⚠️ ${paidNoActivation.length} orders paid but not activated (> 1 hour old)`);
    paidNoActivation.slice(0, 3).forEach(order => {
      const age = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000 / 60);
      console.log(`      ${order.id} - Status: ${order.status} (${age} min old)`);
    });
  }

  // 5. Webhook configuration recommendations
  console.log('\n💡 Recommendations:');
  console.log('=' .repeat(60));

  // Check if webhook URL is configured in eSIM Access
  console.log('1. Ensure webhook URL is configured in eSIM Access dashboard:');
  console.log(`   ${process.env.NEXT_PUBLIC_APP_URL}/api/esimaccess/webhook`);

  // Check IP whitelist status
  const ipWhitelistEnabled = process.env.ESIMACCESS_ENABLE_IP_WHITELIST === 'true';
  console.log(`\n2. IP Whitelist: ${ipWhitelistEnabled ? 'ENABLED' : 'DISABLED'}`);
  if (ipWhitelistEnabled) {
    console.log('   Allowed IPs:');
    console.log('   - 3.1.131.226');
    console.log('   - 54.254.74.88');
    console.log('   - 18.136.190.97');
    console.log('   - 18.136.60.197');
    console.log('   - 18.136.19.137');
  }

  // Check for stuck orders
  if (provisioningOrders && provisioningOrders.length > 0) {
    console.log('\n3. ⚠️ Action Required:');
    console.log('   Run: npx tsx scripts/fix-stuck-orders.ts');
    console.log('   to attempt recovery of stuck orders');
  }

  // Check webhook delivery
  if (!webhooks || webhooks.length === 0) {
    console.log('\n4. ❗ No webhooks received - Check:');
    console.log('   - Webhook URL is correctly configured in eSIM Access');
    console.log('   - Your server is accessible from the internet');
    console.log('   - No firewall blocking webhook IPs');
    console.log('   - SSL certificate is valid');
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Health check complete');
}

// Run the script
main().catch(console.error);