#!/usr/bin/env npx tsx
// scripts/send-broadcast-notification.ts
// Send a notification to all users with push tokens

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

  const title = process.argv[2] || 'App Update Available';
  const body = process.argv[3] || 'A new version of Lumbus is available with improvements. Update now for the best experience!';

  // Get all push tokens
  const { data: tokens } = await supabase
    .from('user_push_tokens')
    .select('user_id, push_token, platform');

  if (!tokens || tokens.length === 0) {
    console.log('No push tokens found');
    return;
  }

  console.log(`Sending notification to ${tokens.length} users...`);
  console.log(`  Title: ${title}`);
  console.log(`  Body: ${body}\n`);

  const messages = tokens.map(t => ({
    to: t.push_token,
    sound: 'default' as const,
    title,
    body,
    data: {
      type: 'app_update',
    },
    badge: 1,
    channelId: 'default',
    priority: 'high' as const,
  }));

  // Send in chunks (Expo recommends max 100 per request)
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

  console.log('\nDone!');
  console.log(`  Sent: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
}

main().catch(console.error);
