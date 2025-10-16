/**
 * Import eSIM Access Plans from CSV to Supabase
 *
 * Usage:
 *   npx tsx scripts/import-plans.ts path/to/plans.csv
 *
 * CSV Format Expected:
 *   name,region_code,data_gb,validity_days,supplier_sku,retail_price,currency
 *   USA 5GB - 7 Days,US,5,7,USA-5GB-7D,9.99,USD
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PlanRow {
  name: string;
  region_code: string;
  data_gb: number;
  validity_days: number;
  supplier_sku: string;
  retail_price: number;
  currency: string;
  is_active?: boolean;
}

/**
 * Parse CSV file into plan objects
 */
function parseCSV(csvPath: string): PlanRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must have header row and at least one data row');
  }

  const header = lines[0].split(',').map(h => h.trim());
  const plans: PlanRow[] = [];

  // Expected headers
  const requiredHeaders = ['name', 'region_code', 'data_gb', 'validity_days', 'supplier_sku', 'retail_price', 'currency'];
  const missingHeaders = requiredHeaders.filter(h => !header.includes(h));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map(v => v.trim());

    const plan: PlanRow = {
      name: values[header.indexOf('name')],
      region_code: values[header.indexOf('region_code')],
      data_gb: parseFloat(values[header.indexOf('data_gb')]),
      validity_days: parseInt(values[header.indexOf('validity_days')]),
      supplier_sku: values[header.indexOf('supplier_sku')],
      retail_price: parseFloat(values[header.indexOf('retail_price')]),
      currency: values[header.indexOf('currency')] || 'USD',
      is_active: header.includes('is_active')
        ? values[header.indexOf('is_active')].toLowerCase() === 'true'
        : true,
    };

    // Validation
    if (!plan.name || !plan.region_code || !plan.supplier_sku) {
      console.warn(`Skipping invalid row ${i + 1}: missing required fields`);
      continue;
    }

    if (isNaN(plan.data_gb) || isNaN(plan.validity_days) || isNaN(plan.retail_price)) {
      console.warn(`Skipping invalid row ${i + 1}: invalid numeric values`);
      continue;
    }

    plans.push(plan);
  }

  return plans;
}

/**
 * Import plans to Supabase
 */
async function importPlans(plans: PlanRow[]) {
  console.log(`Importing ${plans.length} plans to Supabase...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const plan of plans) {
    try {
      // Check if plan already exists by supplier_sku
      const { data: existing } = await supabase
        .from('plans')
        .select('id, supplier_sku')
        .eq('supplier_sku', plan.supplier_sku)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${plan.supplier_sku} - already exists`);
        skipped++;
        continue;
      }

      // Insert new plan
      const { error } = await supabase
        .from('plans')
        .insert(plan);

      if (error) {
        console.error(`❌ Error importing ${plan.supplier_sku}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Imported ${plan.supplier_sku} - ${plan.name}`);
        imported++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error importing ${plan.supplier_sku}:`, err);
      errors++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total processed: ${plans.length}`);
}

/**
 * Main execution
 */
async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import-plans.ts path/to/plans.csv');
    console.error('\nCSV Format:');
    console.error('name,region_code,data_gb,validity_days,supplier_sku,retail_price,currency');
    console.error('USA 5GB - 7 Days,US,5,7,USA-5GB-7D,9.99,USD');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  try {
    const plans = parseCSV(csvPath);
    console.log(`Parsed ${plans.length} plans from CSV\n`);

    await importPlans(plans);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
