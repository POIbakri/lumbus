import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function check1GBPlans() {
  console.log('Checking for 1GB plans in database...\n');

  const { data: plans, error } = await supabase
    .from('plans')
    .select('name, region_code, data_gb, validity_days, supplier_sku, retail_price')
    .eq('data_gb', 1)
    .order('retail_price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }

  if (!plans || plans.length === 0) {
    console.log('No 1GB plans found in database');
    return;
  }

  console.log(`Found ${plans.length} 1GB plans:\n`);
  console.log('Name | Region | Validity | SKU | Price (USD)');
  console.log('-'.repeat(80));

  plans.forEach(plan => {
    console.log(
      `${plan.name.padEnd(30)} | ${plan.region_code.padEnd(8)} | ${String(plan.validity_days).padEnd(8)} | ${plan.supplier_sku.padEnd(10)} | $${plan.retail_price}`
    );
  });

  // Find the cheapest 1GB plan
  const cheapest = plans[0];
  console.log('\n' + '='.repeat(80));
  console.log('CHEAPEST 1GB PLAN (Best for rewards):');
  console.log('='.repeat(80));
  console.log(`Name: ${cheapest.name}`);
  console.log(`SKU: ${cheapest.supplier_sku}`);
  console.log(`Price: $${cheapest.retail_price}`);
  console.log(`Validity: ${cheapest.validity_days} days`);
  console.log('\nTo use this for rewards, add to system_config:');
  console.log(`INSERT INTO system_config (key, value) VALUES ('REFERRAL_REWARD_PACKAGE_CODE', '${cheapest.supplier_sku}');`);
}

check1GBPlans().then(() => process.exit(0));