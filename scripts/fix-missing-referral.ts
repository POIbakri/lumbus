import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function fix() {
  const buyerId = '30f129bb-b2f6-415e-b415-8acf64ef7493';
  const referrerId = 'ac9d9c9a-c164-42a7-af61-7c94b3981b4c';
  const orderId = '606f923b-d679-4049-b695-f0aeaffc1f76';
  const refCode = 'NED3H92T';
  const rewardMB = 1024; // 1GB

  console.log('=== FIXING MISSING REFERRAL DATA ===\n');

  // 1. Update buyer's profile with referred_by_code
  console.log('1. Updating buyer profile with referred_by_code...');
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ referred_by_code: refCode })
    .eq('id', buyerId);

  if (profileError) {
    console.error('Failed to update profile:', profileError);
  } else {
    console.log('   ✓ Profile updated');
  }

  // 2. Create order attribution
  console.log('2. Creating order attribution...');
  const { data: existingAttr } = await supabase
    .from('order_attributions')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existingAttr) {
    console.log('   ⚠ Attribution already exists, skipping');
  } else {
    const { error: attrError } = await supabase
      .from('order_attributions')
      .insert({
        order_id: orderId,
        source_type: 'REFERRAL',
        referrer_user_id: referrerId,
        ref_code: refCode,
      });

    if (attrError) {
      console.error('Failed to create attribution:', attrError);
    } else {
      console.log('   ✓ Attribution created');
    }
  }

  // 3. Create reward for REFERRER (w.binbrek@icloud.com)
  console.log('3. Creating reward for referrer...');
  const { data: existingReferrerReward } = await supabase
    .from('referral_rewards')
    .select('id')
    .eq('order_id', orderId)
    .eq('referrer_user_id', referrerId)
    .maybeSingle();

  if (existingReferrerReward) {
    console.log('   ⚠ Referrer reward already exists, skipping');
  } else {
    const { error: referrerRewardError } = await supabase
      .from('referral_rewards')
      .insert({
        order_id: orderId,
        referrer_user_id: referrerId,
        referred_user_id: buyerId,
        reward_type: 'FREE_DATA',
        reward_value: rewardMB,
        status: 'PENDING',
      });

    if (referrerRewardError) {
      console.error('Failed to create referrer reward:', referrerRewardError);
    } else {
      console.log('   ✓ Referrer reward created (1GB pending)');
    }
  }

  // 4. Create reward for BUYER (bakri.albrek@icloud.com)
  console.log('4. Creating reward for buyer...');
  const { data: existingBuyerReward } = await supabase
    .from('referral_rewards')
    .select('id')
    .eq('order_id', orderId)
    .eq('referrer_user_id', buyerId)
    .maybeSingle();

  if (existingBuyerReward) {
    console.log('   ⚠ Buyer reward already exists, skipping');
  } else {
    const { error: buyerRewardError } = await supabase
      .from('referral_rewards')
      .insert({
        order_id: orderId,
        referrer_user_id: buyerId, // Buyer gets their own reward
        referred_user_id: buyerId,
        reward_type: 'FREE_DATA',
        reward_value: rewardMB,
        status: 'PENDING',
        notes: 'First-time buyer bonus for using referral code (manually added)',
      });

    if (buyerRewardError) {
      console.error('Failed to create buyer reward:', buyerRewardError);
    } else {
      console.log('   ✓ Buyer reward created (1GB pending)');
    }
  }

  console.log('\n=== DONE ===');
  console.log('Both users now have 1GB pending rewards they can claim in the app.');
}

fix().catch(console.error);
