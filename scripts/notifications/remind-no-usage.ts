#!/usr/bin/env npx tsx
/**
 * Remind users who have activated eSIMs but haven't used any data yet (0% usage)
 *
 * Usage:
 *   npx tsx scripts/notifications/remind-no-usage.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Show who would be notified without sending
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const { default: Expo } = await import('expo-server-sdk');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const expo = new Expo();

  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🔍 DRY RUN - No notifications will be sent\n');
  }

  // Find orders that are activated but have 0% usage
  const { data: noUsageOrders, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      data_remaining_bytes,
      activated_at,
      plans (
        name,
        data_gb
      )
    `)
    .not('activated_at', 'is', null)
    .not('data_remaining_bytes', 'is', null)
    .order('activated_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error.message);
    return;
  }

  if (!noUsageOrders || noUsageOrders.length === 0) {
    console.log('No activated eSIMs found');
    return;
  }

  // Filter to only those with 0% usage (remaining equals total, or very close)
  const zeroUsageOrders = noUsageOrders.filter(o => {
    const plan = (o as any).plans;
    if (!o.data_remaining_bytes || !plan?.data_gb) return false;
    const totalBytes = plan.data_gb * 1024 * 1024 * 1024; // Convert GB to bytes
    // Consider 0% usage if remaining is >= 99% of total
    return o.data_remaining_bytes >= totalBytes * 0.99;
  });

  if (zeroUsageOrders.length === 0) {
    console.log('No eSIMs with 0% usage found');
    return;
  }

  console.log(`Found ${zeroUsageOrders.length} activated eSIMs with no usage\n`);

  // Get push tokens
  const userIds = [...new Set(zeroUsageOrders.map(o => o.user_id))];

  const { data: pushTokens } = await supabase
    .from('user_push_tokens')
    .select('user_id, push_token, platform')
    .in('user_id', userIds);

  if (!pushTokens || pushTokens.length === 0) {
    console.log('No users with push tokens found');
    return;
  }

  const tokenMap = new Map(pushTokens.map(t => [t.user_id, t]));

  // Get user emails
  const { data: authData } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authData?.users.map(u => [u.id, u.email]) || []);

  console.log('Users to notify:\n');

  const messages: any[] = [];
  const notifiedUsers = new Set<string>();

  for (const order of zeroUsageOrders) {
    // Only notify each user once (for their most recent order)
    if (notifiedUsers.has(order.user_id)) continue;

    const tokenData = tokenMap.get(order.user_id);
    if (!tokenData) continue;

    notifiedUsers.add(order.user_id);

    const email = emailMap.get(order.user_id) || 'unknown';
    const plan = (order as any).plans;
    const planName = plan?.name || 'eSIM';
    const totalGB = plan?.data_gb || 0;
    const activatedDaysAgo = Math.floor((Date.now() - new Date(order.activated_at).getTime()) / (1000 * 60 * 60 * 24));

    console.log(`  ${email}`);
    console.log(`    eSIM: ${planName}`);
    console.log(`    Data: ${totalGB} GB (unused)`);
    console.log(`    Activated: ${activatedDaysAgo} days ago`);
    console.log('');

    messages.push({
      to: tokenData.push_token,
      sound: 'default',
      title: 'Start using your eSIM!',
      body: `Your ${planName} eSIM is ready with ${totalGB} GB. Enable it in Settings to start using data.`,
      data: {
        type: 'esim_ready',
        orderId: order.id,
        orderName: planName,
      },
      badge: 1,
      channelId: 'esim-ready',
      categoryId: 'esim_ready',
      priority: 'high',
    });
  }

  console.log(`Total: ${messages.length} users to notify\n`);

  if (dryRun) {
    console.log('DRY RUN complete - no notifications sent');
    return;
  }

  console.log('Sending notifications...\n');

  const chunks = expo.chunkPushNotifications(messages);
  let successCount = 0;
  let failCount = 0;

  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failCount++;
        console.log('Failed:', ticket.message);
      }
    }
  }

  console.log('Done!');
  console.log(`  Sent: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
}

main().catch(console.error);
