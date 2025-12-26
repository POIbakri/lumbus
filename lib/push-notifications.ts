/**
 * Push Notification Service
 *
 * Sends push notifications to mobile app users via Expo's push notification service.
 * Uses expo-server-sdk to handle token validation, batching, and error handling.
 */

import Expo, { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { supabase } from './db';

// Create a new Expo SDK client (lazy initialization)
let expoClient: Expo | null = null;

function getExpoClient(): Expo {
  if (!expoClient) {
    expoClient = new Expo();
  }
  return expoClient;
}

// Notification types matching mobile app expectations
export type NotificationType =
  | 'usage_50'      // 50% data used
  | 'usage_30'      // 30% remaining (70% used)
  | 'usage_20'      // 20% remaining (80% used)
  | 'usage_10'      // 10% remaining (90% used)
  | 'usage_depleted' // 0% remaining (100% used)
  | 'validity_1_day'
  | 'validity_expired'
  | 'esim_ready'
  | 'esim_activated';

/**
 * Get Android channel ID based on notification type
 */
function getChannelId(notificationType: NotificationType): string {
  if (notificationType === 'esim_ready' || notificationType === 'esim_activated') {
    return 'esim-ready';
  }
  if (notificationType.startsWith('usage_') || notificationType.startsWith('validity_')) {
    return 'usage-alerts';
  }
  return 'default';
}

/**
 * Get iOS category identifier for action buttons
 */
function getCategoryIdentifier(notificationType: NotificationType): string | undefined {
  if (notificationType === 'esim_ready') {
    return 'esim_ready';
  }
  if (notificationType.startsWith('usage_') || notificationType.startsWith('validity_')) {
    return 'usage_alert';
  }
  return undefined;
}

interface PushNotificationPayload {
  userId: string;
  orderId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  notificationType: NotificationType;
}

interface SendResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * Get user's push token from database
 */
async function getUserPushToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_push_tokens')
    .select('push_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.push_token;
}

/**
 * Check if a notification of this type has already been sent for this order
 */
async function hasNotificationBeenSent(
  orderId: string,
  notificationType: NotificationType
): Promise<boolean> {
  const { data } = await supabase
    .from('usage_notifications_sent')
    .select('id')
    .eq('order_id', orderId)
    .eq('notification_type', notificationType)
    .maybeSingle();

  return !!data;
}

/**
 * Record that a notification was sent
 */
async function recordNotificationSent(
  orderId: string,
  userId: string,
  notificationType: NotificationType,
  thresholdValue: number | null,
  pushSent: boolean,
  emailSent: boolean
): Promise<void> {
  const { error } = await supabase
    .from('usage_notifications_sent')
    .upsert({
      order_id: orderId,
      user_id: userId,
      notification_type: notificationType,
      threshold_value: thresholdValue,
      push_sent: pushSent,
      email_sent: emailSent,
      sent_at: new Date().toISOString(),
    }, {
      onConflict: 'order_id,notification_type'
    });

  if (error) {
    console.error('[Push] Failed to record notification:', error);
  }
}

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<SendResult> {
  const { userId, orderId, title, body, data, notificationType } = payload;

  try {
    // Check if notification already sent (prevent duplicates)
    const alreadySent = await hasNotificationBeenSent(orderId, notificationType);
    if (alreadySent) {
      console.log(`[Push] Notification ${notificationType} already sent for order ${orderId}`);
      return { success: true, error: 'Already sent' };
    }

    // Get user's push token
    const pushToken = await getUserPushToken(userId);
    if (!pushToken) {
      console.log(`[Push] No push token for user ${userId}`);
      // Record that we tried but couldn't send (no token)
      await recordNotificationSent(orderId, userId, notificationType, null, false, false);
      return { success: false, error: 'No push token' };
    }

    // Validate the push token format
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`[Push] Invalid Expo push token: ${pushToken}`);
      return { success: false, error: 'Invalid push token format' };
    }

    // Build the push message
    const channelId = getChannelId(notificationType);
    const categoryIdentifier = getCategoryIdentifier(notificationType);

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: {
        type: notificationType,  // Mobile app expects 'type' field
        orderId,
        ...data,
      },
      // iOS specific
      badge: 1,
      ...(categoryIdentifier && { categoryId: categoryIdentifier }),
      // Android specific
      channelId,
      priority: 'high',
    };

    // Send the notification
    const expo = getExpoClient();
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    if (ticket.status === 'ok') {
      console.log(`[Push] Sent ${notificationType} notification to user ${userId}`);

      // Extract threshold value from notification type
      let thresholdValue: number | null = null;
      if (notificationType === 'usage_50') thresholdValue = 50;
      else if (notificationType === 'usage_30') thresholdValue = 70; // 70% used = 30% remaining
      else if (notificationType === 'usage_20') thresholdValue = 80; // 80% used = 20% remaining
      else if (notificationType === 'usage_10') thresholdValue = 90; // 90% used = 10% remaining
      else if (notificationType === 'usage_depleted') thresholdValue = 100;

      // Record successful send
      await recordNotificationSent(orderId, userId, notificationType, thresholdValue, true, false);

      return { success: true, ticketId: ticket.id };
    } else {
      const errorMessage = ticket.message || 'Unknown error';
      console.error(`[Push] Failed to send notification:`, errorMessage);

      // Handle specific error types
      if (ticket.details?.error === 'DeviceNotRegistered') {
        // Remove invalid token from database
        await supabase
          .from('user_push_tokens')
          .delete()
          .eq('user_id', userId);
        console.log(`[Push] Removed invalid token for user ${userId}`);
      }

      return { success: false, error: errorMessage };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Push] Error sending notification:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send data usage alert push notification
 */
export async function sendDataUsagePush(params: {
  userId: string;
  orderId: string;
  planName: string;
  usagePercent: number;
  dataRemainingGB: number;
}): Promise<SendResult> {
  const { userId, orderId, planName, usagePercent, dataRemainingGB } = params;

  // Determine notification type based on usage (aligned with mobile app)
  // Mobile expects: usage_50, usage_30 (30% remaining), usage_20, usage_10, usage_depleted
  let notificationType: NotificationType;
  let title: string;
  let body: string;

  if (usagePercent >= 100) {
    notificationType = 'usage_depleted';
    title = 'No Data Remaining';
    body = `Your ${planName} eSIM has run out of data. Top up now to stay connected.`;
  } else if (usagePercent >= 90) {
    notificationType = 'usage_10';
    title = '10% Data Remaining';
    body = `Only ${dataRemainingGB.toFixed(2)} GB left on your ${planName} eSIM. Consider topping up soon.`;
  } else if (usagePercent >= 80) {
    notificationType = 'usage_20';
    title = '20% Data Remaining';
    body = `${dataRemainingGB.toFixed(2)} GB remaining on your ${planName} eSIM.`;
  } else if (usagePercent >= 70) {
    notificationType = 'usage_30';
    title = '30% Data Remaining';
    body = `${dataRemainingGB.toFixed(2)} GB remaining on your ${planName} eSIM.`;
  } else if (usagePercent >= 50) {
    notificationType = 'usage_50';
    title = '50% Data Used';
    body = `You've used half of your ${planName} data. ${dataRemainingGB.toFixed(2)} GB remaining.`;
  } else {
    // No notification needed for < 50%
    return { success: true };
  }

  return sendPushNotification({
    userId,
    orderId,
    title,
    body,
    notificationType,
    data: {
      orderName: planName,
      usagePercent,
      dataRemainingGB,
    },
  });
}

/**
 * Send validity/expiry alert push notification
 */
export async function sendValidityPush(params: {
  userId: string;
  orderId: string;
  planName: string;
  daysRemaining: number;
  expiryDate: string;
}): Promise<SendResult> {
  const { userId, orderId, planName, daysRemaining, expiryDate } = params;

  let notificationType: NotificationType;
  let title: string;
  let body: string;

  if (daysRemaining <= 0) {
    notificationType = 'validity_expired';
    title = 'eSIM Expired';
    body = `Your ${planName} eSIM has expired. Purchase a new plan to stay connected.`;
  } else if (daysRemaining <= 1) {
    notificationType = 'validity_1_day';
    title = 'eSIM Expiring Soon';
    body = `Your ${planName} eSIM expires ${expiryDate}. Use your remaining data before it expires.`;
  } else {
    // No notification needed for > 1 day
    return { success: true };
  }

  return sendPushNotification({
    userId,
    orderId,
    title,
    body,
    notificationType,
    data: {
      orderName: planName,
      daysRemaining,
      expiryDate,
    },
  });
}

/**
 * Send eSIM ready push notification
 */
export async function sendEsimReadyPush(params: {
  userId: string;
  orderId: string;
  planName: string;
  dataGb: number;
}): Promise<SendResult> {
  const { userId, orderId, planName, dataGb } = params;

  return sendPushNotification({
    userId,
    orderId,
    title: 'Your eSIM is Ready!',
    body: `Your ${planName} (${dataGb} GB) eSIM is ready to install. Tap to view installation instructions.`,
    notificationType: 'esim_ready',
    data: {
      orderName: planName,
    },
  });
}

/**
 * Send eSIM activated push notification
 */
export async function sendEsimActivatedPush(params: {
  userId: string;
  orderId: string;
  planName: string;
}): Promise<SendResult> {
  const { userId, orderId, planName } = params;

  return sendPushNotification({
    userId,
    orderId,
    title: 'eSIM Activated',
    body: `Your ${planName} eSIM is now active. Enjoy your travels!`,
    notificationType: 'esim_activated',
    data: {
      orderName: planName,
    },
  });
}

/**
 * Check push notification receipts (call periodically to handle errors)
 * This should be called via a cron job to check delivery status
 */
export async function checkPushReceipts(ticketIds: string[]): Promise<void> {
  if (ticketIds.length === 0) return;

  const expo = getExpoClient();
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'ok') {
          continue;
        }

        if (receipt.status === 'error') {
          console.error(`[Push] Receipt error for ${receiptId}:`, receipt.message);

          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Token is no longer valid - should clean up
            console.log(`[Push] Device no longer registered for receipt ${receiptId}`);
          }
        }
      }
    } catch (error) {
      console.error('[Push] Error fetching receipts:', error);
    }
  }
}
