import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getOrderStatus, generateQrCodeData } from '@/lib/esimaccess';
import { sendOrderConfirmationEmail, sendDataUsageAlert, sendPlanExpiryAlert } from '@/lib/email';

/**
 * eSIM Access Webhook Handler
 *
 * Webhook Types:
 * - CHECK_HEALTH: Test webhook send
 * - ORDER_STATUS: eSIM created and ready (orderStatus: GOT_RESOURCE)
 * - SMDP_EVENT: Real-time SM-DP+ server events (DOWNLOAD, INSTALLATION, ENABLED, DISABLED, DELETED)
 * - ESIM_STATUS: eSIM lifecycle changes (IN_USE, USED_UP, USED_EXPIRED, UNUSED_EXPIRED, CANCEL, REVOKED)
 * - DATA_USAGE: Data consumption alerts (50%, 80%, 90% thresholds)
 * - VALIDITY_USAGE: Validity period alerts (1 day remaining)
 *
 * Sender IPs (whitelist these if needed):
 * - 3.1.131.226
 * - 54.254.74.88
 * - 18.136.190.97
 * - 18.136.60.197
 * - 18.136.19.137
 */

/**
 * Safely extract SM-DP+ address from confirmation code
 * Format: LPA:1$smdp.address$activation-code
 */
function extractSmdpAddress(confirmationCode: string | null | undefined): string {
  if (!confirmationCode) return '';

  const parts = confirmationCode.split('$');
  if (parts.length < 2) return '';

  return parts[1] || '';
}

/**
 * Build LPA string defensively
 * Format: LPA:1$smdp.address$activation-code
 */
function buildLpaString(smdpAddress: string, activationCode: string): string {
  if (!smdpAddress || !activationCode) return '';
  return `LPA:1$${smdpAddress}$${activationCode}`;
}

interface WebhookPayload {
  notifyType: 'CHECK_HEALTH' | 'ORDER_STATUS' | 'SMDP_EVENT' | 'ESIM_STATUS' | 'DATA_USAGE' | 'VALIDITY_USAGE';
  eventGenerateTime?: string;
  notifyId?: string;
  content: any;
}

// Handle GET requests for webhook validation
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'eSIM Access webhook endpoint is operational',
    supported_events: ['CHECK_HEALTH', 'ORDER_STATUS', 'SMDP_EVENT', 'ESIM_STATUS', 'DATA_USAGE', 'VALIDITY_USAGE']
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const payload: WebhookPayload = JSON.parse(body);

    // Handle CHECK_HEALTH for webhook validation (allow without secret)
    if (payload.notifyType === 'CHECK_HEALTH') {
      console.log('eSIM Access health check received');
      return NextResponse.json({ success: true, message: 'Health check OK' });
    }

    // Verify webhook secret for all non-health check requests
    const webhookSecret = process.env.ESIMACCESS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = req.headers.get('x-webhook-secret');
      if (providedSecret !== webhookSecret) {
        console.error('eSIM Access webhook secret verification failed');
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
      }
    }

    // IP whitelist verification (handle comma-separated x-forwarded-for)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIP = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.headers.get('x-real-ip');
    const allowedIPs = ['3.1.131.226', '54.254.74.88', '18.136.190.97', '18.136.60.197', '18.136.19.137'];
    // Note: In production, uncomment this if you want strict IP filtering
    // if (clientIP && !allowedIPs.includes(clientIP)) {
    //   console.error('eSIM Access webhook from unauthorized IP:', clientIP);
    //   return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 });
    // }

    // Idempotency check: Prevent duplicate processing using notifyId
    if (payload.notifyId) {
      const { data: existingWebhook } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider', 'esimaccess')
        .eq('notify_id', payload.notifyId)
        .single();

      if (existingWebhook) {
        console.log(`Duplicate webhook detected (notifyId: ${payload.notifyId}), skipping processing`);
        return NextResponse.json({ success: true, message: 'Duplicate webhook ignored' });
      }
    }

    // Log webhook event for debugging and idempotency
    const { error: logError } = await supabase.from('webhook_events').insert({
      provider: 'esimaccess',
      event_type: payload.notifyType,
      notify_id: payload.notifyId || null,
      payload_json: payload,
      processed_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('Failed to log webhook event:', logError);
      // If this is a duplicate key error, it means another instance already processed it
      if (logError.code === '23505') {
        console.log('Duplicate webhook detected via unique constraint');
        return NextResponse.json({ success: true, message: 'Duplicate webhook ignored' });
      }
    }

    // Handle different webhook types
    switch (payload.notifyType) {
      case 'ORDER_STATUS':
        await handleOrderStatus(payload.content);
        break;

      case 'SMDP_EVENT':
        await handleSmdpEvent(payload.content);
        break;

      case 'ESIM_STATUS':
        await handleEsimStatus(payload.content);
        break;

      case 'DATA_USAGE':
        await handleDataUsage(payload.content);
        break;

      case 'VALIDITY_USAGE':
        await handleValidityUsage(payload.content);
        break;

      default:
        console.warn('Unknown webhook type:', payload.notifyType);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('eSIM Access webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle ORDER_STATUS webhook
 * Sent when eSIM is created and ready for retrieval (orderStatus: GOT_RESOURCE)
 */
async function handleOrderStatus(content: { orderNo: string; orderStatus: string }) {
  if (content.orderStatus !== 'GOT_RESOURCE') {
    console.log('Order status is not GOT_RESOURCE, skipping:', content.orderStatus);
    return;
  }

  // Find order by connect_order_id (which stores the eSIM Access orderNo)
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('connect_order_id', content.orderNo)
    .single();

  if (!order) {
    console.error('Order not found for eSIM Access orderNo:', content.orderNo);
    return;
  }

  try {
    // Fetch full activation details from eSIM Access
    const orderDetails = await getOrderStatus(content.orderNo);

    if (!orderDetails || !orderDetails.detailList || orderDetails.detailList.length === 0) {
      console.error('No activation details returned from eSIM Access');
      return;
    }

    const firstProfile = orderDetails.detailList[0];

    // Extract SM-DP+ address safely
    const smdpAddress = extractSmdpAddress(firstProfile.confirmationCode);

    // Update order with activation details
    await supabase
      .from('orders')
      .update({
        status: 'completed',
        iccid: firstProfile.iccid,
        esim_tran_no: firstProfile.esimTranNo,
        smdp: smdpAddress,
        activation_code: firstProfile.activationCode,
        qr_url: firstProfile.qrUrl || null,
      })
      .eq('id', order.id);

    console.log('eSIM order updated with activation details:', content.orderNo);

    // Send confirmation email
    if (firstProfile.activationCode && smdpAddress) {
      const lpaString = buildLpaString(smdpAddress, firstProfile.activationCode);
      const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}`;

      // Get plan and user data separately (avoid joins)
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', order.plan_id)
        .single();

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (plan && user) {
        await sendOrderConfirmationEmail({
          to: user.email,
          orderDetails: {
            planName: plan.name,
            dataGb: plan.data_gb,
            validityDays: plan.validity_days,
          },
          activationDetails: {
            smdp: smdpAddress,
            activationCode: firstProfile.activationCode,
            qrUrl: firstProfile.qrUrl || '',
            lpaString: lpaString,
          },
          installUrl: installUrl,
        });

        console.log('Confirmation email sent to:', user.email);
      }
    }
  } catch (error) {
    console.error('Error handling ORDER_STATUS webhook:', error);
  }
}

/**
 * Handle SMDP_EVENT webhook
 * Real-time SM-DP+ server events during eSIM provisioning
 */
async function handleSmdpEvent(content: {
  eid: string;
  iccid: string;
  esimStatus: string;
  smdpStatus: 'DOWNLOAD' | 'INSTALLATION' | 'ENABLED' | 'DISABLED' | 'DELETED';
  orderNo: string;
  esimTranNo: string;
  transactionId?: string;
}) {
  console.log('SM-DP+ Event:', content.smdpStatus, 'for ICCID:', content.iccid);

  // Update order based on SM-DP+ status
  if (content.smdpStatus === 'ENABLED') {
    // eSIM has been activated on the device
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('iccid', content.iccid);

    if (error) {
      console.error('Failed to update order status to active:', error);
    }

    console.log('eSIM activated:', content.iccid);
  }
}

/**
 * Handle ESIM_STATUS webhook
 * eSIM lifecycle changes after allocation
 */
async function handleEsimStatus(content: {
  orderNo: string;
  esimTranNo: string;
  transactionId?: string;
  iccid: string;
  esimStatus: 'IN_USE' | 'USED_UP' | 'USED_EXPIRED' | 'UNUSED_EXPIRED' | 'CANCEL' | 'REVOKED';
  smdpStatus?: string;
}) {
  console.log('eSIM Status Change:', content.esimStatus, 'for ICCID:', content.iccid);

  const statusMap: Record<string, string> = {
    IN_USE: 'active',
    USED_UP: 'depleted',
    USED_EXPIRED: 'expired',
    UNUSED_EXPIRED: 'expired',
    CANCEL: 'cancelled',
    REVOKED: 'revoked',
  };

  const newStatus = statusMap[content.esimStatus] || 'unknown';

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('iccid', content.iccid);

  if (error) {
    console.error('Failed to update eSIM status:', error);
  }
}

/**
 * Handle DATA_USAGE webhook
 * Sent at 50%, 80%, and 90% data consumption
 */
async function handleDataUsage(content: {
  orderNo: string;
  transactionId?: string;
  esimTranNo: string;
  iccid: string;
  totalVolume: number;
  orderUsage: number;
  remain: number;
  lastUpdateTime: string;
  remainThreshold: 0.5 | 0.8 | 0.9;
}) {
  const usagePercent = content.remainThreshold * 100;
  console.log(
    `Data usage alert: ${usagePercent.toFixed(0)}% consumed for ICCID: ${content.iccid}`
  );

  // Get order details (avoid joins)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('iccid', content.iccid)
    .single();

  if (orderError || !order) {
    console.error('Order not found for ICCID:', content.iccid);
    return;
  }

  // Update usage data in database (use totalVolume from webhook)
  const { error } = await supabase
    .from('orders')
    .update({
      data_usage_bytes: content.orderUsage,
      data_remaining_bytes: content.remain,
      total_bytes: content.totalVolume, // Store provider's totalVolume
      last_usage_update: content.lastUpdateTime,
    })
    .eq('iccid', content.iccid);

  if (error) {
    console.error('Failed to update data usage:', error);
  }

  // Send email notification to user about data usage
  try {
    // Get plan and user data separately (avoid joins)
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', order.plan_id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', order.user_id)
      .single();

    if (plan && user && user.email) {
      // Use totalVolume from webhook instead of plan.data_gb
      const totalDataBytes = content.totalVolume;
      const totalDataGB = totalDataBytes / (1024 * 1024 * 1024);
      const dataUsedGB = content.orderUsage / (1024 * 1024 * 1024);
      const dataRemainingGB = content.remain / (1024 * 1024 * 1024);

      await sendDataUsageAlert({
        to: user.email,
        planName: plan.name,
        usagePercent: usagePercent,
        dataUsedGB: dataUsedGB,
        dataRemainingGB: dataRemainingGB,
        totalDataGB: totalDataGB,
      });

      console.log(`Data usage alert email sent to ${user.email} (${usagePercent.toFixed(0)}% used)`);
    }
  } catch (emailError) {
    console.error('Failed to send data usage alert email:', emailError);
    // Don't throw - webhook should still succeed even if email fails
  }
}

/**
 * Handle VALIDITY_USAGE webhook
 * Sent when 1 day of validity remains
 */
async function handleValidityUsage(content: {
  orderNo: string;
  transactionId?: string;
  iccid: string;
  durationUnit: 'DAY';
  totalDuration: number;
  expiredTime: string;
  remain: number;
}) {
  console.log(`Validity expiring soon for ICCID: ${content.iccid} (${content.remain} days remaining)`);

  // Get order details (avoid joins)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('iccid', content.iccid)
    .single();

  if (orderError || !order) {
    console.error('Order not found for ICCID:', content.iccid);
    return;
  }

  // Send email notification to user about expiring plan
  try {
    // Get plan and user data separately (avoid joins)
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', order.plan_id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', order.user_id)
      .single();

    if (plan && user && user.email) {
      // Format expiry date
      const expiryDate = new Date(content.expiredTime);
      const formattedDate = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await sendPlanExpiryAlert({
        to: user.email,
        planName: plan.name,
        daysRemaining: content.remain,
        expiryDate: formattedDate,
      });

      console.log(`Plan expiry alert email sent to ${user.email} (${content.remain} days remaining)`);
    }
  } catch (emailError) {
    console.error('Failed to send plan expiry alert email:', emailError);
    // Don't throw - webhook should still succeed even if email fails
  }
}
