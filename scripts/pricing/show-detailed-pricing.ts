import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

function roundToNinetyNine(price: number, dataGb?: number): number {
  let finalPrice: number;
  if (price < 0.99) finalPrice = 0.99;
  else if (price < 1) finalPrice = 0.99;
  else finalPrice = Math.floor(price) + 0.99;

  if (dataGb && dataGb >= 0.9 && dataGb <= 1.1 && finalPrice < 3.99) {
    finalPrice = 3.99;
  }
  return finalPrice;
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

async function main() {
  const regions = ['TR', 'US', 'AE', 'GB', 'JP', 'FR'];
  const csvPath = process.argv[2] || 'Price (2).csv';

  // Parse CSV
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  const csvPlans = new Map();
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const code = values[6];
    const gbs = parseFloat(values[7]);
    const variantPrice = parseFloat(values[5].replace('$', '').replace(',', ''));
    const id = values[11];

    if (gbs >= 0.5 && !isNaN(variantPrice)) {
      csvPlans.set(id, {
        code: code,
        gbs: gbs,
        variantPrice: variantPrice,
      });
    }
  }

  for (const region of regions) {
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('region_code', region)
      .eq('is_active', true)
      .order('data_gb', { ascending: true })
      .order('validity_days', { ascending: true });

    if (!plans || plans.length === 0) continue;

    const regionNames: any = {
      TR: '🇹🇷 Turkey',
      US: '🇺🇸 United States',
      AE: '🇦🇪 UAE',
      GB: '🇬🇧 United Kingdom',
      JP: '🇯🇵 Japan',
      FR: '🇫🇷 France'
    };

    console.log(`\n${'='.repeat(100)}`);
    console.log(`${regionNames[region]}`);
    console.log(`${'='.repeat(100)}\n`);

    // First pass: calculate base prices from CSV
    const planPrices = new Map();
    for (const plan of plans) {
      const csvPlan = csvPlans.get(plan.supplier_sku);
      if (!csvPlan) {
        planPrices.set(plan.id, plan.retail_price);
        continue;
      }
      const newPrice = roundToNinetyNine(csvPlan.variantPrice, plan.data_gb);
      planPrices.set(plan.id, newPrice);
    }

    // Second pass: apply logical progression per GB tier
    const pricesByGb = new Map();
    for (const plan of plans) {
      const currentPrice = planPrices.get(plan.id);
      const existingMin = pricesByGb.get(plan.data_gb) || Infinity;
      pricesByGb.set(plan.data_gb, Math.min(existingMin, currentPrice));
    }

    // Enforce progression
    const sortedGbs = Array.from(pricesByGb.keys()).sort((a, b) => a - b);
    for (let i = 1; i < sortedGbs.length; i++) {
      const prevGb = sortedGbs[i - 1];
      const currentGb = sortedGbs[i];
      const prevPrice = pricesByGb.get(prevGb)!;
      const currentPrice = pricesByGb.get(currentGb)!;

      if (currentPrice <= prevPrice) {
        const adjusted = Math.ceil(prevPrice) + 0.99;
        pricesByGb.set(currentGb, adjusted);
      }
    }

    // Update plan prices with logical progression
    for (const plan of plans) {
      const minPriceForGb = pricesByGb.get(plan.data_gb);
      const currentPrice = planPrices.get(plan.id);
      if (currentPrice < minPriceForGb) {
        planPrices.set(plan.id, minPriceForGb);
      }
    }

    // Display all plans in table format
    console.log('Plan Name'.padEnd(50) + ' | Data    | Days | Current  | New      | Change   | %');
    console.log('-'.repeat(100));

    for (const plan of plans) {
      const newPrice = planPrices.get(plan.id);
      const oldPrice = plan.retail_price;
      const csvPlan = csvPlans.get(plan.supplier_sku);

      const planName = plan.name.length > 48 ? plan.name.substring(0, 45) + '...' : plan.name;
      const dataStr = `${plan.data_gb}GB`.padStart(7);
      const daysStr = `${plan.validity_days}d`.padStart(4);
      const oldPriceStr = `$${oldPrice.toFixed(2)}`.padStart(8);
      const newPriceStr = `$${newPrice.toFixed(2)}`.padStart(8);

      if (!csvPlan) {
        console.log(
          planName.padEnd(50) + ' | ' +
          dataStr + ' | ' +
          daysStr + ' | ' +
          oldPriceStr + ' | ' +
          'N/A'.padStart(8) + ' | ' +
          'Not in CSV'.padEnd(8) + ' | '
        );
        continue;
      }

      const change = newPrice - oldPrice;
      const changePercent = (change / oldPrice) * 100;
      const arrow = change > 0 ? '⬆️' : change < 0 ? '⬇️' : '➡️';
      const changeStr = `${change > 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`.padStart(8);
      const percentStr = `${arrow} ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(0)}%`;

      console.log(
        planName.padEnd(50) + ' | ' +
        dataStr + ' | ' +
        daysStr + ' | ' +
        oldPriceStr + ' | ' +
        newPriceStr + ' | ' +
        changeStr + ' | ' +
        percentStr
      );
    }

    console.log('\n');
  }
}

main().catch(console.error);
