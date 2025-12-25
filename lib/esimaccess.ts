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
      const response = await rateLimitedFetch(url, {
        method: 'POST', // eSIM Access API uses POST for all requests
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();

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

      return data.obj!;
    } catch (error) {
      lastError = error as Error;

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries - 1 || (error as Error).message.includes('INSUFFICIENT_') || (error as Error).message.includes('INVALID_')) {
        throw error;
      }

      // Exponential backoff with jitter
      const backoff = Math.pow(2, attempt) * 500 + Math.random() * 500;
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
  request: EsimAccessAssignRequest,
  isTestMode = false
): Promise<EsimAccessAssignResponse> {
  try {
    // If test mode (for app reviewers), mock successful response
    // This prevents charging real money for reviewer tests
    if (isTestMode) {
      console.log('[eSIM Access] Test mode detected - returning mock success response');
      // Generate random mock ICCID (89 + 17 random digits) to allow multiple distinct test orders
      const randomIccid = '89' + Array.from({ length: 17 }, () => Math.floor(Math.random() * 10)).join('');
      
      return {
        orderId: `test_order_${Date.now()}`,
        iccid: randomIccid, 
        smdpAddress: 'rsp.truphone.com', // Standard SM-DP+ address
        activationCode: 'TEST-ACTIVATION-CODE',
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LPA:1$rsp.truphone.com$TEST-ACTIVATION-CODE`,
        status: 'active', // Auto-active for testing
      };
    }

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
  esimList: Array<{
    esimTranNo: string;
    orderNo: string;
    transactionId?: string;
    iccid: string;
    eid?: string;
    ac: string; // Activation code (LPA string)
    qrCodeUrl?: string;
    shortUrl?: string;
    smdpStatus?: string;
    esimStatus: string;
    msisdn?: string;
    pin?: string;
    puk?: string;
    apn?: string;
    activateTime?: string | null;
    expiredTime?: string;
    installationTime?: string | null;
    totalVolume?: number;
    totalDuration?: number;
    durationUnit?: string;
    orderUsage?: number;
    packageList?: Array<{
      packageName: string;
      packageCode: string;
      slug?: string;
      duration: number;
      volume: number;
      locationCode: string;
      createTime: string;
    }>;
  }>;
  pager?: {
    pageSize: number;
    pageNum: number;
    total: number;
  };
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
    throw error;
  }
}

/**
 * Get real-time eSIM data balance (Private API)
 * Calls the carrier's API directly for live usage data.
 *
 * Limitations:
 * - Only works for orders with status: GOT_RESOURCE, IN_USE, SUSPENDED
 * - Only works for packages with dataType = 1 (fixed data packages)
 * - Some operators and older orders may not support this
 * - Rate limit: 5 requests per second (QPS = 5)
 *
 * @param esimTranNo - The eSIM transaction number (recommended over iccid)
 * @returns Real-time balance data or null if not supported
 */
export async function getRealtimeBalance(esimTranNo: string): Promise<{
  dataBalance: {
    dataRemaining: number; // bytes
    lastUpdateTime: string;
  } | null;
  smsBalance: {
    smsMoLocalRemaining: number;
    smsMoGlobalRemaining: number;
  } | null;
  voiceBalance: {
    voiceMoLocalRemaining: number;
    voiceMoGlobalRemaining: number;
    voiceMtLocalRemaining: number;
    voiceMtGlobalRemaining: number;
    voiceMtMoSharedLocalRemaining: number;
    voiceMtMoSharedGlobalRemaining: number;
  } | null;
} | null> {
  try {
    const data = await makeEsimAccessRequest<{
      dataBalance?: {
        dataRemaining: number;
        lastUpdateTime: string;
      };
      smsBalance?: {
        smsMoLocalRemaining: number;
        smsMoGlobalRemaining: number;
      };
      voiceBalance?: {
        voiceMoLocalRemaining: number;
        voiceMoGlobalRemaining: number;
        voiceMtLocalRemaining: number;
        voiceMtGlobalRemaining: number;
        voiceMtMoSharedLocalRemaining: number;
        voiceMtMoSharedGlobalRemaining: number;
      };
    }>('/esim/realtimeBalance/query', {
      esimTranNo: esimTranNo,
    });

    return {
      dataBalance: data.dataBalance || null,
      smsBalance: data.smsBalance || null,
      voiceBalance: data.voiceBalance || null,
    };
  } catch (error: any) {
    // This API may not be supported for all eSIMs
    // Return null instead of throwing to allow graceful fallback
    console.log(`[eSIM Access] Real-time balance not available for ${esimTranNo}:`, error.message);
    return null;
  }
}

/**
 * Get eSIM details by ICCID
 * Note: This endpoint may not exist in eSIM Access API
 * Use orderQuery() with orderNo or checkEsimUsage() with esimTranNo instead
 */
export async function getEsimByIccid(iccid: string): Promise<EsimAccessOrderStatus> {
  throw new Error('Not implemented: Use orderQuery() with orderNo instead');
}

/**
 * Get available top-up packages for a specific eSIM
 * Endpoint: /api/v1/open/package/list
 * Query packages compatible with an existing eSIM
 */
export async function getTopUpPackages(params: {
  iccid?: string;
  esimTranNo?: string;
  packageCode?: string;
}): Promise<Array<{
  packageCode: string;
  slug?: string;
  name: string;
  data?: string;
  volume?: number; // Data in bytes
  validity: string;
  price: number;
  currency: string;
  locationCode: string;
}>> {
  try {
    const { iccid, esimTranNo, packageCode } = params;

    // Require either iccid or esimTranNo
    if (!iccid && !esimTranNo) {
      throw new Error('Either iccid or esimTranNo must be provided');
    }

    const requestBody: any = {};

    // Prefer esimTranNo over iccid
    if (esimTranNo) {
      requestBody.esimTranNo = esimTranNo;
    } else if (iccid) {
      requestBody.iccid = iccid;
    }

    if (packageCode) {
      requestBody.packageCode = packageCode;
    }

    const data = await makeEsimAccessRequest<{
      packageList: Array<{
        packageCode: string;
        slug?: string;
        name: string;
        data?: string;
        volume?: number; // Data in bytes
        validity: string;
        price: number;
        currency: string;
        locationCode: string;
        supportTopUpType?: number;
      }>;
    }>('/package/list', requestBody);

    // Filter out packages that explicitly don't support top-ups
    // supportTopUpType: 1 = new eSIM only, 2 = supports top-up, undefined = assume supports
    return (data.packageList || []).filter(pkg => pkg.supportTopUpType !== 1);
  } catch (error) {
    throw error;
  }
}

/**
 * Top up an existing eSIM
 * Endpoint: /api/v1/open/esim/topup
 * Added in API v1.2 (Jul 26, 2023)
 */
export async function topUpEsim(params: {
  iccid?: string;
  esimTranNo?: string;
  packageCode: string;
  transactionId: string;
  amount?: string;
  // Mock data for test mode - allows realistic simulation
  mockPlanDataGb?: number;
  mockPlanValidityDays?: number;
  mockExistingDataBytes?: number;
  mockExistingUsageBytes?: number;
  mockExistingExpiryTime?: string; // Existing expiry to extend from
}, isTestMode = false): Promise<{
  success: boolean;
  transactionId: string;
  iccid: string;
  expiredTime: string;
  totalVolume: number;
  totalDuration: number;
  orderUsage: number;
}> {
  try {
    // Mock response for test users
    if (isTestMode) {
      console.log('[eSIM Access] Test mode detected - returning mock top-up response');

      // Use provided plan data or defaults
      const planDataBytes = (params.mockPlanDataGb || 5) * 1024 * 1024 * 1024;
      const planValidityDays = params.mockPlanValidityDays || 30;
      const existingDataBytes = params.mockExistingDataBytes || 0;
      const existingUsageBytes = params.mockExistingUsageBytes || 0;
      const existingExpiryTime = params.mockExistingExpiryTime;

      // Simulate adding data to existing eSIM
      const newTotalVolume = existingDataBytes + planDataBytes;

      // Validity is cumulative: extend from existing expiry (or now if expired/not set)
      // Real API adds new validity to remaining validity, but never from a past date
      const existingExpiryMs = existingExpiryTime ? new Date(existingExpiryTime).getTime() : 0;
      const baseTime = Math.max(existingExpiryMs, Date.now()); // Never extend from past
      const newExpiry = new Date(baseTime + planValidityDays * 24 * 60 * 60 * 1000);

      return {
        success: true,
        transactionId: params.transactionId,
        // Use the provided ICCID - must match the eSIM being topped up
        iccid: params.iccid || '89000000000000000000',
        expiredTime: newExpiry.toISOString(),
        totalVolume: newTotalVolume,
        totalDuration: planValidityDays, // This is the added duration, not cumulative
        orderUsage: existingUsageBytes, // Preserve existing usage
      };
    }

    const { iccid, esimTranNo, packageCode, transactionId, amount } = params;

    // Require either iccid or esimTranNo
    if (!iccid && !esimTranNo) {
      throw new Error('Either iccid or esimTranNo must be provided');
    }

    const requestBody: any = {
      packageCode,
      transactionId,
    };

    // Use iccid OR esimTranNo (not both) - try iccid first
    if (iccid) {
      requestBody.iccid = iccid;
    } else if (esimTranNo) {
      requestBody.esimTranNo = esimTranNo;
    }
    // Note: amount is optional and can cause issues, omitting it

    console.log(`[eSIM Access] Top-up request to /esim/topup:`, JSON.stringify(requestBody, null, 2));

    const data = await makeEsimAccessRequest<{
      transactionId: string;
      iccid: string;
      expiredTime: string;
      totalVolume: number;
      totalDuration: number;
      orderUsage: number;
    }>('/esim/topup', requestBody);

    return {
      success: true,
      transactionId: data.transactionId,
      iccid: data.iccid,
      expiredTime: data.expiredTime,
      totalVolume: data.totalVolume,
      totalDuration: data.totalDuration,
      orderUsage: data.orderUsage,
    };
  } catch (error) {
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
