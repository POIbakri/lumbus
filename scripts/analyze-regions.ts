/**
 * Analyze all regions and countries from imported plans
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeRegions() {
  console.log('📊 Analyzing regions and countries from database...\n');

  // Fetch all plans with pagination
  const allPlans: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('plans')
      .select('region_code, name, data_gb, validity_days, retail_price, is_active')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;
    allPlans.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Total plans fetched: ${allPlans.length}\n`);

  // Group plans by region_code
  const regionMap = new Map<string, any[]>();
  for (const plan of allPlans) {
    const region = plan.region_code;
    if (!regionMap.has(region)) {
      regionMap.set(region, []);
    }
    regionMap.get(region)!.push(plan);
  }

  // Sort regions by number of plans (descending)
  const sortedRegions = Array.from(regionMap.entries())
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`\n📍 Total unique regions/countries: ${sortedRegions.length}\n`);
  console.log('Top regions by number of plans:\n');

  // Show top 30 regions
  sortedRegions.slice(0, 30).forEach(([region, plans], index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${region.padEnd(20, ' ')} - ${plans.length.toString().padStart(3, ' ')} plans`);
  });

  // Categorize regions
  const categories = {
    singleCountry: [] as string[],
    multiCountry: [] as string[],
    regional: [] as string[],
    global: [] as string[]
  };

  for (const [region, plans] of sortedRegions) {
    if (region.startsWith('GL-')) {
      categories.global.push(region);
    } else if (region.includes('-') && region.length > 3) {
      categories.multiCountry.push(region);
    } else if (region.startsWith('EU-') || region.startsWith('NA-') || region.startsWith('AS-')) {
      categories.regional.push(region);
    } else if (region.length === 2) {
      categories.singleCountry.push(region);
    } else {
      categories.multiCountry.push(region);
    }
  }

  console.log(`\n\n📦 Plans by Category:\n`);
  console.log(`Single Countries: ${categories.singleCountry.length} regions`);
  console.log(`Multi-Country:    ${categories.multiCountry.length} regions`);
  console.log(`Regional:         ${categories.regional.length} regions`);
  console.log(`Global:           ${categories.global.length} regions`);

  console.log(`\n\n🌍 All Single Country Codes (${categories.singleCountry.length}):\n`);
  console.log(categories.singleCountry.join(', '));

  console.log(`\n\n🌎 All Multi-Country Codes (${categories.multiCountry.length}):\n`);
  categories.multiCountry.slice(0, 20).forEach(code => {
    const plans = regionMap.get(code)!;
    console.log(`  ${code} (${plans.length} plans)`);
  });
  if (categories.multiCountry.length > 20) {
    console.log(`  ... and ${categories.multiCountry.length - 20} more`);
  }

  // Export to JSON for frontend use
  const exportData = {
    totalRegions: sortedRegions.length,
    totalPlans: allPlans.length,
    regions: sortedRegions.map(([code, plans]) => ({
      code,
      planCount: plans.length,
      samplePlan: plans[0].name,
      priceRange: {
        min: Math.min(...plans.map(p => p.retail_price)),
        max: Math.max(...plans.map(p => p.retail_price))
      }
    })),
    categories
  };

  console.log(`\n\n💾 Data exported for frontend use`);
  return exportData;
}

analyzeRegions().then(() => {
  console.log('\n✅ Analysis complete!\n');
  process.exit(0);
});
