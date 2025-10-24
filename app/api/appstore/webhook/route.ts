import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  verifyAndDecodeNotification,
  decodeTransactionInfo,
  decodeRenewalInfo,
  formatNotificationForLog,
  requiresImmediateAction,
  type AppleNotification,
  type TransactionInfo,
} from '@/lib/appstore-notifications';
import { voidCommission, voidReferralReward } from '@/lib/commission';

/**
 * Apple App Store Server Notifications v2 Webhook Handler
 *
 * This endpoint receives server-to-server notifications from Apple about:
 * - Purchase events
 * - Refunds
 * - Subscription renewals and expirations
 * - Billing issues
 *
 * Apple sends these notifications to the URL configured in App Store Connect.
 *
 * Setup Instructions:
 * 1. Go to App Store Connect → Your App → App Information
 * 2. Scroll to "App Store Server Notifications"
 * 3. Add this URL: https://api.getlumbus.com/api/appstore/webhook
 * 4. Apple will send test notifications to verify the endpoint
 *
 * Security:
 * - All notifications are JWS signed by Apple
 * - We verify the signature before processing
 * - Idempotency is enforced using notificationUUID
 *
 * Notification Types We Handle:
 * - REFUND: User got refund - deactivate eSIM
 * - REVOKE: Access revoked (family sharing) - deactivate eSIM
 * - DID_RENEW: Subscription renewed (future use)
 * - EXPIRED: Subscription expired (future use)
 * - DID_FAIL_TO_RENEW: Renewal failed (future use)
 *
 * Apple Documentation:
 * https://developer.apple.com/documentation/appstoreservernotifications
 */

// Handle GET requests for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Apple App Store Server Notifications endpoint is operational',
    version: 'v2',
    supported_notification_types: [
      'REFUND',
      'REVOKE',
      'DID_RENEW',
      'EXPIRED',
      'DID_FAIL_TO_RENEW',
      'SUBSCRIBED',
      'DID_CHANGE_RENEWAL_STATUS',
      'GRACE_PERIOD_EXPIRED',
    ],
  });
}

// Handle POST requests from Apple
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let notificationId: string | null = null;

  try {
    console.log('[Apple Webhook] Incoming notification...');

    // Parse request body
    const body = await req.text();
    const payload = JSON.parse(body);

    // Extract signedPayload
    const signedPayload = payload.signedPayload;
    if (!signedPayload) {
      console.error('[Apple Webhook] No signedPayload in request');
      return NextResponse.json({ error: 'Missing signedPayload' }, { status: 400 });
    }

    // Verify and decode notification
    console.log('[Apple Webhook] Verifying JWS signature...');
    const notification = await verifyAndDecodeNotification(signedPayload);

    if (!notification) {
      console.error('[Apple Webhook] Failed to verify notification signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('[Apple Webhook] Notification verified:', formatNotificationForLog(notification));

    // Extract notification UUID for idempotency
    const notificationUUID = notification.notificationUUID;

    // Idempotency check: Have we already processed this notification?
    const { data: existingNotification } = await supabase
      .from('apple_server_notifications')
      .select('id, processed')
      .eq('notification_uuid', notificationUUID)
      .maybeSingle();

    if (existingNotification) {
      console.log('[Apple Webhook] Duplicate notification, already processed:', notificationUUID);
      return NextResponse.json({
        received: true,
        duplicate: true,
        notificationUUID,
      });
    }

    // Decode transaction info
    const transactionInfo = decodeTransactionInfo(notification);
    if (!transactionInfo) {
      console.error('[Apple Webhook] No transaction info in notification');
      return NextResponse.json({ error: 'Missing transaction info' }, { status: 400 });
    }

    console.log('[Apple Webhook] Transaction:', {
      transactionId: transactionInfo.transactionId,
      originalTransactionId: transactionInfo.originalTransactionId,
      productId: transactionInfo.productId,
    });

    // Find order by Apple transaction ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, plans(*), users(*)')
      .eq('apple_transaction_id', transactionInfo.transactionId)
      .maybeSingle();

    if (orderError) {
      console.error('[Apple Webhook] Error fetching order:', orderError);
    }

    // Store notification in database
    console.log('[Apple Webhook] Storing notification in database...');
    const { data: storedNotification, error: insertError } = await supabase
      .from('apple_server_notifications')
      .insert({
        notification_uuid: notificationUUID,
        notification_type: notification.notificationType,
        subtype: notification.subtype || null,
        transaction_id: transactionInfo.transactionId,
        original_transaction_id: transactionInfo.originalTransactionId,
        web_order_line_item_id: transactionInfo.webOrderLineItemId || null,
        order_id: order?.id || null,
        signed_payload: signedPayload,
        decoded_payload: notification,
        processed: false,
        notification_sent_date: new Date(notification.signedDate).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Apple Webhook] Failed to store notification:', insertError);
      // Continue processing even if storage fails
    } else {
      notificationId = storedNotification?.id || null;
      console.log('[Apple Webhook] Notification stored:', notificationId);
    }

    // Log processing attempt
    const logProcessingAttempt = async (success: boolean, errorMessage?: string) => {
      if (!notificationId) return;

      await supabase.from('apple_notification_processing_log').insert({
        notification_id: notificationId,
        attempt_number: 1,
        success,
        error_message: errorMessage || null,
        processing_duration_ms: Date.now() - startTime,
      });
    };

    // Handle different notification types
    try {
      await handleNotification(notification, transactionInfo, order);

      // Mark as processed
      if (notificationId) {
        await supabase
          .from('apple_server_notifications')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', notificationId);
      }

      await logProcessingAttempt(true);

      console.log('[Apple Webhook] Notification processed successfully');
      return NextResponse.json({
        received: true,
        notificationUUID,
        type: notification.notificationType,
      });
    } catch (processingError) {
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error';
      console.error('[Apple Webhook] Processing error:', errorMessage);

      // Log failed attempt
      await logProcessingAttempt(false, errorMessage);

      // Store error in notification record
      if (notificationId) {
        await supabase
          .from('apple_server_notifications')
          .update({
            processing_error: errorMessage,
          })
          .eq('id', notificationId);
      }

      // Return 200 to prevent Apple from retrying (we logged the error)
      return NextResponse.json({
        received: true,
        error: 'Processing failed',
        notificationUUID,
      });
    }
  } catch (error) {
    console.error('[Apple Webhook] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed attempt if we have notification ID
    if (notificationId) {
      await supabase.from('apple_notification_processing_log').insert({
        notification_id: notificationId,
        attempt_number: 1,
        success: false,
        error_message: errorMessage,
        processing_duration_ms: Date.now() - startTime,
      });
    }

    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle notification based on type
 */
async function handleNotification(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any | null
) {
  const notificationType = notification.notificationType;
  console.log(`[Apple Webhook] Handling notification type: ${notificationType}`);

  // If order not found, log and skip
  if (!order) {
    console.log('[Apple Webhook] Order not found for transaction:', transactionInfo.transactionId);
    // This is not an error - notification might arrive before order is created
    return;
  }

  switch (notificationType) {
    case 'REFUND':
      await handleRefund(notification, transactionInfo, order);
      break;

    case 'REVOKE':
      await handleRevoke(notification, transactionInfo, order);
      break;

    case 'DID_RENEW':
      await handleRenewal(notification, transactionInfo, order);
      break;

    case 'EXPIRED':
      await handleExpiration(notification, transactionInfo, order);
      break;

    case 'DID_FAIL_TO_RENEW':
      await handleRenewalFailure(notification, transactionInfo, order);
      break;

    case 'SUBSCRIBED':
      await handleNewSubscription(notification, transactionInfo, order);
      break;

    case 'DID_CHANGE_RENEWAL_STATUS':
      await handleRenewalStatusChange(notification, transactionInfo, order);
      break;

    case 'GRACE_PERIOD_EXPIRED':
      await handleGracePeriodExpired(notification, transactionInfo, order);
      break;

    case 'CONSUMPTION_REQUEST':
      // Not applicable for non-consumables
      console.log('[Apple Webhook] CONSUMPTION_REQUEST received (skipping)');
      break;

    default:
      console.log('[Apple Webhook] Unhandled notification type:', notificationType);
  }
}

/**
 * Handle REFUND notification
 * User got a refund - deactivate eSIM and void commissions/rewards
 */
async function handleRefund(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing REFUND for order:', order.id);

  // Update order status to refunded
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_reason: notification.subtype || 'Apple refund',
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('[Apple Webhook] Failed to update order:', updateError);
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  // Void commissions and rewards
  console.log('[Apple Webhook] Voiding commissions and rewards...');
  await voidCommission(order.id);
  await voidReferralReward(order.id);

  console.log('[Apple Webhook] Refund processed successfully');
}

/**
 * Handle REVOKE notification
 * Access revoked (e.g., family sharing removed)
 */
async function handleRevoke(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing REVOKE for order:', order.id);

  // Update order status to revoked
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'revoked',
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('[Apple Webhook] Failed to update order:', updateError);
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  // Void commissions and rewards
  console.log('[Apple Webhook] Voiding commissions and rewards...');
  await voidCommission(order.id);
  await voidReferralReward(order.id);

  console.log('[Apple Webhook] Revocation processed successfully');
}

/**
 * Handle DID_RENEW notification
 * Subscription renewed successfully (future use for subscriptions)
 */
async function handleRenewal(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing DID_RENEW for order:', order.id);
  // TODO: Implement subscription renewal logic when adding subscriptions
  // For now, just log it
  console.log('[Apple Webhook] Subscription renewed (no action taken yet)');
}

/**
 * Handle EXPIRED notification
 * Subscription expired
 */
async function handleExpiration(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing EXPIRED for order:', order.id);

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'expired',
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('[Apple Webhook] Failed to update order:', updateError);
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  console.log('[Apple Webhook] Expiration processed successfully');
}

/**
 * Handle DID_FAIL_TO_RENEW notification
 * Subscription renewal failed (billing issue)
 */
async function handleRenewalFailure(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing DID_FAIL_TO_RENEW for order:', order.id);
  // TODO: Notify user about renewal failure
  console.log('[Apple Webhook] Renewal failed (no action taken yet)');
}

/**
 * Handle SUBSCRIBED notification
 * New subscription started
 */
async function handleNewSubscription(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing SUBSCRIBED for order:', order.id);
  // This is informational - order should already be processed via receipt validation
  console.log('[Apple Webhook] New subscription confirmed');
}

/**
 * Handle DID_CHANGE_RENEWAL_STATUS notification
 * User changed auto-renewal setting
 */
async function handleRenewalStatusChange(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing DID_CHANGE_RENEWAL_STATUS for order:', order.id);
  const renewalInfo = decodeRenewalInfo(notification);
  if (renewalInfo) {
    console.log('[Apple Webhook] Auto-renew status:', renewalInfo.autoRenewStatus === 1 ? 'ON' : 'OFF');
  }
}

/**
 * Handle GRACE_PERIOD_EXPIRED notification
 * Grace period for subscription ended
 */
async function handleGracePeriodExpired(
  notification: AppleNotification,
  transactionInfo: TransactionInfo,
  order: any
) {
  console.log('[Apple Webhook] Processing GRACE_PERIOD_EXPIRED for order:', order.id);

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'expired',
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('[Apple Webhook] Failed to update order:', updateError);
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  console.log('[Apple Webhook] Grace period expiration processed');
}
