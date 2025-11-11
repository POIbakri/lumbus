/**
 * Apply eSIM Access Variant Pricing
 *
 * - Reads CSV with "Variant Price" column
 * - Rounds all prices to .99 (e.g., $9.00 -> $8.99, $4.50 -> $4.99)
 * - Sets minimum price of $0.99
 * - Sets minimum price of $3.99 for 1GB plans
 * - Ensures logical price progression: more GB = higher price per country
 * - Filters out plans with < 500MB
 * - Updates existing plans
 * - Adds new plans that don't exist
 *
 * Usage:
 *   npx tsx scripts/apply-variant-pricing.ts "Price (2).csv" --dry-run
 *   npx tsx scripts/apply-variant-pricing.ts "Price (2).csv"
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

interface CSVPlan {
  type: string;
  region: string;
  name: string;
  dataType: string;
  priceUSD: number;
  variantPrice: number;
  code: string;
  gbs: number;
  validityDays: number;
  slug: string;
  coverage: string;
  id: string;
  billingStarts: string;
  preInstallDays: number;
  speed: string;
  supportTopUpType: string;
  breakoutIP: string;
}

/**
 * Round to .99 pricing
 */
function roundToNinetyNine(price: number, dataGb?: number): number {
  let finalPrice: number;

  if (price < 0.99) {
    finalPrice = 0.99; // Minimum price
  } else if (price < 1) {
    finalPrice = 0.99;
  } else {
    finalPrice = Math.floor(price) + 0.99;
  }

  // Enforce $3.99 minimum for 1GB plans
  if (dataGb && dataGb >= 0.9 && dataGb <= 1.1 && finalPrice < 3.99) {
    finalPrice = 3.99;
  }

  return finalPrice;
}

/**
 * Parse CSV
 */
function parseCSV(csvPath: string): CSVPlan[] {
  console.log('📄 Reading CSV file...\n');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV must have header row and data');
  }

  const header = lines[0].split(',').map(h => h.trim());
  console.log('📋 CSV Columns:', header.join(', '));
  console.log('');

  const plans: CSVPlan[] = [];
  let filtered = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    const gbs = parseFloat(values[7]);
    const variantPrice = parseFloat(values[5].replace('$', '').replace(',', ''));

    // Filter: Only plans with >= 500MB (0.5GB)
    if (gbs < 0.5) {
      filtered++;
      continue;
    }

    if (isNaN(variantPrice) || isNaN(gbs)) {
      console.warn(`⚠️  Skipping row ${i}: Invalid data`);
      continue;
    }

    plans.push({
      type: values[0],
      region: values[1],
      name: values[2],
      dataType: values[3],
      priceUSD: parseFloat(values[4].replace('$', '').replace(',', '')),
      variantPrice: variantPrice,
      code: values[6],
      gbs: gbs,
      validityDays: parseInt(values[8]),
      slug: values[9],
      coverage: values[10],
      id: values[11],
      billingStarts: values[12] || '',
      preInstallDays: parseInt(values[13]) || 0,
      speed: values[14] || '',
      supportTopUpType: values[15] || '',
      breakoutIP: values[16] || '',
    });
  }

  console.log(`✅ Parsed ${plans.length} plans from CSV`);
  console.log(`🚫 Filtered out ${filtered} plans with < 500MB\n`);

  return plans;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

/**
 * Fetch all existing plans
 */
async function fetchAllPlans() {
  const plans: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
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
 * Generate updates and inserts
 */
function generateChanges(csvPlans: CSVPlan[], dbPlans: any[]) {
  const updates: any[] = [];
  const inserts: any[] = [];
  const dbPlanMap = new Map(dbPlans.map(p => [p.supplier_sku, p]));

  for (const csvPlan of csvPlans) {
    const dbPlan = dbPlanMap.get(csvPlan.id);

    // Round variant price to .99 with 1GB minimum enforcement
    const retailPrice = roundToNinetyNine(csvPlan.variantPrice, csvPlan.gbs);

    if (dbPlan) {
      // Existing plan - check if price changed
      if (Math.abs(dbPlan.retail_price - retailPrice) > 0.01) {
        updates.push({
          id: dbPlan.id,
          sku: dbPlan.supplier_sku,
          name: dbPlan.name,
          region: dbPlan.region_code,
          data_gb: dbPlan.data_gb,
          validity_days: dbPlan.validity_days,
          old_price: dbPlan.retail_price,
          new_price: retailPrice,
          change: retailPrice - dbPlan.retail_price,
          change_percent: ((retailPrice - dbPlan.retail_price) / dbPlan.retail_price) * 100,
        });
      }
    } else {
      // New plan - add it
      inserts.push({
        name: csvPlan.name,
        region_code: csvPlan.code,
        data_gb: csvPlan.gbs,
        validity_days: csvPlan.validityDays,
        supplier_sku: csvPlan.id,
        retail_price: retailPrice,
        currency: 'USD',
        is_active: true,
      });
    }
  }

  return { updates, inserts };
}

/**
 * Enforce logical price progression per country
 * Rule: More GB = higher price (e.g., 1GB < 2GB < 3GB)
 */
function enforceLogicalPricing(updates: any[], inserts: any[], dbPlans: any[]) {
  // Combine all plans with their new prices
  const allPlansByRegion = new Map<string, any[]>();

  // Add database plans that aren't being updated
  const updatedIds = new Set(updates.map(u => u.id));
  for (const dbPlan of dbPlans) {
    if (!updatedIds.has(dbPlan.id)) {
      const region = dbPlan.region_code;
      if (!allPlansByRegion.has(region)) {
        allPlansByRegion.set(region, []);
      }
      allPlansByRegion.get(region)!.push({
        data_gb: dbPlan.data_gb,
        price: dbPlan.retail_price,
        source: 'db',
      });
    }
  }

  // Add updated plans with their new prices
  for (const update of updates) {
    const region = update.region;
    if (!allPlansByRegion.has(region)) {
      allPlansByRegion.set(region, []);
    }
    allPlansByRegion.get(region)!.push({
      data_gb: update.data_gb,
      price: update.new_price,
      source: 'update',
      updateRef: update,
    });
  }

  // Add new inserts
  for (const insert of inserts) {
    const region = insert.region_code;
    if (!allPlansByRegion.has(region)) {
      allPlansByRegion.set(region, []);
    }
    allPlansByRegion.get(region)!.push({
      data_gb: insert.data_gb,
      price: insert.retail_price,
      source: 'insert',
      insertRef: insert,
    });
  }

  // For each region, enforce price progression
  let adjustmentsMade = 0;

  for (const [region, plans] of allPlansByRegion) {
    // Group by unique GB amounts and find minimum price for each
    const gbTiers = new Map<number, number>();
    for (const plan of plans) {
      const currentMin = gbTiers.get(plan.data_gb) || Infinity;
      gbTiers.set(plan.data_gb, Math.min(currentMin, plan.price));
    }

    // Sort GB tiers in ascending order
    const sortedGbAmounts = Array.from(gbTiers.keys()).sort((a, b) => a - b);

    // Enforce progression: each tier must be more expensive than the previous
    for (let i = 1; i < sortedGbAmounts.length; i++) {
      const prevGb = sortedGbAmounts[i - 1];
      const currentGb = sortedGbAmounts[i];
      const prevMinPrice = gbTiers.get(prevGb)!;
      const currentMinPrice = gbTiers.get(currentGb)!;

      // If current tier is cheaper or equal to previous tier, adjust it
      if (currentMinPrice <= prevMinPrice) {
        const newMinPrice = Math.ceil(prevMinPrice) + 0.99;

        // Update all plans in this GB tier that are below the new minimum
        for (const plan of plans) {
          if (plan.data_gb === currentGb && plan.price < newMinPrice) {
            const oldPrice = plan.price;
            plan.price = newMinPrice;

            // Update the reference object
            if (plan.source === 'update' && plan.updateRef) {
              plan.updateRef.new_price = newMinPrice;
              plan.updateRef.change = newMinPrice - plan.updateRef.old_price;
              plan.updateRef.change_percent = ((newMinPrice - plan.updateRef.old_price) / plan.updateRef.old_price) * 100;
            } else if (plan.source === 'insert' && plan.insertRef) {
              plan.insertRef.retail_price = newMinPrice;
            }

            adjustmentsMade++;
            console.log(`  ⚠️  Adjusted ${region} ${currentGb}GB: $${oldPrice.toFixed(2)} → $${newMinPrice.toFixed(2)} (to maintain progression)`);
          }
        }

        // Update the tier price
        gbTiers.set(currentGb, newMinPrice);
      }
    }
  }

  if (adjustmentsMade > 0) {
    console.log(`\n✅ Made ${adjustmentsMade} price adjustments to enforce logical progression\n`);
  }
}

/**
 * Display summary
 */
function displaySummary(updates: any[], inserts: any[]) {
  console.log('\n💰 PRICING CHANGES SUMMARY\n');

  if (updates.length > 0) {
    console.log(`📝 Updates: ${updates.length} existing plans\n`);

    const increases = updates.filter(u => u.change > 0);
    const decreases = updates.filter(u => u.change < 0);

    console.log(`  Increases: ${increases.length}`);
    console.log(`  Decreases: ${decreases.length}`);

    const avgOldPrice = updates.reduce((sum, u) => sum + u.old_price, 0) / updates.length;
    const avgNewPrice = updates.reduce((sum, u) => sum + u.new_price, 0) / updates.length;

    console.log(`\n  Average Old: $${avgOldPrice.toFixed(2)}`);
    console.log(`  Average New: $${avgNewPrice.toFixed(2)}`);

    console.log('\n  Sample Updates (first 10):\n');
    updates.slice(0, 10).forEach((u, i) => {
      const arrow = u.change > 0 ? '⬆️' : '⬇️';
      console.log(`  ${i + 1}. ${u.name} (${u.region})`);
      console.log(`     ${arrow} $${u.old_price.toFixed(2)} → $${u.new_price.toFixed(2)} (${u.change_percent > 0 ? '+' : ''}${u.change_percent.toFixed(1)}%)`);
    });

    if (updates.length > 10) {
      console.log(`\n  ... and ${updates.length - 10} more updates`);
    }
  } else {
    console.log('✅ No price updates needed\n');
  }

  if (inserts.length > 0) {
    console.log(`\n✨ New Plans: ${inserts.length} plans to add\n`);

    console.log('  Sample New Plans (first 10):\n');
    inserts.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.region_code})`);
      console.log(`     ${p.data_gb}GB, ${p.validity_days}d - $${p.retail_price.toFixed(2)} - SKU: ${p.supplier_sku}`);
    });

    if (inserts.length > 10) {
      console.log(`\n  ... and ${inserts.length - 10} more new plans`);
    }
  } else {
    console.log('✅ No new plans to add\n');
  }
}

/**
 * Apply changes
 */
async function applyChanges(updates: any[], inserts: any[], dryRun: boolean) {
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes will be made\n');
    return;
  }

  console.log('\n💾 Applying changes to database...\n');

  // Apply updates
  if (updates.length > 0) {
    console.log('📝 Updating existing plans...');
    let updated = 0;
    let errors = 0;

    for (const update of updates) {
      const { error } = await supabase
        .from('plans')
        .update({ retail_price: update.new_price })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Error updating ${update.sku}:`, error.message);
        errors++;
      } else {
        updated++;
        if (updated % 50 === 0) {
          console.log(`   ✅ Updated ${updated}/${updates.length}...`);
        }
      }
    }

    console.log(`✅ Updated ${updated} plans`);
    if (errors > 0) {
      console.log(`❌ Failed: ${errors} plans`);
    }
  }

  // Apply inserts
  if (inserts.length > 0) {
    console.log('\n✨ Adding new plans...');
    let inserted = 0;
    let errors = 0;

    // Insert in batches of 100
    for (let i = 0; i < inserts.length; i += 100) {
      const batch = inserts.slice(i, i + 100);

      const { error } = await supabase
        .from('plans')
        .insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch:`, error.message);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`   ✅ Inserted ${inserted}/${inserts.length}...`);
      }
    }

    console.log(`✅ Inserted ${inserted} new plans`);
    if (errors > 0) {
      console.log(`❌ Failed: ${errors} plans`);
    }
  }
}

/**
 * Main
 */
async function main() {
  const csvPath = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');

  if (!csvPath) {
    console.error(`
Usage:
  npx tsx scripts/apply-variant-pricing.ts <csv-file> [--dry-run]

Examples:
  # Preview changes
  npx tsx scripts/apply-variant-pricing.ts "Price (2).csv" --dry-run

  # Apply changes
  npx tsx scripts/apply-variant-pricing.ts "Price (2).csv"
    `);
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  try {
    console.log('🚀 eSIM Access Variant Pricing Import\n');
    console.log('📋 Rules:');
    console.log('  - Round all prices to .99 (e.g., $9.00 → $8.99)');
    console.log('  - Minimum price: $0.99');
    console.log('  - Minimum price for 1GB plans: $3.99');
    console.log('  - Logical progression: More GB = Higher price (per country)');
    console.log('  - Filter: Only plans with >= 500MB');
    console.log('  - Update existing plans');
    console.log('  - Add new plans\n');

    // Parse CSV
    const csvPlans = parseCSV(csvPath);

    // Fetch database plans
    console.log('📥 Fetching existing plans from database...');
    const dbPlans = await fetchAllPlans();
    console.log(`✅ Loaded ${dbPlans.length} existing plans\n`);

    // Generate changes
    const { updates, inserts } = generateChanges(csvPlans, dbPlans);

    // Enforce logical pricing progression
    console.log('🔍 Enforcing logical price progression...\n');
    enforceLogicalPricing(updates, inserts, dbPlans);

    // Display summary
    displaySummary(updates, inserts);

    // Apply changes
    await applyChanges(updates, inserts, dryRun);

    if (!dryRun) {
      console.log('\n✅ All changes applied!');
      console.log('⚠️  API cache will clear in 5 minutes');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
