import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function fix() {
  const buyerId = '30f129bb-b2f6-415e-b415-8acf64ef7493';
  const orderId = '606f923b-d679-4049-b695-f0aeaffc1f76';
  const rewardMB = 1024; // 1GB

  console.log('=== FIXING SCHEMA AND CREATING BUYER REWARD ===\n');

  // 1. Drop old constraint and add new one
  console.log('1. Fixing unique constraint on referral_rewards...');
  const { error: constraintError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_order_id_key;
      ALTER TABLE public.referral_rewards
      ADD CONSTRAINT referral_rewards_order_user_unique
      UNIQUE (order_id, referrer_user_id);
    `
  });

  if (constraintError) {
    // RPC might not exist, try direct approach
    console.log('   Note: RPC not available, constraint needs to be fixed via Supabase dashboard or CLI');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   ALTER TABLE public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_order_id_key;');
    console.log('   ALTER TABLE public.referral_rewards ADD CONSTRAINT referral_rewards_order_user_unique UNIQUE (order_id, referrer_user_id);');
  } else {
    console.log('   ✓ Constraint fixed');
  }

  // 2. Try to create buyer reward again
  console.log('\n2. Creating reward for buyer...');
  const { error: buyerRewardError } = await supabase
    .from('referral_rewards')
    .insert({
      order_id: orderId,
      referrer_user_id: buyerId,
      referred_user_id: buyerId,
      reward_type: 'FREE_DATA',
      reward_value: rewardMB,
      status: 'PENDING',
      notes: 'First-time buyer bonus for using referral code (manually added)',
    });

  if (buyerRewardError) {
    if (buyerRewardError.code === '23505') {
      console.log('   ⚠ Constraint still exists. Please run the migration first.');
      console.log('   Run: supabase db push');
      console.log('   Or run the SQL above in Supabase dashboard.');
    } else {
      console.error('Failed to create buyer reward:', buyerRewardError);
    }
  } else {
    console.log('   ✓ Buyer reward created (1GB pending)');
  }

  // 3. Verify rewards
  console.log('\n3. Verifying rewards...');
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('order_id', orderId);

  console.log('Rewards for order:', JSON.stringify(rewards, null, 2));
}

fix().catch(console.error);
