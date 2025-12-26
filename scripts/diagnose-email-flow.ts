/**
 * Diagnostic script to check why emails aren't being sent after purchase
 *
 * Run with: npx tsx scripts/diagnose-email-flow.ts <orderId>
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

import { sendOrderConfirmationEmail } from '../lib/email';

const orderId = process.argv[2];

if (!orderId) {
  console.error('Usage: npx tsx scripts/diagnose-email-flow.ts <orderId>');
  process.exit(1);
}

async function diagnose() {
  console.log('🔍 Diagnosing email flow for order:', orderId);
  console.log('');

  // 1. Check if order exists
  console.log('1️⃣ Checking if order exists...');
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    console.error('❌ Order not found:', orderError?.message || 'No order');
    process.exit(1);
  }

  console.log('✅ Order found:', {
    id: order.id,
    status: order.status,
    user_id: order.user_id,
    plan_id: order.plan_id,
    connect_order_id: order.connect_order_id,
    has_activation_details: !!(order.smdp && order.activation_code),
  });
  console.log('');

  // 2. Check if user exists
  console.log('2️⃣ Checking user...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', order.user_id)
    .maybeSingle();

  if (userError || !user) {
    console.error('❌ User not found:', userError?.message || 'No user');
    process.exit(1);
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
  });
  console.log('');

  // 3. Check if plan exists
  console.log('3️⃣ Checking plan...');
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', order.plan_id)
    .maybeSingle();

  if (planError || !plan) {
    console.error('❌ Plan not found:', planError?.message || 'No plan');
    process.exit(1);
  }

  console.log('✅ Plan found:', {
    id: plan.id,
    name: plan.name,
    data_gb: plan.data_gb,
    validity_days: plan.validity_days,
  });
  console.log('');

  // 4. Check webhook events
  console.log('4️⃣ Checking webhook events for this order...');
  const { data: webhookEvents, error: webhookError } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('provider', 'esimaccess')
    .order('created_at', { ascending: false })
    .limit(10);

  if (webhookError) {
    console.error('❌ Error fetching webhook events:', webhookError.message);
  } else if (!webhookEvents || webhookEvents.length === 0) {
    console.warn('⚠️  No eSIM Access webhook events found in database');
    console.warn('   This means the eSIM Access ORDER_STATUS webhook has NOT been received');
    console.warn('   Possible reasons:');
    console.warn('   - Webhook URL not configured in eSIM Access dashboard');
    console.warn('   - Webhook failed to reach server (firewall, wrong URL, etc.)');
    console.warn('   - eSIM provisioning still in progress');
  } else {
    console.log(`✅ Found ${webhookEvents.length} recent webhook events`);

    // Check if any are for this order
    const orderWebhooks = webhookEvents.filter(w => {
      const content = w.payload_json?.content;
      return content?.orderNo === order.connect_order_id;
    });

    if (orderWebhooks.length > 0) {
      console.log(`✅ Found ${orderWebhooks.length} webhooks for this specific order:`);
      orderWebhooks.forEach(w => {
        console.log(`   - ${w.event_type} at ${w.created_at}`);
      });
    } else {
      console.warn('⚠️  No webhooks found for connect_order_id:', order.connect_order_id);
      console.warn('   The ORDER_STATUS webhook for this specific order has NOT been received');
    }
  }
  console.log('');

  // 5. Check if order has activation details
  console.log('5️⃣ Checking activation details...');
  if (!order.smdp || !order.activation_code) {
    console.error('❌ Order missing activation details');
    console.error('   smdp:', order.smdp || 'MISSING');
    console.error('   activation_code:', order.activation_code || 'MISSING');
    console.error('');
    console.error('🔍 Root cause: ORDER_STATUS webhook not processed yet');
    console.error('   Emails are only sent AFTER the ORDER_STATUS webhook updates the order');
    console.error('   with activation details (smdp + activation_code)');
    console.error('');
    console.error('📋 Action items:');
    console.error('   1. Check if webhook URL is configured in eSIM Access dashboard');
    console.error('   2. Verify webhook URL:', `${process.env.NEXT_PUBLIC_APP_URL}/api/esimaccess/webhook`);
    console.error('   3. Check if ESIMACCESS_WEBHOOK_SECRET matches in both systems');
    console.error('   4. Check server logs for webhook reception');
    process.exit(1);
  }

  console.log('✅ Order has activation details');
  console.log('');

  // 6. Try sending test email
  console.log('6️⃣ Testing email sending...');
  console.log('   Sending test email to:', user.email);

  try {
    const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}`;

    const result = await sendOrderConfirmationEmail({
      to: user.email,
      orderDetails: {
        planName: plan.name,
        dataGb: plan.data_gb,
        validityDays: plan.validity_days,
        regionCode: plan.region_code,
      },
      activationDetails: {
        smdp: order.smdp!,
        activationCode: order.activation_code!,
        qrUrl: order.qr_url || '',
        lpaString: `LPA:1$${order.smdp}$${order.activation_code}`,
        iccid: order.iccid || undefined,
      },
      installUrl,
    });

    console.log('✅ Email sent successfully!');
    console.log('   Resend response:', result);
    console.log('');
    console.log('🎉 Email system is working! Check inbox:', user.email);
  } catch (emailError) {
    console.error('❌ Failed to send email:', emailError);
    console.error('');
    console.error('🔍 Root cause: Email sending failed');
    console.error('   Possible reasons:');
    console.error('   - RESEND_API_KEY not configured correctly');
    console.error('   - RESEND_FROM_EMAIL not verified in Resend dashboard');
    console.error('   - Network connectivity issues');
    console.error('   - Rate limiting from Resend');
  }
}

diagnose().catch(console.error);
