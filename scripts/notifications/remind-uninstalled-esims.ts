#!/usr/bin/env npx tsx
/**
 * Remind users who have eSIMs ready but haven't installed/activated them
 *
 * Usage:
 *   npx tsx scripts/notifications/remind-uninstalled-esims.ts [--dry-run]
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

  // Find orders that have QR code (eSIM ready) but not activated
  const { data: unactivatedOrders, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      qr_url,
      activated_at,
      created_at,
      plans (
        name,
        data_gb
      )
    `)
    .not('qr_url', 'is', null)
    .is('activated_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error.message);
    return;
  }

  if (!unactivatedOrders || unactivatedOrders.length === 0) {
    console.log('No unactivated eSIMs found');
    return;
  }

  console.log(`Found ${unactivatedOrders.length} unactivated eSIMs\n`);

  // Get unique users with their push tokens
  const userIds = [...new Set(unactivatedOrders.map(o => o.user_id))];

  const { data: pushTokens } = await supabase
    .from('user_push_tokens')
    .select('user_id, push_token, platform')
    .in('user_id', userIds);

  if (!pushTokens || pushTokens.length === 0) {
    console.log('No users with push tokens found');
    return;
  }

  // Create a map of user_id -> push_token
  const tokenMap = new Map(pushTokens.map(t => [t.user_id, t]));

  // Group orders by user
  const ordersByUser = new Map<string, typeof unactivatedOrders>();
  for (const order of unactivatedOrders) {
    const existing = ordersByUser.get(order.user_id) || [];
    existing.push(order);
    ordersByUser.set(order.user_id, existing);
  }

  // Get user emails for logging
  const { data: authData } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authData?.users.map(u => [u.id, u.email]) || []);

  console.log('Users to notify:\n');

  const messages: any[] = [];

  for (const [userId, orders] of ordersByUser) {
    const tokenData = tokenMap.get(userId);
    if (!tokenData) continue;

    const email = emailMap.get(userId) || 'unknown';
    const latestOrder = orders[0];
    const planName = (latestOrder as any).plans?.name || 'eSIM';
    const orderAge = Math.floor((Date.now() - new Date(latestOrder.created_at).getTime()) / (1000 * 60 * 60 * 24));

    console.log(`  ${email}`);
    console.log(`    eSIM: ${planName}`);
    console.log(`    Ordered: ${orderAge} days ago`);
    console.log(`    Platform: ${tokenData.platform}`);
    console.log('');

    messages.push({
      to: tokenData.push_token,
      sound: 'default',
      title: 'Your eSIM is waiting!',
      body: `Your ${planName} eSIM is ready to install. Tap to set it up and start using data.`,
      data: {
        type: 'esim_ready',
        orderId: latestOrder.id,
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

  // Send notifications
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
