/**
 * Convert eSIM Access latest pricing CSV to retail pricing
 *
 * New CSV format with columns:
 * Type, Plan Category, Location Name, Plan Name, Price, GBs, Days, Pre-activation days,
 * SMS, Reloadable, Operators, Country Codes, Slug, PlanId, Activation, IP Route,
 * Cost Per GB, Daily GBs, Code, Price History
 */

import * as fs from 'fs';

interface LatestPlanRow {
  type: string;
  planCategory: string;
  locationName: string;
  planName: string;
  price: string;
  gbs: string;
  days: string;
  preActivationDays: string;
  sms: string;
  reloadable: string;
  operators: string;
  countryCodes: string;
  slug: string;
  planId: string;
  activation: string;
  ipRoute: string;
  costPerGB: string;
  dailyGBs: string;
  code: string;
  priceHistory: string;
}

interface RetailPlan {
  name: string;
  region_code: string;
  data_gb: number;
  validity_days: number;
  supplier_sku: string;
  wholesale_price: number;
  retail_price: number;
  currency: string;
  margin_percent: number;
}

/**
 * Parse new CSV format
 */
function parseLatestCSV(filePath: string): LatestPlanRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const rows: LatestPlanRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, but handle quoted values
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

    if (values.length < 14) {
      console.warn(`Skipping row ${i}: not enough columns`);
      continue;
    }

    rows.push({
      type: values[0],
      planCategory: values[1],
      locationName: values[2],
      planName: values[3],
      price: values[4],
      gbs: values[5],
      days: values[6],
      preActivationDays: values[7],
      sms: values[8],
      reloadable: values[9],
      operators: values[10],
      countryCodes: values[11],
      slug: values[12],
      planId: values[13],
      activation: values[14] || '',
      ipRoute: values[15] || '',
      costPerGB: values[16] || '',
      dailyGBs: values[17] || '',
      code: values[18] || '',
      priceHistory: values[19] || '',
    });
  }

  return rows;
}

/**
 * Calculate retail price with aggressive yet competitive strategy
 */
function calculateRetailPrice(wholesalePrice: number, dataGB: number, validityDays: number): number {
  let markup: number;

  // Estimate what Airalo would charge
  const estimatedAiralo = Math.max(
    4.50,
    (dataGB * 2.8) + (validityDays * 0.20) + 3.50
  );

  // Calculate aggressive markup
  if (wholesalePrice < 2) {
    markup = 4.5; // 350% margin
  } else if (wholesalePrice < 5) {
    markup = 4.0; // 300% margin
  } else if (wholesalePrice < 10) {
    markup = 3.5; // 250% margin
  } else if (wholesalePrice < 20) {
    markup = 3.0; // 200% margin
  } else {
    markup = 2.5; // 150% margin
  }

  let price = wholesalePrice * markup;

  // Ensure we're 5-15% cheaper than Airalo
  const maxPrice = estimatedAiralo * 0.90;
  if (price > maxPrice) {
    price = maxPrice;
  }

  // Ensure minimum margin of 100%
  const minPrice = wholesalePrice * 2.0;
  if (price < minPrice) {
    price = minPrice;
  }

  // Round to .99 pricing
  if (price < 1) {
    return Math.round(price * 100) / 100;
  } else if (price < 5) {
    return Math.floor(price) + 0.99;
  } else if (price < 10) {
    return Math.floor(price) + 0.99;
  } else {
    return Math.floor(price) + 0.99;
  }
}

/**
 * Convert to retail plans
 */
function convertToRetailPlans(rows: LatestPlanRow[]): RetailPlan[] {
  const plans: RetailPlan[] = [];

  for (const row of rows) {
    // Parse wholesale price
    const priceStr = row.price.replace('$', '').replace(',', '');
    const wholesalePrice = parseFloat(priceStr);

    if (isNaN(wholesalePrice) || wholesalePrice <= 0) {
      console.warn(`Skipping: invalid price - ${row.planName}`);
      continue;
    }

    // Parse data amount
    let dataGB = parseFloat(row.gbs);
    if (isNaN(dataGB) || dataGB === 0) {
      // Try daily GBs column
      const dailyGB = parseFloat(row.dailyGBs);
      if (!isNaN(dailyGB) && dailyGB > 0) {
        dataGB = dailyGB;
      } else {
        console.warn(`Skipping: cannot determine data amount - ${row.planName}`);
        continue;
      }
    }

    // Parse validity days
    const validityDays = parseInt(row.days);
    if (isNaN(validityDays) || validityDays <= 0) {
      console.warn(`Skipping: invalid validity - ${row.planName}`);
      continue;
    }

    // Get region code (use first country code if multi-country plan)
    let regionCode = row.code || row.countryCodes.split(',')[0].trim();
    if (!regionCode) {
      console.warn(`Skipping: no region code - ${row.planName}`);
      continue;
    }

    // For multi-country plans, use a special code
    if (row.type.includes('Multi')) {
      regionCode = row.code || 'GLOBAL';
    }

    // Calculate retail price
    const retailPrice = calculateRetailPrice(wholesalePrice, dataGB, validityDays);
    const marginPercent = Math.round(((retailPrice - wholesalePrice) / wholesalePrice) * 100);

    // Use the plan name as-is (it's already clean from eSIM Access)
    const planName = row.planName;

    plans.push({
      name: planName,
      region_code: regionCode,
      data_gb: dataGB,
      validity_days: validityDays,
      supplier_sku: row.planId,
      wholesale_price: wholesalePrice,
      retail_price: retailPrice,
      currency: 'USD',
      margin_percent: marginPercent,
    });
  }

  return plans;
}

/**
 * Write retail plans CSV
 */
function writeRetailCSV(plans: RetailPlan[], outputPath: string) {
  const lines = ['name,region_code,data_gb,validity_days,supplier_sku,retail_price,currency'];

  for (const plan of plans) {
    lines.push(
      `"${plan.name}",${plan.region_code},${plan.data_gb},${plan.validity_days},${plan.supplier_sku},${plan.retail_price.toFixed(2)},${plan.currency}`
    );
  }

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`\n✅ Wrote ${plans.length} plans to ${outputPath}`);
}

/**
 * Generate pricing summary
 */
function generateReport(plans: RetailPlan[]) {
  console.log('\n=== PRICING SUMMARY ===\n');

  const totalPlans = plans.length;
  const avgWholesale = plans.reduce((sum, p) => sum + p.wholesale_price, 0) / totalPlans;
  const avgRetail = plans.reduce((sum, p) => sum + p.retail_price, 0) / totalPlans;
  const avgMargin = plans.reduce((sum, p) => sum + p.margin_percent, 0) / totalPlans;

  console.log(`Total Plans: ${totalPlans}`);
  console.log(`Average Wholesale: $${avgWholesale.toFixed(2)}`);
  console.log(`Average Retail: $${avgRetail.toFixed(2)}`);
  console.log(`Average Margin: ${avgMargin.toFixed(0)}%`);

  // Count 300%+ margins
  const high300Plus = plans.filter(p => p.margin_percent >= 300).length;
  const high200to300 = plans.filter(p => p.margin_percent >= 200 && p.margin_percent < 300).length;
  const high100to200 = plans.filter(p => p.margin_percent >= 100 && p.margin_percent < 200).length;

  console.log(`\nMargin Distribution:`);
  console.log(`  300%+ margins: ${high300Plus} plans (${((high300Plus / totalPlans) * 100).toFixed(1)}%)`);
  console.log(`  200-300% margins: ${high200to300} plans (${((high200to300 / totalPlans) * 100).toFixed(1)}%)`);
  console.log(`  100-200% margins: ${high100to200} plans (${((high100to200 / totalPlans) * 100).toFixed(1)}%)`);

  // Show sample plans
  console.log('\nSample Plans (vs Airalo estimate):');
  const samples = plans.filter(p => p.region_code === 'US' || p.region_code.includes('US')).slice(0, 10);

  if (samples.length === 0) {
    // Fallback to first 10 plans
    samples.push(...plans.slice(0, 10));
  }

  for (const plan of samples) {
    const estimatedAiralo = Math.max(
      4.50,
      (plan.data_gb * 2.8) + (plan.validity_days * 0.20) + 3.50
    );
    const savingsVsAiralo = ((estimatedAiralo - plan.retail_price) / estimatedAiralo * 100).toFixed(0);

    console.log(`  ${plan.name}`);
    console.log(`    Wholesale: $${plan.wholesale_price.toFixed(2)} → Your Price: $${plan.retail_price.toFixed(2)} (${plan.margin_percent}% margin)`);
    console.log(`    Est. Airalo: $${estimatedAiralo.toFixed(2)} → Savings: ${savingsVsAiralo}%`);
  }
}

/**
 * Main execution
 */
function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile || !outputFile) {
    console.error('Usage: npx tsx scripts/convert-latest-pricing.ts input.csv output.csv');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('📊 Converting eSIM Access pricing to retail...\n');
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}\n`);

  const rows = parseLatestCSV(inputFile);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const plans = convertToRetailPlans(rows);
  console.log(`Converted ${plans.length} valid plans`);

  generateReport(plans);
  writeRetailCSV(plans, outputFile);

  console.log('\n✅ Done! Next steps:');
  console.log(`   1. Review the pricing in: ${outputFile}`);
  console.log(`   2. Import to Supabase: npx tsx scripts/import-plans.ts ${outputFile}`);
}

main();
