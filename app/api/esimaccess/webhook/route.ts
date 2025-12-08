import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getOrderStatus, generateQrCodeData } from '@/lib/esimaccess';
import { sendOrderConfirmationEmail, sendDataUsageAlert, sendPlanExpiryAlert } from '@/lib/email';
import { sendDataUsagePush, sendValidityPush, sendEsimReadyPush, sendEsimActivatedPush } from '@/lib/push-notifications';

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

/**
 * Parse webhook timestamp handling various formats from eSIM Access
 * Handles: "2025-09-11T13:28:09+0000" (no colon in timezone)
 *          "2025-09-11T13:28:09+00:00" (ISO 8601 with colon)
 *          "2025-09-11 13:28:09 UTC" (space-separated with UTC)
 * Returns null if parsing fails
 */
function parseWebhookTimestamp(timestamp: string): Date | null {
  if (!timestamp) return null;

  // Try direct parsing first (works for standard ISO 8601)
  let parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle "+0000" format (no colon) - convert to "+00:00"
  // Matches patterns like +0000, -0530, +1200
  const fixedTimezone = timestamp.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3');
  if (fixedTimezone !== timestamp) {
    parsed = new Date(fixedTimezone);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Handle "YYYY-MM-DD HH:mm:ss UTC" format
  const utcFormat = timestamp.replace(' UTC', 'Z').replace(' ', 'T');
  if (utcFormat !== timestamp) {
    parsed = new Date(utcFormat);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  console.error('[parseWebhookTimestamp] Failed to parse timestamp:', timestamp);
  return null;
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
      return NextResponse.json({ success: true, message: 'Health check OK' });
    }

    // Note: eSIM Access does not send webhook secrets in headers
    // They only provide AccessCode and SecretKey for API authentication
    // Security is provided by IP whitelist instead (optional)

    // IP whitelist verification (handle comma-separated x-forwarded-for)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIP = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.headers.get('x-real-ip');
    const allowedIPs = ['3.1.131.226', '54.254.74.88', '18.136.190.97', '18.136.60.197', '18.136.19.137'];

    // Enable IP whitelist in production if ESIMACCESS_ENABLE_IP_WHITELIST=true
    const enableIPWhitelist = process.env.ESIMACCESS_ENABLE_IP_WHITELIST === 'true';
    if (enableIPWhitelist && clientIP && !allowedIPs.includes(clientIP)) {
      console.error('eSIM Access webhook from unauthorized IP:', clientIP);
      return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 });
    }

    // Idempotency check: Prevent duplicate processing using notifyId
    if (payload.notifyId) {
      const { data: existingWebhook } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider', 'esimaccess')
        .eq('notify_id', payload.notifyId)
        .maybeSingle();

      if (existingWebhook) {
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
      // If this is a duplicate key error, it means another instance already processed it
      if (logError.code === '23505') {
        return NextResponse.json({ success: true, message: 'Duplicate webhook ignored' });
      }
    }

    // Handle different webhook types
    switch (payload.notifyType) {
      case 'ORDER_STATUS':
        await handleOrderStatus(payload.content);
        break;

      case 'SMDP_EVENT':
        await handleSmdpEvent(payload.content, payload.eventGenerateTime);
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
        // Unknown webhook type - ignore
        break;
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle ORDER_STATUS webhook
 * Sent when eSIM is created and ready for retrieval (orderStatus: GOT_RESOURCE)
 */
async function handleOrderStatus(content: { orderNo: string; orderStatus: string }) {
  if (content.orderStatus !== 'GOT_RESOURCE') {
    return;
  }

  // Find order by connect_order_id (which stores the eSIM Access orderNo)
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('connect_order_id', content.orderNo)
    .maybeSingle();

  if (!order) {
    return;
  }

  try {
    // Fetch full activation details from eSIM Access
    const orderDetails = await getOrderStatus(content.orderNo);

    if (!orderDetails || !orderDetails.esimList || orderDetails.esimList.length === 0) {
      return;
    }

    const firstProfile = orderDetails.esimList[0];

    // The 'ac' field contains the full LPA string: LPA:1$smdp.address$activation-code
    const lpaString = firstProfile.ac;
    const smdpAddress = extractSmdpAddress(lpaString);

    // Extract activation code from LPA string
    const parts = lpaString.split('$');
    const activationCode = parts.length >= 3 ? parts[2] : '';

    // Update order with activation details
    await supabase
      .from('orders')
      .update({
        status: 'completed',
        iccid: firstProfile.iccid,
        esim_tran_no: firstProfile.esimTranNo,
        smdp: smdpAddress,
        activation_code: activationCode,
        qr_url: firstProfile.qrCodeUrl || firstProfile.shortUrl || null,
      })
      .eq('id', order.id);

    // Send confirmation email
    if (activationCode && smdpAddress) {
      const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}`;

      // Get plan and user data separately (avoid joins)
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', order.plan_id)
        .maybeSingle();

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', order.user_id)
        .maybeSingle();

      if (plan && user) {
        // Format activate before date
        let formattedActivateBeforeDate: string | undefined;
        if (firstProfile.expiredTime) {
          try {
            // expiredTime format from API: "YYYY-MM-DD hh:mm:ss UTC"
            const expireDate = new Date(firstProfile.expiredTime.replace(' UTC', 'Z'));
            formattedActivateBeforeDate = expireDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            });
          } catch (dateError) {
            formattedActivateBeforeDate = firstProfile.expiredTime;
          }
        }

        await sendOrderConfirmationEmail({
          to: user.email,
          orderDetails: {
            planName: plan.name,
            dataGb: plan.data_gb,
            validityDays: plan.validity_days,
          },
          activationDetails: {
            smdp: smdpAddress,
            activationCode: activationCode,
            qrUrl: firstProfile.qrCodeUrl || firstProfile.shortUrl || '',
            lpaString: lpaString,
            iccid: firstProfile.iccid,
            activateBeforeDate: formattedActivateBeforeDate,
            apn: firstProfile.apn,
          },
          installUrl: installUrl,
        });

        // Send push notification for eSIM ready
        await sendEsimReadyPush({
          userId: order.user_id,
          orderId: order.id,
          planName: plan.name,
          dataGb: plan.data_gb,
        });
      }
    }
  } catch (error) {
    // Error handling webhook
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
}, eventGenerateTime?: string) {
  // Update order based on SM-DP+ status
  if (content.smdpStatus === 'ENABLED') {
    // Get order to calculate expires_at from validity_days
    const { data: order } = await supabase
      .from('orders')
      .select('id, plan_id, user_id')
      .eq('iccid', content.iccid)
      .maybeSingle();

    if (!order) {
      // No order found with this ICCID - nothing to update
      console.log(`[SMDP_EVENT] No order found for ICCID: ${content.iccid}`);
      return;
    }

    // Get plan validity days
    const { data: plan } = await supabase
      .from('plans')
      .select('validity_days')
      .eq('id', order.plan_id)
      .maybeSingle();

    // Use eventGenerateTime from webhook (when eSIM was actually activated)
    // Fall back to server time if not provided or invalid
    let activatedAt: Date;
    if (eventGenerateTime) {
      const parsedTime = parseWebhookTimestamp(eventGenerateTime);
      activatedAt = parsedTime || new Date();
    } else {
      activatedAt = new Date();
    }

    const expiresAt = plan?.validity_days
      ? new Date(activatedAt.getTime() + plan.validity_days * 24 * 60 * 60 * 1000)
      : null;

    // eSIM has been activated on the device
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'active',
        activated_at: activatedAt.toISOString(),
        expires_at: expiresAt?.toISOString() || null,
      })
      .eq('iccid', content.iccid);

    if (error) {
      console.error('[SMDP_EVENT] Failed to update order:', error.message, { iccid: content.iccid });
    } else {
      // Send push notification for eSIM activated
      try {
        const { data: planData } = await supabase
          .from('plans')
          .select('name')
          .eq('id', order.plan_id)
          .maybeSingle();

        if (planData) {
          await sendEsimActivatedPush({
            userId: order.user_id,
            orderId: order.id,
            planName: planData.name,
          });
        }
      } catch (pushError) {
        // Don't throw - webhook should still succeed even if push fails
        console.error('[SMDP_EVENT] Failed to send push notification:', pushError);
      }
    }
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
  const statusMap: Record<string, string> = {
    IN_USE: 'active',
    USED_UP: 'depleted',
    USED_EXPIRED: 'expired',
    UNUSED_EXPIRED: 'expired',
    CANCEL: 'cancelled',
    REVOKED: 'revoked',
  };

  const newStatus = statusMap[content.esimStatus] || 'unknown';

  console.log(`[eSIM Status Webhook] Processing status change: ${content.esimStatus} → ${newStatus}`, {
    orderNo: content.orderNo,
    iccid: content.iccid,
    esimTranNo: content.esimTranNo
  });

  // Try to update by ICCID first
  const { data: updatedByIccid, error: iccidError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('iccid', content.iccid)
    .select();

  if (updatedByIccid && updatedByIccid.length > 0) {
    console.log(`[eSIM Status Webhook] ✅ Successfully updated order ${updatedByIccid[0].id} by ICCID to status: ${newStatus}`);
    return;
  }

  // If ICCID match failed, try matching by connect_order_id (orderNo)
  // This handles cases where the order hasn't been fully provisioned yet
  console.log(`[eSIM Status Webhook] ICCID match failed, trying orderNo fallback`);

  const { data: updatedByOrderNo, error: orderNoError } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      iccid: content.iccid // Also set ICCID if it wasn't set yet
    })
    .eq('connect_order_id', content.orderNo)
    .select();

  if (updatedByOrderNo && updatedByOrderNo.length > 0) {
    console.log(`[eSIM Status Webhook] ✅ Successfully updated order ${updatedByOrderNo[0].id} by orderNo to status: ${newStatus}`);
    return;
  }

  // If both methods failed, log an error
  console.error(`[eSIM Status Webhook] ❌ Failed to find order with ICCID: ${content.iccid} or orderNo: ${content.orderNo}`);
  console.error('[eSIM Status Webhook] ICCID error:', iccidError);
  console.error('[eSIM Status Webhook] OrderNo error:', orderNoError);
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
  remainThreshold: 0.5 | 0.2 | 0.1; // Represents % remaining: 50%, 20%, or 10%
}) {
  // remainThreshold is the percentage REMAINING (0.5 = 50% left, 0.2 = 20% left, 0.1 = 10% left)
  // Convert to usage percentage: 50% remaining = 50% used, 20% remaining = 80% used, 10% remaining = 90% used
  const usagePercent = (1 - content.remainThreshold) * 100;

  // Get order details (avoid joins)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('iccid', content.iccid)
    .maybeSingle();

  if (orderError || !order) {
    return;
  }

  // Update usage data in database (use totalVolume from webhook)
  await supabase
    .from('orders')
    .update({
      data_usage_bytes: content.orderUsage,
      data_remaining_bytes: content.remain,
      total_bytes: content.totalVolume, // Store provider's totalVolume
      last_usage_update: content.lastUpdateTime,
    })
    .eq('iccid', content.iccid);

  // Send email notification to user about data usage
  try {
    // Get plan and user data separately (avoid joins)
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', order.plan_id)
      .maybeSingle();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', order.user_id)
      .maybeSingle();

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

      // Send push notification for data usage
      await sendDataUsagePush({
        userId: order.user_id,
        orderId: order.id,
        planName: plan.name,
        usagePercent: usagePercent,
        dataRemainingGB: dataRemainingGB,
      });
    }
  } catch (emailError) {
    // Don't throw - webhook should still succeed even if email/push fails
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
  // Get order details (avoid joins)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('iccid', content.iccid)
    .maybeSingle();

  if (orderError || !order) {
    return;
  }

  // Update expires_at with the exact expiration time from eSIM Access
  // This is more accurate than our calculated value
  try {
    const expiresAt = new Date(content.expiredTime);
    if (!isNaN(expiresAt.getTime())) {
      const { error } = await supabase
        .from('orders')
        .update({ expires_at: expiresAt.toISOString() })
        .eq('iccid', content.iccid);

      if (error) {
        console.error('[VALIDITY_USAGE] Failed to update expires_at:', error.message, { iccid: content.iccid });
      }
    }
  } catch (err) {
    console.error('[VALIDITY_USAGE] Error parsing expiredTime:', err);
  }

  // Send email notification to user about expiring plan
  try {
    // Get plan and user data separately (avoid joins)
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', order.plan_id)
      .maybeSingle();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', order.user_id)
      .maybeSingle();

    if (plan && user && user.email) {
      // Validate and format expiry date
      const expiryDate = new Date(content.expiredTime);
      if (isNaN(expiryDate.getTime())) {
        console.error('[VALIDITY_USAGE] Invalid expiredTime, skipping email:', content.expiredTime);
        return;
      }

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

      // Send push notification for validity expiry
      await sendValidityPush({
        userId: order.user_id,
        orderId: order.id,
        planName: plan.name,
        daysRemaining: content.remain,
        expiryDate: formattedDate,
      });
    }
  } catch (emailError) {
    // Don't throw - webhook should still succeed even if email/push fails
  }
}
