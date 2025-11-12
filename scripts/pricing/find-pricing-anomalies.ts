import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

interface PlanInfo {
  id: string;
  name: string;
  data_gb: number;
  retail_price: number;
  validity_days: number;
  supplier_sku: string;
}

interface Anomaly {
  region: string;
  price: number;
  lowerDataPlan: PlanInfo;
  higherDataPlan: PlanInfo;
}

async function findPricingAnomalies() {
  console.log('\n🔍 Finding Pricing Anomalies: Plans with lower data at the same price as higher data plans\n');
  console.log('=' .repeat(100));

  // Fetch all active plans
  const { data: allPlans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('region_code', { ascending: true })
    .order('data_gb', { ascending: true })
    .order('validity_days', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }

  if (!allPlans || allPlans.length === 0) {
    console.log('No active plans found');
    return;
  }

  // Group plans by region
  const plansByRegion = new Map<string, PlanInfo[]>();

  for (const plan of allPlans) {
    const region = plan.region_code;
    if (!plansByRegion.has(region)) {
      plansByRegion.set(region, []);
    }
    plansByRegion.get(region)!.push({
      id: plan.id,
      name: plan.name,
      data_gb: plan.data_gb,
      retail_price: plan.retail_price,
      validity_days: plan.validity_days,
      supplier_sku: plan.supplier_sku
    });
  }

  const regionNames: Record<string, string> = {
    TR: '🇹🇷 Turkey',
    US: '🇺🇸 United States',
    AE: '🇦🇪 UAE',
    GB: '🇬🇧 United Kingdom',
    JP: '🇯🇵 Japan',
    FR: '🇫🇷 France',
    DE: '🇩🇪 Germany',
    IT: '🇮🇹 Italy',
    ES: '🇪🇸 Spain',
    CA: '🇨🇦 Canada',
    AU: '🇦🇺 Australia',
    IN: '🇮🇳 India',
    CN: '🇨🇳 China',
    KR: '🇰🇷 South Korea',
    BR: '🇧🇷 Brazil',
    MX: '🇲🇽 Mexico',
    SG: '🇸🇬 Singapore',
    MY: '🇲🇾 Malaysia',
    TH: '🇹🇭 Thailand',
    ID: '🇮🇩 Indonesia',
    PH: '🇵🇭 Philippines',
    VN: '🇻🇳 Vietnam',
    SA: '🇸🇦 Saudi Arabia',
    EG: '🇪🇬 Egypt',
    ZA: '🇿🇦 South Africa',
    NG: '🇳🇬 Nigeria',
    AR: '🇦🇷 Argentina',
    CL: '🇨🇱 Chile',
    CO: '🇨🇴 Colombia',
    PE: '🇵🇪 Peru',
    PL: '🇵🇱 Poland',
    RU: '🇷🇺 Russia',
    NL: '🇳🇱 Netherlands',
    BE: '🇧🇪 Belgium',
    SE: '🇸🇪 Sweden',
    NO: '🇳🇴 Norway',
    DK: '🇩🇰 Denmark',
    FI: '🇫🇮 Finland',
    PT: '🇵🇹 Portugal',
    GR: '🇬🇷 Greece',
    IE: '🇮🇪 Ireland',
    CH: '🇨🇭 Switzerland',
    AT: '🇦🇹 Austria',
    CZ: '🇨🇿 Czech Republic',
    HU: '🇭🇺 Hungary',
    RO: '🇷🇴 Romania',
    IL: '🇮🇱 Israel',
    NZ: '🇳🇿 New Zealand',
    HK: '🇭🇰 Hong Kong',
    TW: '🇹🇼 Taiwan'
  };

  const allAnomalies: Anomaly[] = [];
  let totalAnomalies = 0;

  // Find anomalies for each region
  for (const [region, plans] of plansByRegion.entries()) {
    const regionAnomalies: Anomaly[] = [];

    // Create a map of prices to plans
    const priceToPlans = new Map<number, PlanInfo[]>();

    for (const plan of plans) {
      const price = plan.retail_price;
      if (!priceToPlans.has(price)) {
        priceToPlans.set(price, []);
      }
      priceToPlans.get(price)!.push(plan);
    }

    // Check for anomalies: same price but different data amounts
    for (const [price, plansAtPrice] of priceToPlans.entries()) {
      if (plansAtPrice.length < 2) continue;

      // Sort plans by data amount
      plansAtPrice.sort((a, b) => a.data_gb - b.data_gb);

      // Check if there are different data amounts at the same price
      const uniqueDataAmounts = new Set(plansAtPrice.map(p => p.data_gb));

      if (uniqueDataAmounts.size > 1) {
        // We have an anomaly - different data amounts at the same price
        // Find all pairs where lower data = same price as higher data
        for (let i = 0; i < plansAtPrice.length - 1; i++) {
          for (let j = i + 1; j < plansAtPrice.length; j++) {
            if (plansAtPrice[i].data_gb < plansAtPrice[j].data_gb) {
              regionAnomalies.push({
                region,
                price,
                lowerDataPlan: plansAtPrice[i],
                higherDataPlan: plansAtPrice[j]
              });
            }
          }
        }
      }
    }

    // Display anomalies for this region
    if (regionAnomalies.length > 0) {
      const regionName = regionNames[region] || region;
      console.log(`\n${regionName}`);
      console.log('-'.repeat(100));

      // Sort anomalies by price
      regionAnomalies.sort((a, b) => a.price - b.price);

      for (const anomaly of regionAnomalies) {
        console.log(`\n  💰 Price: $${anomaly.price.toFixed(2)}`);
        console.log(`  ⚠️  Lower data plan:  ${anomaly.lowerDataPlan.data_gb}GB for ${anomaly.lowerDataPlan.validity_days} days`);
        console.log(`      Plan: ${anomaly.lowerDataPlan.name}`);
        console.log(`      SKU: ${anomaly.lowerDataPlan.supplier_sku}`);
        console.log(`  ✅ Higher data plan: ${anomaly.higherDataPlan.data_gb}GB for ${anomaly.higherDataPlan.validity_days} days`);
        console.log(`      Plan: ${anomaly.higherDataPlan.name}`);
        console.log(`      SKU: ${anomaly.higherDataPlan.supplier_sku}`);
      }

      console.log(`\n  Total anomalies in ${regionName}: ${regionAnomalies.length}`);
      totalAnomalies += regionAnomalies.length;
      allAnomalies.push(...regionAnomalies);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('📊 SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total pricing anomalies found: ${totalAnomalies}`);
  console.log(`Affected regions: ${new Set(allAnomalies.map(a => a.region)).size}`);

  if (totalAnomalies > 0) {
    console.log('\n🔧 RECOMMENDATION:');
    console.log('These plans should be reviewed. Possible actions:');
    console.log('1. Increase the price of higher data plans');
    console.log('2. Decrease the price of lower data plans');
    console.log('3. Deactivate the lower data plans if they provide no value');
    console.log('\nTo fix these anomalies, you can:');
    console.log('- Update prices using: npm run script scripts/pricing/apply-variant-pricing.ts');
    console.log('- Deactivate duplicates using: npm run script scripts/deactivate-duplicate-data-plans.ts');
  } else {
    console.log('\n✅ No pricing anomalies found! All plans are properly priced.');
  }
}

// Run the script
findPricingAnomalies()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });