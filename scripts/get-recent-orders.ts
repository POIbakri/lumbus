/**
 * Get recent orders for diagnosis
 * Run with: npx tsx scripts/get-recent-orders.ts
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Check if environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Environment variables not loaded');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

// Create Supabase client directly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getRecentOrders() {
  console.log('🔍 Fetching recent orders...\n');

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, created_at, user_id, connect_order_id, smdp, activation_code')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching orders:', error);
    process.exit(1);
  }

  if (!orders || orders.length === 0) {
    console.log('⚠️  No orders found');
    process.exit(0);
  }

  console.log(`Found ${orders.length} recent orders:\n`);

  orders.forEach((order, index) => {
    const hasActivation = !!(order.smdp && order.activation_code);
    const statusIcon = hasActivation ? '✅' : '❌';

    console.log(`${index + 1}. Order ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
    console.log(`   Connect Order ID: ${order.connect_order_id || 'N/A'}`);
    console.log(`   Has Activation: ${statusIcon} ${hasActivation ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log('\n📋 To diagnose an order, run:');
  console.log(`   npx tsx scripts/diagnose-email-flow.ts <ORDER_ID>`);
  console.log('\nExample:');
  console.log(`   npx tsx scripts/diagnose-email-flow.ts ${orders[0].id}`);
}

getRecentOrders().catch(console.error);
