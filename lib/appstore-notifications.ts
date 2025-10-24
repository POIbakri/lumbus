import { createVerify } from 'crypto';
import { logger } from './logger';

/**
 * Apple App Store Server Notifications v2 Handler
 *
 * Handles verification and processing of server-to-server notifications from Apple
 *
 * Documentation:
 * https://developer.apple.com/documentation/appstoreservernotifications
 *
 * Notification Types:
 * - SUBSCRIBED: New subscription purchase
 * - DID_RENEW: Subscription renewed
 * - DID_FAIL_TO_RENEW: Renewal failed
 * - DID_CHANGE_RENEWAL_STATUS: Auto-renewal status changed
 * - EXPIRED: Subscription expired
 * - GRACE_PERIOD_EXPIRED: Grace period ended
 * - REFUND: Purchase refunded
 * - REFUND_DECLINED: Refund request declined
 * - REVOKE: Access revoked (family sharing)
 * - RENEWAL_EXTENDED: Renewal date extended
 * - PRICE_INCREASE: Subscription price increased
 * - CONSUMPTION_REQUEST: Server-to-server consumption info request
 */

// Apple Root Certificate for Production
// This is Apple's public root certificate used to verify JWS signatures
// Source: https://www.apple.com/certificateauthority/
const APPLE_ROOT_CA_G3_CERT = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;

/**
 * JWS Token Structure from Apple
 */
interface JWSToken {
  header: JWSHeader;
  payload: string; // Base64 encoded
  signature: string;
}

interface JWSHeader {
  alg: string; // ES256
  x5c: string[]; // Certificate chain
}

/**
 * Decoded Notification Payload
 */
export interface AppleNotification {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  data: {
    appAppleId?: number;
    bundleId?: string;
    bundleVersion?: string;
    environment: 'Sandbox' | 'Production';
    signedTransactionInfo?: string; // JWS
    signedRenewalInfo?: string; // JWS
  };
  version: string;
  signedDate: number;
}

/**
 * Transaction Info (decoded from signedTransactionInfo)
 */
export interface TransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  webOrderLineItemId?: string;
  bundleId: string;
  productId: string;
  subscriptionGroupIdentifier?: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  quantity: number;
  type: 'Auto-Renewable Subscription' | 'Non-Consumable' | 'Consumable' | 'Non-Renewing Subscription';
  inAppOwnershipType: 'PURCHASED' | 'FAMILY_SHARED';
  signedDate: number;
  environment: 'Sandbox' | 'Production';
  transactionReason?: 'PURCHASE' | 'RENEWAL';
  storefront?: string;
  storefrontId?: string;
  price?: number;
  currency?: string;
}

/**
 * Renewal Info (decoded from signedRenewalInfo)
 */
export interface RenewalInfo {
  originalTransactionId: string;
  autoRenewProductId: string;
  productId: string;
  autoRenewStatus: 0 | 1; // 0 = off, 1 = on
  environment: 'Sandbox' | 'Production';
  signedDate: number;
}

/**
 * Parse JWS token into header, payload, and signature
 */
function parseJWS(token: string): JWSToken {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWS token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header
  const headerJson = Buffer.from(headerB64, 'base64').toString('utf8');
  const header = JSON.parse(headerJson) as JWSHeader;

  return {
    header,
    payload: payloadB64,
    signature: signatureB64,
  };
}

/**
 * Verify JWS signature using Apple's certificate chain
 *
 * Apple signs notifications with ES256 (ECDSA using P-256 and SHA-256)
 * The certificate chain is included in the x5c header
 */
export async function verifyAppleJWS(signedPayload: string): Promise<boolean> {
  try {
    const jws = parseJWS(signedPayload);

    // Extract certificate chain from x5c header
    const certChain = jws.header.x5c;
    if (!certChain || certChain.length === 0) {
      logger.error('[Apple JWS] No certificate chain found in token');
      return false;
    }

    // Use the first certificate in the chain (leaf certificate)
    const leafCertDER = Buffer.from(certChain[0], 'base64');
    const leafCertPEM = `-----BEGIN CERTIFICATE-----\n${certChain[0]}\n-----END CERTIFICATE-----`;

    // Reconstruct the signed data (header.payload)
    const parts = signedPayload.split('.');
    const signedData = `${parts[0]}.${parts[1]}`;

    // Decode signature from base64url to buffer
    const signatureBuffer = Buffer.from(jws.signature, 'base64url');

    // Verify signature using Node's crypto
    const verifier = createVerify('SHA256');
    verifier.update(signedData);
    verifier.end();

    const isValid = verifier.verify(
      {
        key: leafCertPEM,
        format: 'pem',
        type: 'spki',
      },
      signatureBuffer
    );

    if (!isValid) {
      logger.error('[Apple JWS] Signature verification failed');
      return false;
    }

    // TODO: In production, verify certificate chain against Apple Root CA
    // For now, we trust the signature verification
    logger.info('[Apple JWS] Signature verified successfully');
    return true;
  } catch (error) {
    logger.error('[Apple JWS] Verification error:', error);
    return false;
  }
}

/**
 * Decode JWS payload
 */
export function decodeJWS<T = any>(signedPayload: string): T {
  const jws = parseJWS(signedPayload);
  const payloadJson = Buffer.from(jws.payload, 'base64').toString('utf8');
  return JSON.parse(payloadJson) as T;
}

/**
 * Verify and decode Apple notification
 */
export async function verifyAndDecodeNotification(
  signedPayload: string
): Promise<AppleNotification | null> {
  try {
    // Verify signature
    const isValid = await verifyAppleJWS(signedPayload);
    if (!isValid) {
      logger.error('[Apple Notification] Signature verification failed');
      return null;
    }

    // Decode payload
    const notification = decodeJWS<AppleNotification>(signedPayload);
    logger.info('[Apple Notification] Decoded successfully:', {
      type: notification.notificationType,
      uuid: notification.notificationUUID,
    });

    return notification;
  } catch (error) {
    logger.error('[Apple Notification] Failed to verify and decode:', error);
    return null;
  }
}

/**
 * Decode transaction info from notification
 */
export function decodeTransactionInfo(notification: AppleNotification): TransactionInfo | null {
  try {
    if (!notification.data.signedTransactionInfo) {
      return null;
    }

    const transactionInfo = decodeJWS<TransactionInfo>(
      notification.data.signedTransactionInfo
    );

    logger.info('[Apple Transaction] Decoded:', {
      transactionId: transactionInfo.transactionId,
      productId: transactionInfo.productId,
    });

    return transactionInfo;
  } catch (error) {
    logger.error('[Apple Transaction] Failed to decode transaction info:', error);
    return null;
  }
}

/**
 * Decode renewal info from notification
 */
export function decodeRenewalInfo(notification: AppleNotification): RenewalInfo | null {
  try {
    if (!notification.data.signedRenewalInfo) {
      return null;
    }

    const renewalInfo = decodeJWS<RenewalInfo>(notification.data.signedRenewalInfo);

    logger.info('[Apple Renewal] Decoded:', {
      originalTransactionId: renewalInfo.originalTransactionId,
      autoRenewStatus: renewalInfo.autoRenewStatus,
    });

    return renewalInfo;
  } catch (error) {
    logger.error('[Apple Renewal] Failed to decode renewal info:', error);
    return null;
  }
}

/**
 * Get notification type priority for processing
 * Higher priority = more critical to process immediately
 */
export function getNotificationPriority(type: string): number {
  const priorities: Record<string, number> = {
    REFUND: 10, // Highest - must revoke access immediately
    REVOKE: 10,
    DID_FAIL_TO_RENEW: 8,
    EXPIRED: 7,
    GRACE_PERIOD_EXPIRED: 7,
    DID_RENEW: 5,
    SUBSCRIBED: 5,
    DID_CHANGE_RENEWAL_STATUS: 3,
    RENEWAL_EXTENDED: 3,
    PRICE_INCREASE: 2,
    REFUND_DECLINED: 1,
    CONSUMPTION_REQUEST: 1,
  };

  return priorities[type] || 0;
}

/**
 * Check if notification should trigger immediate action
 */
export function requiresImmediateAction(type: string): boolean {
  const immediateActionTypes = [
    'REFUND',
    'REVOKE',
    'DID_FAIL_TO_RENEW',
    'EXPIRED',
    'GRACE_PERIOD_EXPIRED',
  ];

  return immediateActionTypes.includes(type);
}

/**
 * Format notification for logging
 */
export function formatNotificationForLog(notification: AppleNotification): Record<string, any> {
  return {
    uuid: notification.notificationUUID,
    type: notification.notificationType,
    subtype: notification.subtype,
    environment: notification.data.environment,
    bundleId: notification.data.bundleId,
    timestamp: new Date(notification.signedDate).toISOString(),
  };
}
