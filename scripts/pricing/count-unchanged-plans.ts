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
  const csvPath = process.argv[2] || 'Price (2).csv';
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  const csvSkus = new Set();
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const gbs = parseFloat(values[7]);
    if (gbs >= 0.5) {
      csvSkus.add(values[11]); // ID column
    }
  }

  // Fetch all plans with pagination
  const allPlans: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('plans')
      .select('supplier_sku, data_gb, retail_price')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allPlans.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  let notInCsv = 0;
  let under500mb = 0;

  for (const plan of allPlans) {
    if (!csvSkus.has(plan.supplier_sku)) {
      notInCsv++;
      if (plan.data_gb < 0.5) {
        under500mb++;
      }
    }
  }

  const totalUnchanged = allPlans.length - 950;
  const noPriceChange = totalUnchanged - notInCsv;

  console.log(`\n📊 Breakdown of ${totalUnchanged} unchanged plans:\n`);
  console.log(`1️⃣  Not in CSV: ${notInCsv} plans`);
  console.log(`   - Plans < 500MB: ${under500mb} plans`);
  console.log(`   - Other (discontinued/custom): ${notInCsv - under500mb} plans`);
  console.log(`\n2️⃣  No price change: ${noPriceChange} plans`);
  console.log(`   (In CSV but calculated price = current price)`);
  console.log(`\n3️⃣  Plans < 500MB in DB: ${under500mb} plans`);
  console.log(`   (These are part of "Not in CSV" since CSV filtered them out)\n`);
}

main();
