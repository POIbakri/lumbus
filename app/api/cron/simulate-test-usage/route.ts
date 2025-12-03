/**
 * Cron Job: Simulate Test User eSIM Usage
 *
 * This cron job updates test user orders with simulated data usage.
 * Allows app store reviewers to see realistic eSIM behavior.
 *
 * CRITICAL SAFETY: This ONLY affects users with is_test_user = true
 * Real users are NEVER affected by this job.
 *
 * Schedule: Run every 5 minutes via Vercel cron or external scheduler
 *
 * Simulation timeline:
 * - 0-1 min after order: Not activated yet
 * - 1+ min: Activated, data starts being consumed
 * - ~5 hours: Data depleted (20% per hour)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('[Test Simulation Cron] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Test Simulation Cron] Starting test user simulation...');

    // SAFETY CHECK 1: Only get test user IDs first
    const { data: testUsers, error: testUsersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_test_user', true);

    if (testUsersError) {
      console.error('[Test Simulation Cron] Failed to fetch test users:', testUsersError);
      return NextResponse.json({ error: 'Failed to fetch test users' }, { status: 500 });
    }

    if (!testUsers || testUsers.length === 0) {
      console.log('[Test Simulation Cron] No test users found');
      return NextResponse.json({ message: 'No test users found', updated: 0 });
    }

    const testUserIds = testUsers.map(u => u.id);
    console.log(`[Test Simulation Cron] Found ${testUserIds.length} test users:`, testUserIds);

    // SAFETY CHECK 2: Only fetch orders for test users with completed or provisioning status
    // Note: Test users should always have 'completed' status (set by webhook), but include
    // 'provisioning' for consistency with applyTestSimulationToOrders behavior
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        created_at,
        smdp,
        activation_code,
        data_usage_bytes,
        data_remaining_bytes,
        plans(data_gb, validity_days)
      `)
      .in('user_id', testUserIds)
      .in('status', ['completed', 'provisioning']);

    if (ordersError) {
      console.error('[Test Simulation Cron] Failed to fetch orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      console.log('[Test Simulation Cron] No eligible test orders found');
      return NextResponse.json({ message: 'No eligible test orders', updated: 0 });
    }

    console.log(`[Test Simulation Cron] Found ${orders.length} test orders to simulate`);

    let updatedCount = 0;
    const now = new Date();

    for (const order of orders) {
      // SAFETY CHECK 3: Double-verify this order belongs to a test user
      if (!testUserIds.includes(order.user_id)) {
        console.error(`[Test Simulation Cron] SAFETY BLOCK: Order ${order.id} user ${order.user_id} not in test users list!`);
        continue;
      }

      // Skip orders without activation details
      if (!order.smdp || !order.activation_code) {
        continue;
      }

      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
      if (!plan) {
        continue;
      }

      const totalDataBytes = plan.data_gb * 1024 * 1024 * 1024;
      const orderCreated = new Date(order.created_at);
      const minutesSinceCreation = (now.getTime() - orderCreated.getTime()) / (1000 * 60);

      // Simulate activation 1 minute after order creation
      const activationDelayMinutes = 1;

      let simulatedUsage = 0;
      let simulatedRemaining = totalDataBytes;
      let activatedAt: string | null = null;

      if (minutesSinceCreation >= activationDelayMinutes) {
        // Calculate simulated activation time
        activatedAt = new Date(orderCreated.getTime() + activationDelayMinutes * 60 * 1000).toISOString();
        const minutesSinceActivation = minutesSinceCreation - activationDelayMinutes;

        // Usage rate: 20% of total data per hour
        const usageRatePerMinute = totalDataBytes * 0.20 / 60;
        simulatedUsage = Math.min(
          Math.floor(minutesSinceActivation * usageRatePerMinute),
          totalDataBytes
        );
        simulatedRemaining = Math.max(0, totalDataBytes - simulatedUsage);
      }

      // SAFETY CHECK 4: Final verification before update
      const { data: verifyUser } = await supabase
        .from('users')
        .select('is_test_user')
        .eq('id', order.user_id)
        .single();

      if (!verifyUser || verifyUser.is_test_user !== true) {
        console.error(`[Test Simulation Cron] SAFETY BLOCK: User ${order.user_id} is_test_user != true!`);
        continue;
      }

      // Update order with simulated data
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          activated_at: activatedAt,
          data_usage_bytes: simulatedUsage,
          data_remaining_bytes: simulatedRemaining,
          last_usage_update: now.toISOString(),
        })
        .eq('id', order.id)
        .eq('user_id', order.user_id); // Extra safety: match user_id too

      if (updateError) {
        console.error(`[Test Simulation Cron] Failed to update order ${order.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`[Test Simulation Cron] Updated order ${order.id}: ${(simulatedUsage / (1024 * 1024 * 1024)).toFixed(2)}GB used of ${plan.data_gb}GB`);
      }
    }

    console.log(`[Test Simulation Cron] Completed. Updated ${updatedCount} orders.`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} test orders`,
      updated: updatedCount,
      testUsers: testUserIds.length,
    });

  } catch (error) {
    console.error('[Test Simulation Cron] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
