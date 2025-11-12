import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

interface PlanUpdate {
  id: string;
  name: string;
  region_code: string;
  data_gb: number;
  validity_days: number;
  old_price: number;
  new_price: number;
  reason: string;
}

function roundToNinetyNine(price: number): number {
  if (price < 0.99) return 0.99;
  return Math.floor(price) + 0.99;
}

async function fixPricingAnomalies(dryRun = true) {
  console.log('\n🔧 Fixing Pricing Anomalies');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
  console.log('=' .repeat(100));

  const updates: PlanUpdate[] = [];

  // Fetch all active plans
  const { data: allPlans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('region_code', { ascending: true })
    .order('data_gb', { ascending: true })
    .order('retail_price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }

  if (!allPlans || allPlans.length === 0) {
    console.log('No active plans found');
    return;
  }

  // Group plans by region
  const plansByRegion = new Map<string, typeof allPlans>();
  for (const plan of allPlans) {
    if (!plansByRegion.has(plan.region_code)) {
      plansByRegion.set(plan.region_code, []);
    }
    plansByRegion.get(plan.region_code)!.push(plan);
  }

  console.log('\n📋 Analyzing pricing anomalies...\n');

  // Track which plans have been updated to avoid conflicts
  const updatedPlanIds = new Set<string>();

  // Process each region
  for (const [region, regionPlans] of plansByRegion.entries()) {
    // Find 500MB and 1GB plans in this region
    const plans500MB = regionPlans.filter(p => p.data_gb === 0.5);
    const plans1GB = regionPlans.filter(p => p.data_gb === 1);

    // FIRST: Check for validity-based pricing anomalies in 500MB plans
    // (where longer validity is cheaper than shorter validity)
    if (plans500MB.length > 1) {
      // Sort 500MB plans by validity days
      const sorted500MB = [...plans500MB].sort((a, b) => a.validity_days - b.validity_days);

      for (let i = 0; i < sorted500MB.length - 1; i++) {
        for (let j = i + 1; j < sorted500MB.length; j++) {
          const shorterPlan = sorted500MB[i];
          const longerPlan = sorted500MB[j];

          // If longer validity plan is cheaper than shorter validity plan
          if (longerPlan.retail_price < shorterPlan.retail_price) {
            // Switch their prices
            updates.push({
              id: shorterPlan.id,
              name: shorterPlan.name,
              region_code: shorterPlan.region_code,
              data_gb: shorterPlan.data_gb,
              validity_days: shorterPlan.validity_days,
              old_price: shorterPlan.retail_price,
              new_price: longerPlan.retail_price,
              reason: `Switching price with ${longerPlan.validity_days}-day plan (was more expensive despite fewer days)`
            });

            updates.push({
              id: longerPlan.id,
              name: longerPlan.name,
              region_code: longerPlan.region_code,
              data_gb: longerPlan.data_gb,
              validity_days: longerPlan.validity_days,
              old_price: longerPlan.retail_price,
              new_price: shorterPlan.retail_price,
              reason: `Switching price with ${shorterPlan.validity_days}-day plan (was cheaper despite more days)`
            });

            updatedPlanIds.add(shorterPlan.id);
            updatedPlanIds.add(longerPlan.id);
          }
        }
      }
    }

    // SECOND: Check for same-price 500MB and 1GB plans
    // (only if the 500MB plan hasn't already been updated)
    for (const plan500 of plans500MB) {
      if (updatedPlanIds.has(plan500.id)) continue; // Skip if already updated

      for (const plan1GB of plans1GB) {
        if (Math.abs(plan500.retail_price - plan1GB.retail_price) < 0.01) {
          // Found same price - make 500MB plan cheaper by at least $1
          const newPrice = roundToNinetyNine(plan500.retail_price - 1.01);

          updates.push({
            id: plan500.id,
            name: plan500.name,
            region_code: plan500.region_code,
            data_gb: plan500.data_gb,
            validity_days: plan500.validity_days,
            old_price: plan500.retail_price,
            new_price: newPrice,
            reason: `500MB plan same price as 1GB plan ($${plan1GB.retail_price.toFixed(2)})`
          });

          updatedPlanIds.add(plan500.id);
        }
      }
    }
  }

  // Special case: Indonesian 20GB plan
  const indonesian20GB = allPlans.find(p =>
    p.region_code === 'ID' &&
    p.data_gb === 20 &&
    p.validity_days === 30
  );

  if (indonesian20GB) {
    updates.push({
      id: indonesian20GB.id,
      name: indonesian20GB.name,
      region_code: indonesian20GB.region_code,
      data_gb: indonesian20GB.data_gb,
      validity_days: indonesian20GB.validity_days,
      old_price: indonesian20GB.retail_price,
      new_price: 24.99,
      reason: 'Special adjustment: Set Indonesian 20GB/30Days to $25'
    });
  }

  // Display planned updates
  if (updates.length === 0) {
    console.log('✅ No pricing anomalies to fix!');
    return;
  }

  console.log('\n📊 PLANNED UPDATES:');
  console.log('=' .repeat(100));

  // Group updates by region for display
  const updatesByRegion = new Map<string, PlanUpdate[]>();
  for (const update of updates) {
    if (!updatesByRegion.has(update.region_code)) {
      updatesByRegion.set(update.region_code, []);
    }
    updatesByRegion.get(update.region_code)!.push(update);
  }

  const regionNames: Record<string, string> = {
    AR: '🇦🇷 Argentina',
    BR: '🇧🇷 Brazil',
    CA: '🇨🇦 Canada',
    CO: '🇨🇴 Colombia',
    ID: '🇮🇩 Indonesia',
    IN: '🇮🇳 India',
    MX: '🇲🇽 Mexico',
    AZ: '🇦🇿 Azerbaijan',
    KH: '🇰🇭 Cambodia',
    KW: '🇰🇼 Kuwait',
    LK: '🇱🇰 Sri Lanka'
  };

  let totalUpdates = 0;
  let totalSavings = 0;

  for (const [region, regionUpdates] of updatesByRegion.entries()) {
    const regionName = regionNames[region] || region;
    console.log(`\n${regionName}`);
    console.log('-'.repeat(100));

    for (const update of regionUpdates) {
      const priceDiff = update.old_price - update.new_price;
      const percentChange = (priceDiff / update.old_price) * 100;

      console.log(`\n  📦 ${update.name}`);
      console.log(`     Data: ${update.data_gb}GB | Validity: ${update.validity_days} days`);
      console.log(`     Current Price: $${update.old_price.toFixed(2)}`);
      console.log(`     New Price:     $${update.new_price.toFixed(2)}`);
      console.log(`     Change:        -$${priceDiff.toFixed(2)} (${percentChange.toFixed(1)}% decrease)`);
      console.log(`     Reason:        ${update.reason}`);

      totalUpdates++;
      totalSavings += priceDiff;
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('📊 SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total plans to update: ${totalUpdates}`);
  console.log(`Average price reduction: $${(totalSavings / totalUpdates).toFixed(2)}`);
  console.log(`Affected regions: ${updatesByRegion.size}`);

  // Apply updates if not dry run
  if (!dryRun) {
    console.log('\n🚀 Applying updates...\n');

    for (const update of updates) {
      const { error } = await supabase
        .from('plans')
        .update({ retail_price: update.new_price })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Failed to update ${update.name}:`, error);
      } else {
        console.log(`✅ Updated ${update.name}: $${update.old_price.toFixed(2)} → $${update.new_price.toFixed(2)}`);
      }
    }

    console.log('\n✅ All updates completed successfully!');
  } else {
    console.log('\n⚠️  DRY RUN MODE - No changes were made');
    console.log('To apply these changes, run:');
    console.log('  npx tsx scripts/pricing/fix-pricing-anomalies.ts --apply');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const shouldApply = args.includes('--apply') || args.includes('--live');

// Run the script
fixPricingAnomalies(!shouldApply)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });