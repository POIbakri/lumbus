/**
 * Secure Order Access Tokens
 *
 * Generates short-lived JWT tokens for accessing order details
 * without authentication. Used for post-purchase access before
 * user sets up their account.
 */

import jwt from 'jsonwebtoken';

function getSecret(): string {
  const secret = process.env.ORDER_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'ORDER_TOKEN_SECRET or JWT_SECRET environment variable must be set. ' +
      'Generate a secure secret with: openssl rand -base64 32'
    );
  }
  return secret;
}
const TOKEN_EXPIRY = '1h'; // 1 hour - enough time to view order after purchase

interface OrderTokenPayload {
  orderId: string;
  userId: string;
  type: 'order_access';
}

/**
 * Generate a secure token for accessing an order
 * Token is valid for 1 hour after purchase
 */
export function generateOrderAccessToken(orderId: string, userId: string): string {
  const payload: OrderTokenPayload = {
    orderId,
    userId,
    type: 'order_access',
  };

  return jwt.sign(payload, getSecret(), {
    expiresIn: TOKEN_EXPIRY,
    issuer: 'lumbus',
  });
}

/**
 * Verify and decode an order access token
 * Returns the payload if valid, null if invalid/expired
 */
export function verifyOrderAccessToken(token: string): OrderTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      issuer: 'lumbus',
    }) as OrderTokenPayload;

    // Verify it's the right token type
    if (decoded.type !== 'order_access') {
      return null;
    }

    return decoded;
  } catch (error) {
    // Token invalid, expired, or malformed
    return null;
  }
}
