#!/usr/bin/env node

/**
 * Emergency script to recover failed orders where payment succeeded but eSIM wasn't requested
 * Run with: npx tsx scripts/recover-failed-order.ts <orderId>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST, before any other imports
config({ path: resolve(process.cwd(), '.env.local') });

// Verify critical env vars are loaded
if (!process.env.ESIMACCESS_ACCESS_CODE) {
  console.error('❌ ESIMACCESS_ACCESS_CODE not loaded from .env.local');
  process.exit(1);
}

// NOW import modules that depend on env vars
import { createClient } from '@supabase/supabase-js';
import { assignEsim, getOrderStatus } from '../lib/esimaccess';
import { sendOrderConfirmationEmail } from '../lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function recoverOrder(orderId: string) {
  console.log(`\n🚨 Emergency Order Recovery: ${orderId}`);
  console.log('=' .repeat(60));

  // 1. Get order details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      users!inner(email, id),
      plans!inner(name, supplier_sku, data_gb, validity_days, region_code, retail_price)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error('❌ Order not found');
    return;
  }

  const user = Array.isArray(order.users) ? order.users[0] : order.users;
  const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

  console.log('\n📋 Current Order State:');
  console.log(`   Status: ${order.status}`);
  console.log(`   User: ${user?.email}`);
  console.log(`   Plan: ${plan?.name}`);
  console.log(`   SKU: ${plan?.supplier_sku}`);
  console.log(`   Price: $${plan?.retail_price}`);
  console.log(`   Paid: ${order.paid_at ? '✅ Yes' : '❌ No'}`);
  console.log(`   eSIM Requested: ${order.connect_order_id ? '✅ Yes' : '❌ No'}`);

  // Check if order is eligible for recovery
  if (!order.paid_at) {
    console.error('\n❌ Order not paid - cannot recover');
    return;
  }

  if (order.connect_order_id) {
    console.error('\n⚠️ Order already has connect_order_id - checking status...');

    // Try to fetch existing order
    try {
      const esimDetails = await getOrderStatus(order.connect_order_id);
      if (esimDetails?.esimList && esimDetails.esimList.length > 0) {
        console.log('✅ eSIM already exists - run fix-stuck-orders.ts instead');
        return;
      }
    } catch (e) {
      console.log('⚠️ Could not fetch existing order, proceeding with new request...');
    }
  }

  // 2. Request eSIM from provider
  console.log('\n🔄 Requesting eSIM from provider...');
  console.log(`   Package: ${plan?.supplier_sku}`);
  console.log(`   Email: ${user?.email}`);

  try {
    const esimResponse = await assignEsim({
      packageId: plan.supplier_sku,
      email: user.email,
      reference: orderId,
    });

    console.log('✅ eSIM order created successfully!');
    console.log(`   Order ID: ${esimResponse.orderId}`);
    console.log(`   ICCID: ${esimResponse.iccid || 'Pending'}`);

    // Update order with initial details
    await supabase
      .from('orders')
      .update({
        status: 'provisioning',
        connect_order_id: esimResponse.orderId,
        iccid: esimResponse.iccid || null,
      })
      .eq('id', orderId);

    console.log('✅ Order updated to provisioning status');

    // 3. Wait a moment then try to fetch activation details
    console.log('\n⏳ Waiting 5 seconds for provisioning...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📡 Fetching activation details...');
    const orderDetails = await getOrderStatus(esimResponse.orderId);

    if (orderDetails?.esimList && orderDetails.esimList.length > 0) {
      const profile = orderDetails.esimList[0];
      const lpaString = profile.ac;

      if (lpaString) {
        // Extract SMDP and activation code
        const parts = lpaString.split('$');
        const smdpAddress = parts.length >= 2 ? parts[1] : '';
        const activationCode = parts.length >= 3 ? parts[2] : '';

        if (smdpAddress && activationCode) {
          console.log('✅ Got activation details!');

          // Update order with complete details
          await supabase
            .from('orders')
            .update({
              status: 'completed',
              iccid: profile.iccid,
              esim_tran_no: profile.esimTranNo,
              smdp: smdpAddress,
              activation_code: activationCode,
              qr_url: profile.qrCodeUrl || profile.shortUrl || null,
            })
            .eq('id', orderId);

          console.log('✅ Order marked as completed');

          // 4. Send confirmation email
          console.log('\n📧 Sending confirmation email...');

          let formattedActivateBeforeDate: string | undefined;
          if (profile.expiredTime) {
            const expireDate = new Date(profile.expiredTime.replace(' UTC', 'Z'));
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
            to: user.email,
            orderDetails: {
              planName: plan.name,
              dataGb: plan.data_gb,
              validityDays: plan.validity_days,
              regionCode: plan.region_code,
            },
            activationDetails: {
              smdp: smdpAddress,
              activationCode: activationCode,
              qrUrl: profile.qrCodeUrl || profile.shortUrl || '',
              lpaString: lpaString,
              iccid: profile.iccid,
              activateBeforeDate: formattedActivateBeforeDate,
              apn: profile.apn,
            },
            installUrl: `${process.env.NEXT_PUBLIC_APP_URL}/install/${orderId}`,
          });

          console.log('✅ Email sent to customer');

          console.log('\n🎉 ORDER SUCCESSFULLY RECOVERED!');
          console.log(`   Customer: ${user.email}`);
          console.log(`   Plan: ${plan.name}`);
          console.log(`   Install URL: https://getlumbus.com/install/${orderId}`);
        } else {
          console.log('⚠️ Activation details incomplete - order in provisioning');
          console.log('   Run fix-stuck-orders.ts in a few minutes');
        }
      }
    } else {
      console.log('⚠️ eSIM still provisioning - activation details not ready yet');
      console.log('   Order updated to provisioning status');
      console.log('   Run fix-stuck-orders.ts in a few minutes to complete');
    }

    console.log('\n✅ Recovery process completed');

  } catch (error: any) {
    console.error('\n❌ Failed to request eSIM:', error.message);

    if (error.message.includes('INSUFFICIENT_BALANCE')) {
      console.error('💰 CRITICAL: eSIM Access account has insufficient balance!');
      console.error('   Add funds to your eSIM Access account immediately');
    } else if (error.message.includes('INVALID_PACKAGE')) {
      console.error('📦 Package SKU is invalid or unavailable');
      console.error('   Check if SKU exists: ' + plan?.supplier_sku);
    }

    // Mark order for manual review
    await supabase
      .from('orders')
      .update({
        status: 'requires_manual_review',
        notes: `Recovery failed: ${error.message}`,
      })
      .eq('id', orderId);
  }

  console.log('\n' + '=' .repeat(60));
}

// Get order ID from command line
const orderId = process.argv[2];

if (!orderId) {
  console.error('Usage: npx tsx scripts/recover-failed-order.ts <orderId>');
  console.error('Example: npx tsx scripts/recover-failed-order.ts de1e7ebe-6912-4d23-acd1-ebe691d43e35');
  process.exit(1);
}

recoverOrder(orderId).catch(console.error);