/**
 * Deactivate Duplicate Data Plans
 *
 * Finds plans with:
 * - Same data amount (GB/MB)
 * - Same region
 * - Same price
 * - Different validity days
 *
 * Deactivates the plan with fewer days, keeping the one with more days active.
 *
 * Usage:
 *   npx tsx scripts/deactivate-duplicate-data-plans.ts --dry-run
 *   npx tsx scripts/deactivate-duplicate-data-plans.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Plan {
  id: string;
  name: string;
  region_code: string;
  data_gb: number;
  validity_days: number;
  supplier_sku: string;
  retail_price: number;
  currency: string;
  is_active: boolean;
}

/**
 * Fetch all plans from database
 */
async function fetchAllPlans(): Promise<Plan[]> {
  console.log('📥 Fetching all plans from database...\n');

  const plans: Plan[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('❌ Error fetching plans:', error);
      throw error;
    }

    if (!data || data.length === 0) break;

    plans.push(...data);
    console.log(`   Fetched ${plans.length} plans so far...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`✅ Loaded ${plans.length} total plans\n`);
  return plans;
}

/**
 * Find duplicate plans by region, data amount, and price
 */
function findDuplicatePlans(plans: Plan[]) {
  console.log('🔍 Analyzing plans for duplicates...\n');

  // Group plans by region + data_gb + price
  const groups = new Map<string, Plan[]>();

  for (const plan of plans) {
    // Create a key: region_code|data_gb|price
    const key = `${plan.region_code}|${plan.data_gb}|${plan.retail_price.toFixed(2)}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(plan);
  }

  // Find groups with multiple plans (duplicates)
  const duplicateGroups: Plan[][] = [];

  for (const [key, groupPlans] of groups) {
    if (groupPlans.length > 1) {
      // Sort by validity_days descending (most days first)
      groupPlans.sort((a, b) => b.validity_days - a.validity_days);
      duplicateGroups.push(groupPlans);
    }
  }

  return duplicateGroups;
}

/**
 * Determine which plans to deactivate
 */
function determineDeactivations(duplicateGroups: Plan[][]) {
  const toDeactivate: Array<{
    plan: Plan;
    reason: string;
    keepingPlan: Plan;
  }> = [];

  for (const group of duplicateGroups) {
    // Sort by validity_days descending
    const sorted = [...group].sort((a, b) => b.validity_days - a.validity_days);

    // Keep the one with most days, deactivate the rest
    const [keepPlan, ...deactivatePlans] = sorted;

    for (const plan of deactivatePlans) {
      toDeactivate.push({
        plan,
        reason: `Same data (${plan.data_gb}GB) and price ($${plan.retail_price.toFixed(2)}) as plan with ${keepPlan.validity_days} days`,
        keepingPlan: keepPlan,
      });
    }
  }

  return toDeactivate;
}

/**
 * Display summary of changes
 */
function displaySummary(toDeactivate: Array<{ plan: Plan; reason: string; keepingPlan: Plan }>) {
  console.log('\n📊 DEACTIVATION SUMMARY\n');
  console.log(`Found ${toDeactivate.length} plans to deactivate\n`);

  if (toDeactivate.length === 0) {
    console.log('✅ No duplicate plans found!\n');
    return;
  }

  // Group by region for easier reading
  const byRegion = new Map<string, typeof toDeactivate>();

  for (const item of toDeactivate) {
    const region = item.plan.region_code;
    if (!byRegion.has(region)) {
      byRegion.set(region, []);
    }
    byRegion.get(region)!.push(item);
  }

  // Display by region
  for (const [region, items] of byRegion) {
    console.log(`\n🌍 ${region} (${items.length} plans to deactivate):\n`);

    for (const item of items) {
      console.log(`  ❌ DEACTIVATE: ${item.plan.name}`);
      console.log(`     SKU: ${item.plan.supplier_sku}`);
      console.log(`     Data: ${item.plan.data_gb}GB | Days: ${item.plan.validity_days} | Price: $${item.plan.retail_price.toFixed(2)}`);
      console.log(`     Currently: ${item.plan.is_active ? '🟢 Active' : '🔴 Inactive'}`);
      console.log(`\n  ✅ KEEPING: ${item.keepingPlan.name}`);
      console.log(`     SKU: ${item.keepingPlan.supplier_sku}`);
      console.log(`     Data: ${item.keepingPlan.data_gb}GB | Days: ${item.keepingPlan.validity_days} | Price: $${item.keepingPlan.retail_price.toFixed(2)}`);
      console.log(`     Reason: More days (${item.keepingPlan.validity_days} vs ${item.plan.validity_days})`);
      console.log('');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Total plans to deactivate: ${toDeactivate.length}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Apply deactivations to database
 */
async function applyDeactivations(
  toDeactivate: Array<{ plan: Plan; reason: string; keepingPlan: Plan }>,
  dryRun: boolean
) {
  if (dryRun) {
    console.log('🔍 DRY RUN - No changes will be made to the database\n');
    console.log('Run without --dry-run to apply these changes.\n');
    return;
  }

  if (toDeactivate.length === 0) {
    return;
  }

  console.log('💾 Applying deactivations to database...\n');

  let success = 0;
  let errors = 0;
  let alreadyInactive = 0;

  for (const item of toDeactivate) {
    // Skip if already inactive
    if (!item.plan.is_active) {
      alreadyInactive++;
      console.log(`⏭️  Skipping ${item.plan.supplier_sku} - already inactive`);
      continue;
    }

    const { error } = await supabase
      .from('plans')
      .update({ is_active: false })
      .eq('id', item.plan.id);

    if (error) {
      console.error(`❌ Error deactivating ${item.plan.supplier_sku}:`, error.message);
      errors++;
    } else {
      console.log(`✅ Deactivated ${item.plan.supplier_sku} (${item.plan.name})`);
      success++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS:');
  console.log(`  ✅ Successfully deactivated: ${success}`);
  console.log(`  ⏭️  Already inactive: ${alreadyInactive}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log(`  📊 Total processed: ${toDeactivate.length}`);
  console.log('='.repeat(80) + '\n');

  if (success > 0) {
    console.log('✅ Changes applied successfully!');
    console.log('⚠️  API cache will clear in 5 minutes\n');
  }
}

/**
 * Main execution
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  try {
    console.log('🚀 Deactivate Duplicate Data Plans\n');
    console.log('📋 Rules:');
    console.log('  - Find plans with same region, data amount (GB), and price');
    console.log('  - Keep the plan with MORE validity days');
    console.log('  - Deactivate plans with FEWER validity days');
    console.log('');

    // Fetch all plans
    const plans = await fetchAllPlans();

    // Find duplicates
    const duplicateGroups = findDuplicatePlans(plans);
    console.log(`Found ${duplicateGroups.length} groups of duplicate plans\n`);

    // Determine what to deactivate
    const toDeactivate = determineDeactivations(duplicateGroups);

    // Display summary
    displaySummary(toDeactivate);

    // Apply changes
    await applyDeactivations(toDeactivate, dryRun);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
