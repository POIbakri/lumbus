/**
 * Update is_reloadable status for existing plans
 *
 * Reads the Price (2).csv file and updates plans in the database
 * with their correct reloadable status.
 *
 * Usage:
 *   npx tsx scripts/update-reloadable-status.ts --dry-run   # Preview changes
 *   npx tsx scripts/update-reloadable-status.ts             # Apply changes
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse the CSV file and extract reloadable status by supplier_sku
 */
function parseCSVForReloadable(csvPath: string): Map<string, boolean> {
  console.log('📄 Reading CSV file...\n');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  const reloadableMap = new Map<string, boolean>();

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Column 11 = ID (supplier_sku), Column 15 = Support TopUp Type
    const supplierSku = values[11];
    const topUpType = values[15];

    // Skip invalid entries (IDs that contain commas are likely parsing errors)
    if (!supplierSku || supplierSku.length < 3 || supplierSku.includes(',')) {
      continue;
    }

    // Check if reloadable
    const isReloadable = topUpType ? topUpType.includes('Reloadable') : false;
    reloadableMap.set(supplierSku, isReloadable);
  }

  console.log(`✅ Parsed ${reloadableMap.size} plans from CSV\n`);

  // Count reloadable vs non-reloadable
  let reloadableCount = 0;
  let nonReloadableCount = 0;
  for (const isReloadable of reloadableMap.values()) {
    if (isReloadable) reloadableCount++;
    else nonReloadableCount++;
  }

  console.log(`📊 Statistics:`);
  console.log(`   Reloadable: ${reloadableCount}`);
  console.log(`   Non-reloadable: ${nonReloadableCount}\n`);

  return reloadableMap;
}

/**
 * Fetch all plans from the database
 */
async function fetchAllPlans(): Promise<Array<{ id: string; supplier_sku: string; name: string; is_reloadable: boolean | null }>> {
  const plans: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('plans')
      .select('id, supplier_sku, name, is_reloadable')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    plans.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return plans;
}

/**
 * Main function
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const csvPath = 'Price (2).csv';

  console.log('🚀 Update Plans Reloadable Status\n');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  // Parse CSV
  const reloadableMap = parseCSVForReloadable(csvPath);

  // Fetch database plans
  console.log('📥 Fetching existing plans from database...');
  const dbPlans = await fetchAllPlans();
  console.log(`✅ Found ${dbPlans.length} plans in database\n`);

  // Determine updates needed
  const updates: Array<{ id: string; sku: string; name: string; currentValue: boolean | null; newValue: boolean }> = [];
  const notFound: string[] = [];

  for (const plan of dbPlans) {
    if (reloadableMap.has(plan.supplier_sku)) {
      const newValue = reloadableMap.get(plan.supplier_sku)!;

      // Only update if value is different or null
      if (plan.is_reloadable !== newValue) {
        updates.push({
          id: plan.id,
          sku: plan.supplier_sku,
          name: plan.name,
          currentValue: plan.is_reloadable,
          newValue: newValue,
        });
      }
    } else {
      notFound.push(plan.supplier_sku);
    }
  }

  // Display summary
  console.log('📊 Update Summary:\n');
  console.log(`   Plans to update: ${updates.length}`);
  console.log(`   Plans not in CSV: ${notFound.length}`);

  if (updates.length > 0) {
    console.log('\n📝 Changes to apply:\n');

    const toReloadable = updates.filter(u => u.newValue === true);
    const toNonReloadable = updates.filter(u => u.newValue === false);

    console.log(`   Setting to reloadable: ${toReloadable.length}`);
    console.log(`   Setting to non-reloadable: ${toNonReloadable.length}`);

    // Show sample of non-reloadable plans
    if (toNonReloadable.length > 0) {
      console.log('\n   Sample non-reloadable plans:');
      toNonReloadable.slice(0, 10).forEach(p => {
        console.log(`     - ${p.name} (${p.sku})`);
      });
      if (toNonReloadable.length > 10) {
        console.log(`     ... and ${toNonReloadable.length - 10} more`);
      }
    }
  }

  if (notFound.length > 0 && notFound.length <= 20) {
    console.log('\n⚠️  Plans not found in CSV (will keep default true):');
    notFound.forEach(sku => console.log(`     - ${sku}`));
  } else if (notFound.length > 20) {
    console.log(`\n⚠️  ${notFound.length} plans not found in CSV (will keep default true)`);
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes applied');
    console.log('   Run without --dry-run to apply changes\n');
    return;
  }

  if (updates.length === 0) {
    console.log('\n✅ No updates needed - all plans already have correct values\n');
    return;
  }

  // Apply updates
  console.log('\n💾 Applying updates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from('plans')
      .update({ is_reloadable: update.newValue })
      .eq('id', update.id);

    if (error) {
      console.error(`   ❌ Failed to update ${update.sku}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`   ✅ Updated ${successCount}/${updates.length}...`);
      }
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Successfully updated: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   Failed: ${errorCount}`);
  }
}

main().catch(console.error);
