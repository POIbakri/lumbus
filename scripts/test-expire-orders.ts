/**
 * Test script for order expiration logic
 *
 * This script simulates what the cron job does:
 * 1. Finds all activated orders with active/completed/provisioning status
 * 2. Calculates if they've passed their expiration date
 * 3. Reports which orders would be expired (DRY RUN by default)
 *
 * Usage:
 *   npx tsx scripts/test-expire-orders.ts          # Dry run
 *   npx tsx scripts/test-expire-orders.ts --apply  # Actually expire orders
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabase } from '../lib/db';

const DRY_RUN = !process.argv.includes('--apply');

async function testExpireOrders() {
  console.log('🔍 Testing order expiration logic...\n');
  console.log(DRY_RUN ? '📋 DRY RUN MODE (no changes will be made)\n' : '⚠️  APPLY MODE (orders will be expired)\n');

  try {
    // Get all activated orders that are not already expired, depleted, cancelled, revoked, or failed
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        activated_at,
        plan_id,
        created_at,
        plans!inner(name, validity_days)
      `)
      .not('activated_at', 'is', null)
      .in('status', ['active', 'completed', 'provisioning'])
      .order('activated_at', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!orders || orders.length === 0) {
      console.log('✅ No activated orders to check');
      return;
    }

    console.log(`📊 Found ${orders.length} activated orders to check\n`);

    const now = new Date();
    let expiredCount = 0;
    let notExpiredCount = 0;

    // Check each order
    for (const order of orders) {
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

      if (!plan || !plan.validity_days || !order.activated_at) {
        console.log(`⚠️  Skipping order ${order.id}: missing plan or activation data`);
        continue;
      }

      // Calculate expiration date
      const activationDate = new Date(order.activated_at);
      const expirationDate = new Date(
        activationDate.getTime() + plan.validity_days * 24 * 60 * 60 * 1000
      );

      const isExpired = now > expirationDate;

      if (isExpired) {
        expiredCount++;
        const daysExpired = Math.floor(
          (now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        console.log(`🔴 EXPIRED: ${order.id}`);
        console.log(`   Plan: ${plan.name}`);
        console.log(`   Status: ${order.status} → expired`);
        console.log(`   Activated: ${activationDate.toISOString()}`);
        console.log(`   Expired: ${expirationDate.toISOString()}`);
        console.log(`   Days since expiry: ${daysExpired}`);
        console.log(`   Validity period: ${plan.validity_days} days\n`);

        // Actually expire the order if not in dry run mode
        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'expired' })
            .eq('id', order.id);

          if (updateError) {
            console.error(`   ❌ Failed to expire order: ${updateError.message}\n`);
          } else {
            console.log(`   ✅ Order marked as expired\n`);
          }
        }
      } else {
        notExpiredCount++;
        const daysRemaining = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        console.log(`🟢 NOT EXPIRED: ${order.id}`);
        console.log(`   Plan: ${plan.name}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Activated: ${activationDate.toISOString()}`);
        console.log(`   Expires: ${expirationDate.toISOString()}`);
        console.log(`   Days remaining: ${daysRemaining}`);
        console.log(`   Validity period: ${plan.validity_days} days\n`);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   Total checked: ${orders.length}`);
    console.log(`   Expired: ${expiredCount}`);
    console.log(`   Not expired: ${notExpiredCount}`);

    if (DRY_RUN && expiredCount > 0) {
      console.log('\n💡 Run with --apply flag to actually expire these orders');
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testExpireOrders();
