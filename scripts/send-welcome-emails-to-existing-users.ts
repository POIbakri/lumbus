/**
 * One-time script to send welcome emails to all existing users
 * who haven't received one yet.
 *
 * Run with: npx tsx scripts/send-welcome-emails-to-existing-users.ts
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
  console.log('📧 Send Welcome Emails to Existing Users');
  console.log('=========================================');
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

  // Step 2: Get users who have orders (they received order confirmation)
  console.log('2️⃣ Fetching users with orders...');
  const { data: usersWithOrders, error: ordersError } = await supabase
    .from('orders')
    .select('user_id')
    .in('status', ['paid', 'completed', 'provisioning']);

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError.message);
    process.exit(1);
  }

  const usersWithOrdersSet = new Set(usersWithOrders?.map(o => o.user_id) || []);
  console.log(`   Found ${usersWithOrdersSet.size} users with orders (will skip)`);
  console.log('');

  // Step 3: Get users who already received welcome email
  console.log('3️⃣ Fetching users who already received welcome email...');
  const { data: welcomeEmails, error: welcomeError } = await supabase
    .from('webhook_events')
    .select('notify_id')
    .eq('provider', 'internal')
    .eq('event_type', 'welcome_email_sent');

  if (welcomeError) {
    console.error('❌ Error fetching welcome email records:', welcomeError.message);
    process.exit(1);
  }

  const alreadySentSet = new Set(welcomeEmails?.map(w => w.notify_id) || []);
  console.log(`   Found ${alreadySentSet.size} users who already received welcome email (will skip)`);
  console.log('');

  // Step 4: Filter to users who need welcome email
  console.log('4️⃣ Filtering users who need welcome email...');
  let usersToEmail = allUsers.filter(user => {
    // Skip users without email
    if (!user.email) return false;
    // Skip users with orders
    if (usersWithOrdersSet.has(user.id)) return false;
    // Skip users who already got welcome email
    if (alreadySentSet.has(user.id)) return false;
    return true;
  });

  console.log(`   ${usersToEmail.length} users need welcome email`);
  console.log('');

  if (usersToEmail.length === 0) {
    console.log('✅ No users need welcome emails. All done!');
    return;
  }

  // Apply limit if specified
  if (limit && limit < usersToEmail.length) {
    usersToEmail = usersToEmail.slice(0, limit);
    console.log(`   Processing only first ${limit} users due to --limit flag`);
    console.log('');
  }

  // Step 5: Send welcome emails
  console.log('5️⃣ Sending welcome emails...');
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

      // Record that we sent the welcome email (to prevent duplicates)
      await supabase.from('webhook_events').insert({
        provider: 'internal',
        event_type: 'welcome_email_sent',
        notify_id: user.id,
        payload_json: {
          email: user.email,
          userName,
          sentAt: new Date().toISOString(),
          source: 'bulk_send_script'
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
  console.log('=========================================');
  console.log('📊 Summary:');
  console.log(`   Total users:        ${allUsers.length}`);
  console.log(`   Users with orders:  ${usersWithOrdersSet.size} (skipped)`);
  console.log(`   Already sent:       ${alreadySentSet.size} (skipped)`);
  console.log(`   Needed welcome:     ${usersToEmail.length}`);
  console.log('');
  if (dryRun) {
    console.log(`   Would send:         ${skipped}`);
    console.log('');
    console.log('💡 Run without --dry-run to actually send emails');
  } else {
    console.log(`   Successfully sent:  ${sent}`);
    console.log(`   Failed:             ${failed}`);
  }
  console.log('=========================================');
}

main().catch(console.error);
