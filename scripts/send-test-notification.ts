#!/usr/bin/env npx tsx
// scripts/send-test-notification.ts

import { config } from 'dotenv';
// Load environment variables FIRST before any other imports
config({ path: '.env.local' });

async function main() {
  // Dynamic imports after env is loaded
  const { createClient } = await import('@supabase/supabase-js');
  const { default: Expo } = await import('expo-server-sdk');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const expo = new Expo();

  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: npx tsx scripts/send-test-notification.ts <type> <user_email> [order_id]

Types:
  esim_ready     - "Your eSIM is Ready!" notification
  usage_50       - "50% Data Used" notification
  usage_30       - "30% Data Remaining" notification
  usage_20       - "20% Data Remaining" notification
  usage_10       - "10% Data Remaining" notification
  usage_depleted - "No Data Remaining" notification
  custom         - Custom test notification

Examples:
  npx tsx scripts/send-test-notification.ts esim_ready user@example.com
  npx tsx scripts/send-test-notification.ts custom user@example.com
`);
    process.exit(1);
  }

  const [type, email, orderId] = args;

  // Look up user by email from auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching users:', authError.message);
    process.exit(1);
  }

  const user = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error('❌ User not found:', email);
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.email} (${user.id})`);

  // Check if user has a push token
  const { data: tokenData } = await supabase
    .from('user_push_tokens')
    .select('push_token, platform')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tokenData) {
    console.error('❌ No push token registered for this user');
    console.log('  User needs to log in to the mobile app first');
    process.exit(1);
  }

  console.log(`✓ Push token found (${tokenData.platform}): ${tokenData.push_token.slice(0, 30)}...`);

  // Get an order for context (or use provided one)
  let targetOrderId = orderId;
  let orderName = 'Test Plan';

  if (!targetOrderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, package_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (order) {
      targetOrderId = order.id;
      orderName = order.package_name || 'Test Plan';
      console.log(`✓ Using latest order: ${orderName} (${order.id})`);
    } else {
      targetOrderId = 'test-order-id';
      console.log('⚠ No orders found, using test order ID');
    }
  }

  // Build notification based on type
  let title: string;
  let body: string;
  let notificationType: string;
  let channelId: string;
  let categoryId: string | undefined;

  switch (type) {
    case 'esim_ready':
      title = 'Your eSIM is Ready!';
      body = `Your ${orderName} eSIM is ready to install. Tap to view installation instructions.`;
      notificationType = 'esim_ready';
      channelId = 'esim-ready';
      categoryId = 'esim_ready';
      break;

    case 'usage_50':
      title = '50% Data Used';
      body = `You've used half of your ${orderName} data.`;
      notificationType = 'usage_50';
      channelId = 'usage-alerts';
      categoryId = 'usage_alert';
      break;

    case 'usage_30':
      title = '30% Data Remaining';
      body = `Only 30% data remaining on your ${orderName} eSIM.`;
      notificationType = 'usage_30';
      channelId = 'usage-alerts';
      categoryId = 'usage_alert';
      break;

    case 'usage_20':
      title = '20% Data Remaining';
      body = `Only 20% data remaining on your ${orderName} eSIM.`;
      notificationType = 'usage_20';
      channelId = 'usage-alerts';
      categoryId = 'usage_alert';
      break;

    case 'usage_10':
      title = '10% Data Remaining';
      body = `Only 10% data remaining on your ${orderName} eSIM. Consider topping up.`;
      notificationType = 'usage_10';
      channelId = 'usage-alerts';
      categoryId = 'usage_alert';
      break;

    case 'usage_depleted':
      title = 'No Data Remaining';
      body = `Your ${orderName} eSIM has run out of data. Top up now to stay connected.`;
      notificationType = 'usage_depleted';
      channelId = 'usage-alerts';
      categoryId = 'usage_alert';
      break;

    case 'custom':
    default:
      title = 'Test Notification';
      body = 'This is a test push notification from Lumbus.';
      notificationType = 'esim_ready';
      channelId = 'default';
      categoryId = undefined;
      break;
  }

  console.log(`\n📤 Sending ${type} notification...`);
  console.log(`   Title: ${title}`);
  console.log(`   Body: ${body}`);
  console.log(`   Channel: ${channelId}`);

  // Send via Expo
  const message = {
    to: tokenData.push_token,
    sound: 'default' as const,
    title,
    body,
    data: {
      type: notificationType,
      orderId: targetOrderId,
      orderName,
      test: true,
    },
    badge: 1,
    channelId,
    ...(categoryId && { categoryId }),
    priority: 'high' as const,
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    if (ticket.status === 'ok') {
      console.log('\n✅ Notification sent successfully!');
      console.log(`   Ticket ID: ${ticket.id}`);
    } else {
      console.error('\n❌ Failed to send:', ticket.message);
      if (ticket.details?.error === 'DeviceNotRegistered') {
        console.log('   The push token is no longer valid. User needs to log in again.');
      }
    }
  } catch (error) {
    console.error('\n❌ Error sending notification:', error);
  }

  process.exit(0);
}

main().catch(console.error);
