/**
 * Fraud Detection & Prevention
 */

import { supabase } from './db';
import type { FraudFlag } from './db';

// =====================================================
// FRAUD DETECTION RULES
// =====================================================

/**
 * Check for IP clustering (multiple orders from same subnet)
 */
export async function checkIPClustering(
  ipAddress: string,
  hours = 24
): Promise<{ isFraud: boolean; reason?: string }> {
  if (!ipAddress) {
    return { isFraud: false };
  }

  // Extract /24 subnet (first 3 octets)
  const subnet = ipAddress.split('.').slice(0, 3).join('.');

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  // Count orders from this subnet
  const { data: clicks } = await supabase
    .from('affiliate_clicks')
    .select('ip_address')
    .like('ip_address', `${subnet}%`)
    .gte('created_at', cutoff.toISOString());

  if ((clicks?.length || 0) > 10) {
    return {
      isFraud: true,
      reason: `High volume of clicks from subnet ${subnet}.* in ${hours}h`,
    };
  }

  return { isFraud: false };
}

/**
 * Check for self-referral attempts
 */
export async function checkSelfReferral(
  userId: string,
  referrerUserId: string
): Promise<{ isFraud: boolean; reason?: string }> {
  if (userId === referrerUserId) {
    return {
      isFraud: true,
      reason: 'Self-referral detected',
    };
  }

  // Additional check: same email domain (basic heuristic)
  // Note: We query from 'users' table, not 'auth.users' which is not accessible via API
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  const { data: referrerData } = await supabase
    .from('users')
    .select('email')
    .eq('id', referrerUserId)
    .single();

  if (userData?.email && referrerData?.email) {
    const userDomain = userData.email.split('@')[1];
    const referrerDomain = referrerData.email.split('@')[1];

    // Flag if same custom domain (not common providers)
    const commonProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (userDomain === referrerDomain && !commonProviders.includes(userDomain)) {
      return {
        isFraud: true,
        reason: `Potential self-referral: same email domain ${userDomain}`,
      };
    }
  }

  return { isFraud: false };
}

/**
 * Check velocity limits (too many commissions/rewards in short time)
 */
export async function checkVelocityLimits(
  affiliateId: string,
  maxDaily = 50
): Promise<{ isFraud: boolean; reason?: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('affiliate_commissions')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .gte('created_at', today.toISOString());

  if ((count || 0) > maxDaily) {
    return {
      isFraud: true,
      reason: `Velocity limit exceeded: ${count} commissions today (max ${maxDaily})`,
    };
  }

  return { isFraud: false };
}

/**
 * Check for device fingerprint overlap
 */
export async function checkDeviceFingerprint(
  userAgent: string
): Promise<{ isFraud: boolean; reason?: string }> {
  if (!userAgent) {
    return { isFraud: false };
  }

  // Count how many different sessions have the exact same UA
  const { data: clicks } = await supabase
    .from('affiliate_clicks')
    .select('session_id')
    .eq('user_agent', userAgent);

  // If same UA appears across >5 different sessions, flag
  if (clicks && clicks.length > 5) {
    const uniqueSessions = new Set(clicks.map(c => c.session_id));
    if (uniqueSessions.size > 5) {
      return {
        isFraud: true,
        reason: `Device fingerprint overlap: UA seen across ${uniqueSessions.size} sessions`,
      };
    }
  }

  return { isFraud: false };
}

/**
 * Check for geo mismatches
 */
export async function checkGeoMismatch(
  affiliateId: string,
  orderCountryCode: string
): Promise<{ isFraud: boolean; reason?: string }> {
  // Get affiliate's typical order countries
  const { data: attributions } = await supabase
    .from('order_attributions')
    .select(`
      order_id,
      orders!inner(country_code)
    `)
    .eq('affiliate_id', affiliateId)
    .limit(20);

  if (!attributions || attributions.length < 10) {
    return { isFraud: false }; // Not enough data
  }

  // Count country distribution
  const countries: Record<string, number> = {};
  attributions.forEach((attr: any) => {
    const code = attr.orders?.country_code;
    if (code) {
      countries[code] = (countries[code] || 0) + 1;
    }
  });

  // If current order country never appeared before, flag
  if (!countries[orderCountryCode]) {
    return {
      isFraud: true,
      reason: `Geo mismatch: order from ${orderCountryCode}, affiliate usually serves ${Object.keys(countries).join(', ')}`,
    };
  }

  return { isFraud: false };
}

// =====================================================
// FRAUD FLAG MANAGEMENT
// =====================================================

/**
 * Create a fraud flag
 */
export async function createFraudFlag(
  entityType: 'CLICK' | 'ORDER' | 'USER' | 'AFFILIATE',
  entityId: string,
  reason: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
): Promise<FraudFlag | null> {
  const { data, error } = await supabase
    .from('fraud_flags')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      reason,
      severity,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create fraud flag:', error);
    return null;
  }

  // Log to monitoring
  console.warn(`[FRAUD] ${severity} flag created: ${entityType} ${entityId} - ${reason}`);

  return data as FraudFlag;
}

/**
 * Resolve a fraud flag
 */
export async function resolveFraudFlag(
  flagId: string,
  notes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('fraud_flags')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', flagId);

  return !error;
}

/**
 * Get unresolved fraud flags
 */
export async function getUnresolvedFlags(
  entityType?: 'CLICK' | 'ORDER' | 'USER' | 'AFFILIATE'
): Promise<FraudFlag[]> {
  let query = supabase
    .from('fraud_flags')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data } = await query;
  return (data || []) as FraudFlag[];
}

/**
 * Run all fraud checks for an order
 */
export async function runFraudChecks(params: {
  orderId: string;
  userId: string;
  affiliateId?: string;
  referrerUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  countryCode?: string;
}): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  // Check IP clustering
  if (params.ipAddress) {
    const ipCheck = await checkIPClustering(params.ipAddress);
    if (ipCheck.isFraud) {
      const flag = await createFraudFlag('ORDER', params.orderId, ipCheck.reason!, 'HIGH');
      if (flag) flags.push(flag);
    }
  }

  // Check self-referral
  if (params.referrerUserId) {
    const selfRefCheck = await checkSelfReferral(params.userId, params.referrerUserId);
    if (selfRefCheck.isFraud) {
      const flag = await createFraudFlag('ORDER', params.orderId, selfRefCheck.reason!, 'CRITICAL');
      if (flag) flags.push(flag);
    }
  }

  // Check velocity limits
  if (params.affiliateId) {
    const velocityCheck = await checkVelocityLimits(params.affiliateId);
    if (velocityCheck.isFraud) {
      const flag = await createFraudFlag('AFFILIATE', params.affiliateId, velocityCheck.reason!, 'HIGH');
      if (flag) flags.push(flag);
    }
  }

  // Check device fingerprint
  if (params.userAgent) {
    const deviceCheck = await checkDeviceFingerprint(params.userAgent);
    if (deviceCheck.isFraud) {
      const flag = await createFraudFlag('USER', params.userId, deviceCheck.reason!, 'MEDIUM');
      if (flag) flags.push(flag);
    }
  }

  // Check geo mismatch
  if (params.affiliateId && params.countryCode) {
    const geoCheck = await checkGeoMismatch(params.affiliateId, params.countryCode);
    if (geoCheck.isFraud) {
      const flag = await createFraudFlag('AFFILIATE', params.affiliateId, geoCheck.reason!, 'LOW');
      if (flag) flags.push(flag);
    }
  }

  return flags;
}
