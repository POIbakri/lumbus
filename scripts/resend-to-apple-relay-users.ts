/**
 * Script to resend welcome emails to Apple Private Relay users
 * after configuring the domain in Apple Developer Portal.
 *
 * This targets users with @privaterelay.appleid.com emails whose
 * previous emails bounced due to misconfiguration.
 *
 * PREREQUISITES:
 * 1. Configure your sending domain (updates.getlumbus.com) in Apple Developer Portal
 * 2. Contact Resend support to unsuppress bounced @privaterelay.appleid.com addresses
 * 3. Then run this script
 *
 * Run with: npx tsx scripts/resend-to-apple-relay-users.ts
 *
 * Options:
 *   --dry-run    Preview what would be sent without actually sending
 *   --limit=N    Only process N users (useful for testing)
 */

import * as dotenv from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Check if environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Environment variables not loaded');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

// Create Supabase client with service role key to access auth.users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

import { sendWelcomeEmail } from '../lib/email';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

interface UserRecord {
  id: string;
  email: string;
  raw_user_meta_data?: Record<string, unknown>;
  created_at: string;
}

async function main() {
  console.log('🍎 Resend Emails to Apple Private Relay Users');
  console.log('==============================================');
  console.log('');
  console.log('⚠️  IMPORTANT: Before running this script, ensure you have:');
  console.log('   1. Configured updates.getlumbus.com in Apple Developer Portal');
  console.log('   2. Contacted Resend support to unsuppress bounced addresses');
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent');
  }
  if (limit) {
    console.log(`📊 Limiting to ${limit} users`);
  }
  console.log('');

  // Step 1: Get all users from auth.users via admin API
  console.log('1️⃣ Fetching all users from auth.users...');

  const allUsers: UserRecord[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      break;
    }

    allUsers.push(...users.map(u => ({
      id: u.id,
      email: u.email || '',
      raw_user_meta_data: u.user_metadata,
      created_at: u.created_at,
    })));

    if (users.length < perPage) {
      break;
    }

    page++;
  }

  console.log(`   Found ${allUsers.length} total users`);
  console.log('');

  // Step 2: Filter to Apple Private Relay users only
  console.log('2️⃣ Filtering Apple Private Relay users...');
  const appleRelayUsers = allUsers.filter(user =>
    user.email && user.email.endsWith('@privaterelay.appleid.com')
  );

  console.log(`   Found ${appleRelayUsers.length} Apple Private Relay users`);
  console.log('');

  if (appleRelayUsers.length === 0) {
    console.log('✅ No Apple Private Relay users found. Nothing to do!');
    return;
  }

  // Step 3: Get users who have orders (they need order confirmation, not welcome email)
  console.log('3️⃣ Fetching users with orders...');
  const { data: usersWithOrders, error: ordersError } = await supabase
    .from('orders')
    .select('user_id')
    .in('status', ['paid', 'completed', 'provisioning']);

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError.message);
    process.exit(1);
  }

  const usersWithOrdersSet = new Set(usersWithOrders?.map(o => o.user_id) || []);

  // Step 4: Get failed welcome email attempts (bounced)
  console.log('4️⃣ Checking for previously failed email attempts...');
  const { data: failedEmails, error: failedError } = await supabase
    .from('webhook_events')
    .select('notify_id')
    .eq('provider', 'internal')
    .eq('event_type', 'welcome_email_sent')
    .in('notify_id', appleRelayUsers.map(u => u.id));

  if (failedError) {
    console.error('❌ Error fetching email records:', failedError.message);
    process.exit(1);
  }

  const previouslySentSet = new Set(failedEmails?.map(w => w.notify_id) || []);
  console.log(`   Found ${previouslySentSet.size} Apple users with previous send attempts`);
  console.log('');

  // Step 5: Determine which users need emails
  console.log('5️⃣ Determining users who need emails resent...');

  // Users who need welcome email: Apple relay users who don't have orders
  // We'll resend even if we "sent" before, because those bounced
  let usersToEmail = appleRelayUsers.filter(user => {
    // Skip users with orders (they'll get order confirmation separately)
    if (usersWithOrdersSet.has(user.id)) return false;
    return true;
  });

  const usersWithOrdersCount = appleRelayUsers.filter(u => usersWithOrdersSet.has(u.id)).length;

  console.log(`   Apple relay users with orders: ${usersWithOrdersCount} (will handle separately)`);
  console.log(`   Apple relay users needing welcome email: ${usersToEmail.length}`);
  console.log('');

  if (usersToEmail.length === 0) {
    console.log('✅ No Apple relay users need welcome emails. All done!');
    return;
  }

  // Apply limit if specified
  if (limit && limit < usersToEmail.length) {
    usersToEmail = usersToEmail.slice(0, limit);
    console.log(`   Processing only first ${limit} users due to --limit flag`);
    console.log('');
  }

  // Step 6: Send welcome emails
  console.log('6️⃣ Sending welcome emails to Apple relay users...');
  console.log('');

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of usersToEmail) {
    const metadata = user.raw_user_meta_data || {};
    const userName = (metadata.full_name || metadata.name) as string | undefined;

    console.log(`   Processing: ${user.email} (${user.id})`);

    if (dryRun) {
      console.log(`   ⏭️  [DRY RUN] Would send welcome email to ${user.email}`);
      skipped++;
      continue;
    }

    try {
      // Send the email
      await sendWelcomeEmail({
        to: user.email,
        userName: userName,
      });

      // Update or insert the welcome email record
      // First, try to delete any existing failed record
      await supabase
        .from('webhook_events')
        .delete()
        .eq('provider', 'internal')
        .eq('event_type', 'welcome_email_sent')
        .eq('notify_id', user.id);

      // Then insert new success record
      await supabase.from('webhook_events').insert({
        provider: 'internal',
        event_type: 'welcome_email_sent',
        notify_id: user.id,
        payload_json: {
          email: user.email,
          userName,
          sentAt: new Date().toISOString(),
          source: 'apple_relay_resend_script',
          isResend: true
        },
        processed_at: new Date().toISOString(),
      });

      console.log(`   ✅ Sent to ${user.email}`);
      sent++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Failed to send to ${user.email}:`, error);
      failed++;
    }
  }

  // Summary
  console.log('');
  console.log('==============================================');
  console.log('📊 Summary:');
  console.log(`   Total Apple relay users:  ${appleRelayUsers.length}`);
  console.log(`   With orders (skipped):    ${usersWithOrdersCount}`);
  console.log(`   Needed welcome email:     ${usersToEmail.length}`);
  console.log('');
  if (dryRun) {
    console.log(`   Would send:               ${skipped}`);
    console.log('');
    console.log('💡 Run without --dry-run to actually send emails');
  } else {
    console.log(`   Successfully sent:        ${sent}`);
    console.log(`   Failed:                   ${failed}`);
  }
  console.log('==============================================');

  // Reminder about users with orders
  if (usersWithOrdersCount > 0) {
    console.log('');
    console.log('📝 NOTE: There are ' + usersWithOrdersCount + ' Apple relay users with orders.');
    console.log('   You may want to create a separate script to resend their order confirmations.');
  }
}

main().catch(console.error);
