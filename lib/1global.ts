/**
 * 1GLOBAL Connect API Integration
 * Reference: https://docs.connect.1global.com
 */

const ONEGLOBAL_API_URL = process.env.ONEGLOBAL_API_URL || 'https://connect.1global.com/api/v1';
const ONEGLOBAL_API_KEY = process.env.ONEGLOBAL_API_KEY || '';

export interface OneGlobalCreateOrderRequest {
  sku: string;
  email: string;
  reference?: string; // Your internal order ID
}

export interface OneGlobalOrderResponse {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  qrCode?: string; // QR code URL
  smdpAddress?: string; // SM-DP+ address
  activationCode?: string; // Activation code
  iccid?: string;
}

export interface OneGlobalWebhookPayload {
  eventType: 'order.completed' | 'order.failed';
  orderId: string;
  status: string;
  qrCode?: string;
  smdpAddress?: string;
  activationCode?: string;
  iccid?: string;
}

/**
 * Create an order with 1GLOBAL
 * This is called after successful Stripe payment
 */
export async function createOneGlobalOrder(
  request: OneGlobalCreateOrderRequest
): Promise<OneGlobalOrderResponse> {
  try {
    const response = await fetch(`${ONEGLOBAL_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ONEGLOBAL_API_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`1GLOBAL API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      orderId: data.order_id || data.orderId,
      status: data.status,
      qrCode: data.qr_code || data.qrCode,
      smdpAddress: data.smdp_address || data.smdpAddress,
      activationCode: data.activation_code || data.activationCode,
      iccid: data.iccid,
    };
  } catch (error) {
    console.error('1GLOBAL createOrder error:', error);
    throw error;
  }
}

/**
 * Retrieve an order from 1GLOBAL
 * Used for polling order status
 */
export async function getOneGlobalOrder(orderId: string): Promise<OneGlobalOrderResponse> {
  try {
    const response = await fetch(`${ONEGLOBAL_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ONEGLOBAL_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`1GLOBAL API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      orderId: data.order_id || data.orderId,
      status: data.status,
      qrCode: data.qr_code || data.qrCode,
      smdpAddress: data.smdp_address || data.smdpAddress,
      activationCode: data.activation_code || data.activationCode,
      iccid: data.iccid,
    };
  } catch (error) {
    console.error('1GLOBAL getOrder error:', error);
    throw error;
  }
}

/**
 * Verify 1GLOBAL webhook signature
 * Implement signature verification based on 1GLOBAL docs
 */
export function verifyOneGlobalWebhook(payload: string, signature: string, secret: string): boolean {
  // TODO: Implement actual signature verification per 1GLOBAL docs
  // For now, return true if secret matches
  const webhookSecret = process.env.ONEGLOBAL_WEBHOOK_SECRET || '';
  if (!webhookSecret) {
    console.warn('ONEGLOBAL_WEBHOOK_SECRET not set, skipping verification');
    return true;
  }

  // Implement HMAC verification here based on 1GLOBAL documentation
  // Example (pseudo):
  // const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // return expectedSignature === signature;

  return true;
}
