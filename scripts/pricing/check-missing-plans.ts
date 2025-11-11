import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

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

async function main() {
  // Parse new CSV (Price (2).csv)
  const newCsvPath = 'Price (2).csv';
  const newContent = fs.readFileSync(newCsvPath, 'utf-8');
  const newLines = newContent.trim().split('\n');

  const newCsvSkus = new Set();
  for (let i = 1; i < newLines.length; i++) {
    const values = parseCSVLine(newLines[i]);
    const gbs = parseFloat(values[7]);
    if (gbs >= 0.5) {
      newCsvSkus.add(values[11]); // ID column
    }
  }

  // Parse old CSV (lumbus-final-pricing.csv)
  const oldCsvPath = 'lumbus-final-pricing.csv';
  const oldContent = fs.readFileSync(oldCsvPath, 'utf-8');
  const oldLines = oldContent.trim().split('\n');

  const oldCsvSkus = new Set();
  const oldCsvData = new Map();
  for (let i = 1; i < oldLines.length; i++) {
    const values = parseCSVLine(oldLines[i]);
    const sku = values[11] || values[0]; // Try ID column or first column
    if (sku) {
      oldCsvSkus.add(sku);
      oldCsvData.set(sku, {
        name: values[2] || values[1],
        gbs: parseFloat(values[7]) || 0
      });
    }
  }

  // Fetch all plans with pagination
  const allPlans: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('plans')
      .select('supplier_sku, name, data_gb, retail_price, region_code')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allPlans.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Find plans not in new CSV
  const notInNewCsv: any[] = [];
  for (const plan of allPlans) {
    if (!newCsvSkus.has(plan.supplier_sku) && plan.data_gb >= 0.5) {
      notInNewCsv.push(plan);
    }
  }

  // Categorize these plans
  const inOldCsv: any[] = [];
  const notInEitherCsv: any[] = [];

  for (const plan of notInNewCsv) {
    if (oldCsvSkus.has(plan.supplier_sku)) {
      inOldCsv.push(plan);
    } else {
      notInEitherCsv.push(plan);
    }
  }

  console.log(`\n📊 Analysis of 214 "other" plans (>= 500MB, not in new CSV):\n`);

  console.log(`✅ In old CSV (lumbus-final-pricing.csv): ${inOldCsv.length} plans`);
  console.log(`   These existed in your original file but eSIM Access no longer offers them\n`);

  if (inOldCsv.length > 0) {
    console.log(`   Sample (first 10):`);
    inOldCsv.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.region_code}) - ${p.data_gb}GB - $${p.retail_price.toFixed(2)} - SKU: ${p.supplier_sku}`);
    });
    if (inOldCsv.length > 10) {
      console.log(`   ... and ${inOldCsv.length - 10} more`);
    }
  }

  console.log(`\n❌ Not in either CSV: ${notInEitherCsv.length} plans`);
  console.log(`   These might be custom plans or very old discontinued plans\n`);

  if (notInEitherCsv.length > 0) {
    console.log(`   Sample (first 10):`);
    notInEitherCsv.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.region_code}) - ${p.data_gb}GB - $${p.retail_price.toFixed(2)} - SKU: ${p.supplier_sku}`);
    });
    if (notInEitherCsv.length > 10) {
      console.log(`   ... and ${notInEitherCsv.length - 10} more`);
    }
  }

  console.log(`\n📌 Summary:`);
  console.log(`   Total plans >= 500MB not in new CSV: ${notInNewCsv.length}`);
  console.log(`   - Were in old CSV: ${inOldCsv.length}`);
  console.log(`   - Never in either CSV: ${notInEitherCsv.length}\n`);
}

main();
