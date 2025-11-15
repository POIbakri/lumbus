#!/usr/bin/env node

/**
 * Script to fix stuck orders in 'provisioning' status
 * Run with: npx tsx scripts/fix-stuck-orders.ts
 *
 * This script:
 * 1. Finds all orders stuck in 'provisioning' status
 * 2. Polls eSIM Access API for activation details
 * 3. Updates orders with activation details if found
 * 4. Sends confirmation emails for fixed orders
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getOrderStatus } from '../lib/esimaccess';
import { sendOrderConfirmationEmail } from '../lib/email';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) console.error('   - SUPABASE_SERVICE_KEY');
  console.error('\nMake sure .env.local exists with these variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface StuckOrder {
  id: string;
  user_id: string;
  plan_id: string;
  connect_order_id: string;
  created_at: string;
  status: string;
  users?: { email: string };
  plans?: {
    name: string;
    data_gb: number;
    validity_days: number;
    region_code: string;
  };
}

/**
 * Extract SMDP and activation code from LPA string
 */
function extractFromLPA(lpaString: string): { smdp: string; activationCode: string } {
  const parts = lpaString.split('$');
  return {
    smdp: parts.length >= 2 ? parts[1] : '',
    activationCode: parts.length >= 3 ? parts[2] : '',
  };
}

/**
 * Fix a single stuck order
 */
async function fixOrder(order: StuckOrder): Promise<boolean> {
  console.log(`\n📦 Processing order: ${order.id}`);
  console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
  console.log(`   Connect Order ID: ${order.connect_order_id}`);

  try {
    // Poll eSIM Access API for activation details
    console.log('   🔍 Polling eSIM Access API...');
    const orderDetails = await getOrderStatus(order.connect_order_id);

    if (!orderDetails?.esimList || orderDetails.esimList.length === 0) {
      console.log('   ⚠️ No eSIM profiles found yet');
      return false;
    }

    const firstProfile = orderDetails.esimList[0];
    const lpaString = firstProfile.ac;
    const { smdp, activationCode } = extractFromLPA(lpaString);

    if (!smdp || !activationCode) {
      console.log('   ⚠️ Activation details incomplete');
      return false;
    }

    console.log('   ✅ Found activation details!');
    console.log(`      ICCID: ${firstProfile.iccid}`);
    console.log(`      Status: ${firstProfile.esimStatus}`);
    console.log(`      SMDP: ${smdp}`);

    // Update order in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        iccid: firstProfile.iccid,
        esim_tran_no: firstProfile.esimTranNo,
        smdp: smdp,
        activation_code: activationCode,
        qr_url: firstProfile.qrCodeUrl || firstProfile.shortUrl || null,
        last_usage_update: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('   ❌ Failed to update order:', updateError.message);
      return false;
    }

    console.log('   ✅ Order updated successfully!');

    // Send confirmation email if we have user and plan data
    if (order.users?.email && order.plans) {
      console.log(`   📧 Sending confirmation email to ${order.users.email}...`);

      try {
        // Format activation before date if available
        let formattedActivateBeforeDate: string | undefined;
        if (firstProfile.expiredTime) {
          const expireDate = new Date(firstProfile.expiredTime.replace(' UTC', 'Z'));
          formattedActivateBeforeDate = expireDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          });
        }

        await sendOrderConfirmationEmail({
          to: order.users.email,
          orderDetails: {
            planName: order.plans.name,
            dataGb: order.plans.data_gb,
            validityDays: order.plans.validity_days,
          },
          activationDetails: {
            smdp: smdp,
            activationCode: activationCode,
            qrUrl: firstProfile.qrCodeUrl || firstProfile.shortUrl || '',
            lpaString: lpaString,
            iccid: firstProfile.iccid,
            activateBeforeDate: formattedActivateBeforeDate,
            apn: firstProfile.apn,
          },
          installUrl: `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}`,
        });

        console.log('   ✅ Email sent successfully!');
      } catch (emailError: any) {
        console.error('   ⚠️ Email failed:', emailError.message);
        // Don't fail the whole operation if email fails
      }
    }

    return true;
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

/**
 * Main function to find and fix stuck orders
 */
async function main() {
  console.log('🔧 Stuck Orders Fix Script');
  console.log('=' .repeat(50));

  // Find all orders in 'provisioning' status
  const { data: stuckOrders, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      plan_id,
      connect_order_id,
      created_at,
      status,
      users!inner(email),
      plans!inner(name, data_gb, validity_days, region_code)
    `)
    .eq('status', 'provisioning')
    .not('connect_order_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch stuck orders:', error.message);
    process.exit(1);
  }

  if (!stuckOrders || stuckOrders.length === 0) {
    console.log('✅ No stuck orders found!');
    process.exit(0);
  }

  console.log(`\n📊 Found ${stuckOrders.length} stuck orders in 'provisioning' status`);

  // Process each stuck order
  let fixed = 0;
  let failed = 0;

  // Map the raw data to match StuckOrder interface
  const ordersToProcess: StuckOrder[] = stuckOrders.map((order: any) => ({
    ...order,
    users: Array.isArray(order.users) ? order.users[0] : order.users,
    plans: Array.isArray(order.plans) ? order.plans[0] : order.plans,
  }));

  for (const order of ordersToProcess) {
    const success = await fixOrder(order);
    if (success) {
      fixed++;
    } else {
      failed++;
    }

    // Small delay between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SUMMARY:');
  console.log(`   ✅ Fixed: ${fixed} orders`);
  console.log(`   ⚠️ Still stuck: ${failed} orders`);

  if (failed > 0) {
    console.log('\n💡 For orders still stuck:');
    console.log('   - The eSIM may still be provisioning on the supplier side');
    console.log('   - Try running this script again in a few minutes');
    console.log('   - Check eSIM Access dashboard for order status');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the script
main().catch(console.error);