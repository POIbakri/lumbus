/**
 * Script to send referral promo emails to all existing users
 *
 * Usage:
 *   npx tsx scripts/send-referral-promo-emails.ts [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run   Preview what would be sent without actually sending
 *   --limit=N   Only send to first N users (for testing)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { sendReferralPromoEmail } from '../lib/marketing-emails';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

interface UserWithProfile {
  id: string;
  email: string;
  user_profiles: {
    ref_code: string;
  } | null;
}

async function main() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(60));
  console.log('REFERRAL PROMO EMAIL CAMPAIGN');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no emails will be sent)' : '📧 LIVE'}`);
  if (limit) console.log(`Limit: ${limit} users`);
  console.log('');

  // Fetch all users with their referral codes
  console.log('Fetching users with referral codes...');

  let query = supabase
    .from('users')
    .select(`
      id,
      email,
      user_profiles!inner (
        ref_code
      )
    `)
    .not('email', 'is', null);

  if (limit) {
    query = query.limit(limit);
  }

  const { data: users, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No users found with referral codes.');
    process.exit(0);
  }

  console.log(`Found ${users.length} users with referral codes.\n`);

  // Track results
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Process each user
  for (let i = 0; i < users.length; i++) {
    const user = users[i] as unknown as UserWithProfile;
    const progress = `[${i + 1}/${users.length}]`;

    // Skip if no email
    if (!user.email) {
      console.log(`${progress} ⏭️  Skipped: No email for user ${user.id}`);
      results.skipped++;
      continue;
    }

    // Skip if no referral code
    const refCode = user.user_profiles?.ref_code;
    if (!refCode) {
      console.log(`${progress} ⏭️  Skipped: No referral code for ${user.email}`);
      results.skipped++;
      continue;
    }

    // Extract first name from email (before @ and before any dots/numbers)
    const emailName = user.email.split('@')[0];
    const firstName = emailName.replace(/[0-9._]/g, ' ').split(' ')[0];
    const displayName = firstName.length > 2 ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : undefined;

    const referralLink = `https://getlumbus.com/r/${refCode}`;

    if (isDryRun) {
      console.log(`${progress} 🔍 Would send to: ${user.email}`);
      console.log(`         Name: ${displayName || '(none)'}`);
      console.log(`         Code: ${refCode}`);
      console.log(`         Link: ${referralLink}`);
      results.success++;
    } else {
      try {
        await sendReferralPromoEmail({
          to: user.email,
          firstName: displayName,
          referralCode: refCode,
          referralLink,
        });

        console.log(`${progress} ✅ Sent to: ${user.email}`);
        results.success++;

        // Rate limiting: 600ms delay between emails (Resend allows 2 req/sec)
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`${progress} ❌ Failed: ${user.email} - ${errorMsg}`);
        results.failed++;
        results.errors.push(`${user.email}: ${errorMsg}`);
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total users:  ${users.length}`);
  console.log(`✅ Success:   ${results.success}`);
  console.log(`❌ Failed:    ${results.failed}`);
  console.log(`⏭️  Skipped:   ${results.skipped}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  if (isDryRun) {
    console.log('\n🔍 This was a DRY RUN. No emails were actually sent.');
    console.log('   Run without --dry-run to send for real.');
  }

  console.log('');
}

main().catch(console.error);
