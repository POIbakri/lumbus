#!/usr/bin/env npx tsx
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

  const email = process.argv[2];
  const title = process.argv[3];
  const body = process.argv[4];

  if (!email || !title || !body) {
    console.log('Usage: npx tsx scripts/send-custom-notification.ts <email> "<title>" "<body>"');
    process.exit(1);
  }

  // Look up user
  const { data: authData } = await supabase.auth.admin.listUsers();
  const user = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error('❌ User not found:', email);
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.email}`);

  // Get push token
  const { data: tokenData } = await supabase
    .from('user_push_tokens')
    .select('push_token, platform')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tokenData) {
    console.error('❌ No push token for this user');
    process.exit(1);
  }

  console.log(`✓ Push token found (${tokenData.platform})`);
  console.log(`\n📤 Sending notification...`);
  console.log(`   Title: ${title}`);
  console.log(`   Body: ${body}`);

  const ticket = await expo.sendPushNotificationsAsync([{
    to: tokenData.push_token,
    sound: 'default',
    title,
    body,
    data: { type: 'support' },
    badge: 1,
    channelId: 'default',
    priority: 'high',
  }]);

  if (ticket[0].status === 'ok') {
    console.log('\n✅ Notification sent!');
  } else {
    console.error('\n❌ Failed:', ticket[0].message);
  }
}

main().catch(console.error);
