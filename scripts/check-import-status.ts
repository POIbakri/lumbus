/**
 * Check how many plans successfully imported to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface CSVPlan {
  name: string;
  region_code: string;
  data_gb: number;
  validity_days: number;
  supplier_sku: string;
  retail_price: number;
  currency: string;
}

function parseCSV(filePath: string): CSVPlan[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const plans: CSVPlan[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
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

    if (values.length >= 7) {
      plans.push({
        name: values[0],
        region_code: values[1],
        data_gb: parseFloat(values[2]),
        validity_days: parseInt(values[3]),
        supplier_sku: values[4],
        retail_price: parseFloat(values[5]),
        currency: values[6],
      });
    }
  }

  return plans;
}

async function checkImportStatus() {
  console.log('📊 Checking import status...\n');

  // Get total plans in CSV
  const csvPlans = parseCSV('lumbus-final-pricing.csv');
  console.log(`Total plans in CSV: ${csvPlans.length}`);

  // Get total plans in database
  const { count: dbCount, error: countError } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting database plans:', countError);
    return;
  }

  console.log(`Total plans in database: ${dbCount}\n`);

  // Check which plans are missing (fetch all with pagination)
  const dbPlans: Array<{ supplier_sku: string }> = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error: fetchError } = await supabase
      .from('plans')
      .select('supplier_sku')
      .range(from, from + pageSize - 1);

    if (fetchError) {
      console.error('Error fetching database plans:', fetchError);
      break;
    }

    if (!data || data.length === 0) break;
    dbPlans.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Fetched ${dbPlans.length} plans from database\n`);

  const dbSkus = new Set(dbPlans.map(p => p.supplier_sku));
  const missingPlans = csvPlans.filter(p => !dbSkus.has(p.supplier_sku));

  console.log(`✅ Successfully imported: ${csvPlans.length - missingPlans.length}`);
  console.log(`❌ Failed to import: ${missingPlans.length}\n`);

  if (missingPlans.length > 0) {
    console.log('Missing plans:');
    for (const plan of missingPlans.slice(0, 10)) {
      console.log(`  - ${plan.supplier_sku}: ${plan.name} (${plan.region_code})`);
    }
    if (missingPlans.length > 10) {
      console.log(`  ... and ${missingPlans.length - 10} more`);
    }
  }

  // Check by region
  console.log('\n📍 Plans by region:');
  const regionCounts = new Map<string, number>();

  for (const plan of csvPlans) {
    const count = regionCounts.get(plan.region_code) || 0;
    regionCounts.set(plan.region_code, count + 1);
  }

  const sortedRegions = Array.from(regionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  for (const [region, count] of sortedRegions) {
    console.log(`  ${region}: ${count} plans`);
  }
}

checkImportStatus();
