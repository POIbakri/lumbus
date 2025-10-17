/**
 * eSIM Access API Integration
 * Reference: https://docs.esimaccess.com
 * API Version: v1.6 (Dec 20, 2024)
 * Rate Limit: 8 requests per second (global)
 *
 * Production-ready implementation with:
 * - Rate limiting (8 req/s)
 * - Retry logic with exponential backoff
 * - Error code mapping
 * - Idempotency support
 */

const ESIMACCESS_API_URL = process.env.ESIMACCESS_API_URL || 'https://api.esimaccess.com/api/v1/open';
const ESIMACCESS_ACCESS_CODE = process.env.ESIMACCESS_ACCESS_CODE || '';

// Rate limiter: 8 requests per second max
let requestsInLastSecond = 0;
let lastResetTime = Date.now();

const RATE_LIMIT = 8;
const RATE_WINDOW = 1000; // 1 second

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      const now = Date.now();

      // Reset counter if we're in a new time window
      if (now - lastResetTime >= RATE_WINDOW) {
        requestsInLastSecond = 0;
        lastResetTime = now;
      }

      // If we're under the limit, execute immediately
      if (requestsInLastSecond < RATE_LIMIT) {
        requestsInLastSecond++;
        try {
          const response = await fetch(url, options);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      } else {
        // Queue the request and retry in the next window
        setTimeout(execute, RATE_WINDOW - (now - lastResetTime));
      }
    };

    execute();
  });
}

export interface EsimAccessPackage {
  packageId: string;
  name: string;
  data: string;
  validity: string;
  price: number;
  currency: string;
  countries: string[];
}

export interface EsimAccessAssignRequest {
  packageId: string;
  email?: string;
  reference?: string; // Your internal order ID
}

export interface EsimAccessAssignResponse {
  orderId: string;
  iccid: string;
  smdpAddress: string;
  activationCode: string;
  qrCode?: string;
  status: 'active' | 'pending' | 'failed';
}

export interface EsimAccessOrderStatus {
  orderId: string;
  iccid: string;
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  dataRemaining?: number;
  validUntil?: string;
}

export interface EsimAccessResponse<T> {
  success: boolean;
  errorCode: string;
  errorMsg: string | null;
  obj?: T;
}

/**
 * Make an authenticated request to eSIM Access API with retry logic
 */
async function makeEsimAccessRequest<T>(
  endpoint: string,
  body: any = {},
  retries = 3
): Promise<T> {
  const url = `${ESIMACCESS_API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'RT-AccessCode': ESIMACCESS_ACCESS_CODE,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[eSIM Access] Making request to: ${url}`);
      console.log(`[eSIM Access] Headers:`, headers);
      console.log(`[eSIM Access] Body:`, JSON.stringify(body));

      const response = await rateLimitedFetch(url, {
        method: 'POST', // eSIM Access API uses POST for all requests
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(`[eSIM Access] HTTP ${response.status} error for ${url}`);
        const errorText = await response.text();
        console.error(`[eSIM Access] Error response:`, errorText);

        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { errorCode: response.status.toString(), errorMsg: errorText || 'Unknown error' };
        }

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `eSIM Access API error: ${error.errorCode || response.status} - ${error.errorMsg || 'Request failed'}`
          );
        }

        throw new Error(`HTTP ${response.status}`);
      }

      const data: EsimAccessResponse<T> = await response.json();

      console.log('[eSIM Access] Response data:', JSON.stringify(data));

      // Check for success: either success=true OR errorCode is null/'0'
      const isSuccess = data.success === true || data.errorCode === null || data.errorCode === '0';

      if (!isSuccess) {
        // Map critical error codes
        switch (data.errorCode) {
          case '200007':
            throw new Error('INSUFFICIENT_BALANCE: Account balance too low');
          case '200011':
            throw new Error('INSUFFICIENT_PROFILES: Package temporarily unavailable');
          case '310241':
          case '310243':
            throw new Error('INVALID_PACKAGE: Package code does not exist');
          case '900001':
            // System busy - retry with backoff
            if (attempt < retries - 1) {
              const backoff = Math.pow(2, attempt) * 500 + Math.random() * 500; // jitter
              await new Promise(resolve => setTimeout(resolve, backoff));
              continue;
            }
            throw new Error('SYSTEM_BUSY: Service temporarily unavailable');
          default:
            throw new Error(
              `eSIM Access API error: ${data.errorCode} - ${data.errorMsg || 'Request failed'}`
            );
        }
      }

      console.log('[eSIM Access] Success! Returning data.obj');
      return data.obj!;
    } catch (error) {
      lastError = error as Error;

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries - 1 || (error as Error).message.includes('INSUFFICIENT_') || (error as Error).message.includes('INVALID_')) {
        throw error;
      }

      // Exponential backoff with jitter
      const backoff = Math.pow(2, attempt) * 500 + Math.random() * 500;
      console.log(`Retry attempt ${attempt + 1}/${retries} after ${backoff}ms`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Get merchant account balance
 */
export async function getMerchantBalance(): Promise<{ balance: number; currency: string }> {
  try {
    const data = await makeEsimAccessRequest<{ balance: number; currency?: string }>('/balance/query', {});

    return {
      balance: data.balance || 0,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error('getMerchantBalance error:', error);
    throw error;
  }
}

/**
 * List supported countries and regions
 */
export async function listSupportedRegions(): Promise<Array<{
  code: string;
  name: string;
  type: number;
  subLocationList: Array<{ code: string; name: string }> | null;
}>> {
  try {
    const data = await makeEsimAccessRequest<{
      locationList: Array<{
        code: string;
        name: string;
        type: number;
        subLocationList: Array<{ code: string; name: string }> | null;
      }>
    }>('/location/list', {});

    return data.locationList || [];
  } catch (error) {
    console.error('listSupportedRegions error:', error);
    throw error;
  }
}

/**
 * List available eSIM packages
 * Endpoint: /api/v1/open/package/list
 */
export async function listPackages(regionCode?: string): Promise<EsimAccessPackage[]> {
  try {
    const body: any = {};
    if (regionCode) {
      body.location = regionCode;
    }

    const data = await makeEsimAccessRequest<{
      packageList: Array<{
        packageCode: string;
        slug?: string;
        name: string;
        data: string;
        validity: string;
        price: number;
        currency: string;
        locationList: Array<{ code: string; name: string }>;
      }>;
    }>('/package/list', body);

    return (data.packageList || []).map(pkg => ({
      packageId: pkg.packageCode,
      name: pkg.name,
      data: pkg.data,
      validity: pkg.validity,
      price: pkg.price,
      currency: pkg.currency,
      countries: pkg.locationList?.map(loc => loc.code) || [],
    }));
  } catch (error) {
    console.error('listPackages error:', error);
    throw error;
  }
}

/**
 * Order Profiles (Assign/Purchase eSIMs)
 * This is called after successful Stripe payment
 * Endpoint: /api/v1/open/esim/order
 *
 * Request format (batch ordering):
 * {
 *   "packageInfoList": [
 *     {
 *       "packageCode": "P0B2MJ9JR",
 *       "count": 1,
 *       "transactionId": "your-order-id"  // Optional for webhook correlation
 *     }
 *   ]
 * }
 */
export async function assignEsim(
  request: EsimAccessAssignRequest
): Promise<EsimAccessAssignResponse> {
  try {
    const requestBody: any = {
      packageInfoList: [
        {
          packageCode: request.packageId,
          count: 1, // Use 'count' not 'quantity'
          // Optional fields:
          // price: number,  // optional price override
          // amount: number, // optional amount override
          // periodNum: number, // for daypass plans (v1.5+)
        },
      ],
    };

    // Add transactionId at root level if provided (for webhook correlation)
    if (request.reference) {
      requestBody.transactionId = request.reference;
    }

    const data = await makeEsimAccessRequest<{
      orderNo: string;
      transactionId?: string;
      detailList?: Array<{
        esimTranNo: string;
        iccid?: string;
        eid?: string;
        activationCode?: string;
        confirmationCode?: string;
        qrUrl?: string;
      }>;
    }>('/esim/order', requestBody);

    // Order is created successfully
    // Activation details will come later via:
    // 1. Webhook (ORDER_STATUS with GOT_RESOURCE), or
    // 2. Polling orderQuery(orderNo) until status is GOT_RESOURCE

    console.log('[eSIM Access] Order created successfully:', data.orderNo);
    console.log('[eSIM Access] Waiting for ORDER_STATUS webhook with activation details...');

    const firstProfile = data.detailList?.[0];

    return {
      orderId: data.orderNo,
      iccid: firstProfile?.iccid || '',
      smdpAddress: '', // Will be populated via webhook or orderQuery
      activationCode: firstProfile?.activationCode || '',
      qrCode: firstProfile?.qrUrl,
      status: 'pending', // Initial status; wait for GOT_RESOURCE
    };
  } catch (error) {
    console.error('assignEsim error:', error);
    throw error;
  }
}

/**
 * Query order status and retrieve activation details
 * Endpoint: /api/v1/open/esim/query
 *
 * Poll this after orderProfiles() until orderStatus === 'GOT_RESOURCE'
 * to get activation codes and QR URL
 */
export async function getOrderStatus(orderNo: string): Promise<{
  orderNo: string;
  orderStatus: string;
  detailList: Array<{
    esimTranNo: string;
    iccid: string;
    eid?: string;
    activationCode: string;
    confirmationCode: string;
    qrUrl?: string;
    status?: string;
  }>;
}> {
  try {
    const data = await makeEsimAccessRequest<any>('/esim/query', {
      orderNo: orderNo,
      pager: {
        pageNum: 1,
        pageSize: 100,
      },
    });

    return data;
  } catch (error) {
    console.error('getOrderStatus error:', error);
    throw error;
  }
}

/**
 * Check eSIM data usage
 * Returns data usage for up to 10 eSIMs
 * Note: Data usage updates every 2-3 hours (not real-time)
 */
export async function checkEsimUsage(esimTranNos: string[]): Promise<Array<{
  esimTranNo: string;
  dataUsage: number; // in bytes
  totalData: number; // in bytes
  lastUpdateTime: string;
}>> {
  try {
    if (esimTranNos.length > 10) {
      throw new Error('Maximum 10 eSIMs can be queried at once');
    }

    const data = await makeEsimAccessRequest<{
      esimUsageList: Array<{
        esimTranNo: string;
        dataUsage: number;
        totalData: number;
        lastUpdateTime: string;
      }>;
    }>('/esim/usage/query', {
      esimTranNoList: esimTranNos,
    });

    return data.esimUsageList || [];
  } catch (error) {
    console.error('checkEsimUsage error:', error);
    throw error;
  }
}

/**
 * Get eSIM details by ICCID
 * Note: This endpoint may not exist in eSIM Access API
 * Use orderQuery() with orderNo or checkEsimUsage() with esimTranNo instead
 */
export async function getEsimByIccid(iccid: string): Promise<EsimAccessOrderStatus> {
  try {
    console.warn('getEsimByIccid: No public endpoint available. Use orderQuery() or checkEsimUsage() instead.');
    throw new Error('Not implemented: Use orderQuery() with orderNo instead');
  } catch (error) {
    console.error('getEsimByIccid error:', error);
    throw error;
  }
}

/**
 * Top up an existing eSIM
 * Endpoint: /api/v1/open/esim/topup
 * Added in API v1.2 (Jul 26, 2023)
 */
export async function topUpEsim(iccid: string, packageCode: string): Promise<{
  success: boolean;
  orderNo?: string;
}> {
  try {
    const data = await makeEsimAccessRequest<any>('/esim/topup', {
      iccid,
      packageCode, // or slug (v1.3+)
    });

    return {
      success: true,
      orderNo: data.orderNo || data.orderId,
    };
  } catch (error) {
    console.error('topUpEsim error:', error);
    throw error;
  }
}

/**
 * Cancel an eSIM order
 * Endpoint: /api/v1/open/esim/cancel
 */
export async function cancelEsim(orderNo: string): Promise<{ success: boolean }> {
  try {
    await makeEsimAccessRequest<any>('/esim/cancel', {
      orderNo,
    });

    return { success: true };
  } catch (error) {
    console.error('cancelEsim error:', error);
    throw error;
  }
}

/**
 * Suspend an eSIM (pause service)
 * Endpoint: /api/v1/open/esim/suspend
 */
export async function suspendEsim(iccid: string): Promise<{ success: boolean }> {
  try {
    await makeEsimAccessRequest<any>('/esim/suspend', {
      iccid,
    });

    return { success: true };
  } catch (error) {
    console.error('suspendEsim error:', error);
    throw error;
  }
}

/**
 * Unsuspend an eSIM (resume service)
 * Endpoint: /api/v1/open/esim/unsuspend
 */
export async function unsuspendEsim(iccid: string): Promise<{ success: boolean }> {
  try {
    await makeEsimAccessRequest<any>('/esim/unsuspend', {
      iccid,
    });

    return { success: true };
  } catch (error) {
    console.error('unsuspendEsim error:', error);
    throw error;
  }
}

/**
 * Revoke an eSIM (permanently remove profile)
 * Endpoint: /api/v1/open/esim/revoke
 */
export async function revokeEsim(iccid: string): Promise<{ success: boolean }> {
  try {
    await makeEsimAccessRequest<any>('/esim/revoke', {
      iccid,
    });

    return { success: true };
  } catch (error) {
    console.error('revokeEsim error:', error);
    throw error;
  }
}

/**
 * Generate QR code for eSIM installation
 * Some APIs provide this in the assign response, others have a separate endpoint
 */
export function generateQrCodeData(smdpAddress: string, activationCode: string): string {
  // Standard eSIM QR code format (LPA:1$ format)
  return `LPA:1$${smdpAddress}$${activationCode}`;
}
