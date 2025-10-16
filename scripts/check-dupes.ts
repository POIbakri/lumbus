import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkDuplicates() {
  // First get the count
  const { count, error: countError } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true });

  console.log(`Total count from database: ${count}`);
  if (countError) console.error('Count error:', countError);

  // Now get all plans (need to fetch in batches since default limit is 1000)
  const allPlans: Array<{ supplier_sku: string }> = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error: fetchError } = await supabase
      .from('plans')
      .select('supplier_sku')
      .range(from, from + pageSize - 1);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      break;
    }

    if (!data || data.length === 0) break;

    allPlans.push(...data);
    console.log(`Fetched ${allPlans.length} plans so far...`);

    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  const skuCounts = new Map<string, number>();
  for (const plan of allPlans) {
    const count = skuCounts.get(plan.supplier_sku) || 0;
    skuCounts.set(plan.supplier_sku, count + 1);
  }

  const duplicates = Array.from(skuCounts.entries()).filter(([_, count]) => count > 1);

  console.log(`\nTotal plans fetched: ${allPlans.length}`);
  console.log(`Unique SKUs: ${skuCounts.size}`);
  console.log(`Duplicate SKUs: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\nDuplicates found:');
    duplicates.forEach(([sku, count]) => console.log(`  ${sku}: ${count} times`));
  }
}

checkDuplicates();
