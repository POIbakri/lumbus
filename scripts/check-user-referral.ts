import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function check() {
  const email = 'bakri.albrek@icloud.com';
  const referralCodeUsed = 'NED3H92T';

  // First, find who owns the referral code
  const { data: referrerProfile } = await supabase
    .from('user_profiles')
    .select('id, ref_code')
    .eq('ref_code', referralCodeUsed)
    .single();

  console.log('=== REFERRER (owner of code ' + referralCodeUsed + ') ===');
  console.log(JSON.stringify(referrerProfile, null, 2));

  if (referrerProfile) {
    const { data: referrerUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', referrerProfile.id)
      .single();
    console.log('Referrer email:', referrerUser?.email);
  }

  // Find user
  const { data: user } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('email', email)
    .single();

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('=== USER ===');
  console.log(JSON.stringify(user, null, 2));

  // Check user profile for referred_by_code
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('\n=== USER PROFILE ===');
  console.log(JSON.stringify(profile, null, 2));

  // Check orders - get full details
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  console.log('\n=== ORDERS ===');
  console.log(JSON.stringify(orders, null, 2));

  if (!orders || orders.length === 0) {
    console.log('No orders found');
    return;
  }

  // Check order attributions
  const { data: attributions } = await supabase
    .from('order_attributions')
    .select('*')
    .in('order_id', orders.map(o => o.id));

  console.log('\n=== ORDER ATTRIBUTIONS ===');
  console.log(JSON.stringify(attributions, null, 2));

  // Check referral rewards (as referrer or referred)
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('*')
    .or(`referrer_user_id.eq.${user.id},referred_user_id.eq.${user.id}`);

  console.log('\n=== REFERRAL REWARDS ===');
  console.log(JSON.stringify(rewards, null, 2));

  // Check wallet
  const { data: wallet } = await supabase
    .from('user_data_wallet')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  console.log('\n=== DATA WALLET ===');
  console.log(JSON.stringify(wallet, null, 2));

  // Check webhook events for this order
  const { data: webhooks } = await supabase
    .from('webhook_idempotency')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('\n=== RECENT WEBHOOK EVENTS ===');
  const relevantWebhooks = webhooks?.filter(w =>
    JSON.stringify(w).includes(orders[0].id)
  );
  console.log(JSON.stringify(relevantWebhooks, null, 2));
}

check().catch(console.error);
