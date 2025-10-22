/**
 * Referral & Affiliate System Utilities
 */

import { supabase } from './db';
import type {
  UserProfile,
  Affiliate,
  AffiliateClick,
  OrderAttribution,
  AttributionSource
} from './db';

// =====================================================
// REFERRAL CODE GENERATION
// =====================================================

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove confusing chars (0,O,1,I)

/**
 * Generate a unique 8-character referral code
 */
export async function generateUniqueRefCode(maxAttempts = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Array.from({ length: 8 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');

    // Check uniqueness
    const { data } = await supabase
      .from('user_profiles')
      .select('ref_code')
      .eq('ref_code', code)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  throw new Error(`Failed to generate unique ref_code after ${maxAttempts} attempts`);
}

/**
 * Generate a unique affiliate slug
 */
export async function generateUniqueSlug(baseName: string, maxAttempts = 10): Promise<string> {
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    const { data } = await supabase
      .from('affiliates')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) {
      return slug;
    }
  }

  throw new Error(`Failed to generate unique slug after ${maxAttempts} attempts`);
}

// =====================================================
// USER PROFILE MANAGEMENT
// =====================================================

/**
 * Get or create user profile with ref_code
 */
export async function ensureUserProfile(userId: string): Promise<UserProfile> {
  try {
    console.log('[ensureUserProfile] Checking profile for user:', userId);

    // Try to get existing profile
    const { data: existing, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found", which is fine - we'll create one
      console.error('[ensureUserProfile] Error fetching profile:', fetchError);
    }

    if (existing) {
      console.log('[ensureUserProfile] Profile exists:', existing.ref_code);
      return existing as UserProfile;
    }

    // Create new profile with unique ref_code
    console.log('[ensureUserProfile] Generating ref code...');
    const refCode = await generateUniqueRefCode();
    console.log('[ensureUserProfile] Generated ref code:', refCode);

    console.log('[ensureUserProfile] Creating profile...');
    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ref_code: refCode,
      })
      .select()
      .single();

    if (error) {
      console.error('[ensureUserProfile] Insert error:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    console.log('[ensureUserProfile] Profile created successfully');
    return newProfile as UserProfile;
  } catch (error) {
    console.error('[ensureUserProfile] Unexpected error:', error);
    throw error;
  }
}

/**
 * Link a user to their referrer
 */
export async function linkReferrer(userId: string, refCode: string): Promise<boolean> {
  // Find the referrer
  const { data: referrerProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('ref_code', refCode)
    .maybeSingle();

  if (!referrerProfile) {
    return false; // Invalid ref code
  }

  // Don't allow self-referral
  if (referrerProfile.id === userId) {
    return false;
  }

  // Update user's profile
  const { error } = await supabase
    .from('user_profiles')
    .update({ referred_by_code: refCode })
    .eq('id', userId)
    .is('referred_by_code', null); // Only set if not already set

  return !error;
}

// =====================================================
// CLICK TRACKING
// =====================================================

export interface TrackClickParams {
  affiliateSlug?: string;
  refCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  userAgent?: string;
  ipAddress?: string;
  landingPath?: string;
  sessionId: string;
}

/**
 * Track an affiliate or referral click
 */
export async function trackClick(params: TrackClickParams): Promise<AffiliateClick | null> {
  let affiliateId: string | null = null;

  // Resolve affiliate by slug
  if (params.affiliateSlug) {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('slug', params.affiliateSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (affiliate) {
      affiliateId = affiliate.id;
    }
  }

  // Insert click record
  const { data: click, error } = await supabase
    .from('affiliate_clicks')
    .insert({
      affiliate_id: affiliateId,
      ref_code: params.refCode || null,
      utm_source: params.utmSource || null,
      utm_medium: params.utmMedium || null,
      utm_campaign: params.utmCampaign || null,
      utm_content: params.utmContent || null,
      utm_term: params.utmTerm || null,
      user_agent: params.userAgent || null,
      ip_address: params.ipAddress || null,
      landing_path: params.landingPath || null,
      session_id: params.sessionId,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to track click:', error);
    return null;
  }

  return click as AffiliateClick;
}

// =====================================================
// ATTRIBUTION RESOLUTION
// =====================================================

export interface AttributionCookies {
  afid?: string; // affiliate click ID
  rfcd?: string; // referral code
}

export interface ResolvedAttribution {
  source_type: AttributionSource;
  affiliate_id?: string;
  referrer_user_id?: string;
  ref_code?: string;
  click_id?: number;
}

/**
 * Resolve attribution based on cookies and user context
 */
export async function resolveAttribution(
  cookies: AttributionCookies,
  userId: string,
  lastTouchDays = 14
): Promise<ResolvedAttribution> {
  // Priority 1: Affiliate (if click within last-touch window)
  if (cookies.afid) {
    const clickId = parseInt(cookies.afid, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lastTouchDays);

    const { data: click } = await supabase
      .from('affiliate_clicks')
      .select('id, affiliate_id')
      .eq('id', clickId)
      .gte('created_at', cutoff.toISOString())
      .maybeSingle();

    if (click && click.affiliate_id) {
      return {
        source_type: 'AFFILIATE',
        affiliate_id: click.affiliate_id,
        click_id: click.id,
      };
    }
  }

  // Priority 2: Referral (if valid ref code and not self-referral)
  if (cookies.rfcd) {
    const { data: referrerProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('ref_code', cookies.rfcd)
      .maybeSingle();

    if (referrerProfile && referrerProfile.id !== userId) {
      return {
        source_type: 'REFERRAL',
        referrer_user_id: referrerProfile.id,
        ref_code: cookies.rfcd,
      };
    }
  }

  // Default: Direct
  return {
    source_type: 'DIRECT',
  };
}

/**
 * Save order attribution
 */
export async function saveOrderAttribution(
  orderId: string,
  attribution: ResolvedAttribution
): Promise<OrderAttribution | null> {
  const { data, error } = await supabase
    .from('order_attributions')
    .insert({
      order_id: orderId,
      source_type: attribution.source_type,
      affiliate_id: attribution.affiliate_id || null,
      referrer_user_id: attribution.referrer_user_id || null,
      ref_code: attribution.ref_code || null,
      click_id: attribution.click_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save attribution:', error);
    return null;
  }

  return data as OrderAttribution;
}

// =====================================================
// AFFILIATE MANAGEMENT
// =====================================================

/**
 * Get affiliate by slug
 */
export async function getAffiliateBySlug(slug: string): Promise<Affiliate | null> {
  const { data } = await supabase
    .from('affiliates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  return data as Affiliate | null;
}

/**
 * Get affiliate by user ID
 */
export async function getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
  const { data } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return data as Affiliate | null;
}

// =====================================================
// REFERRAL STATS
// =====================================================

export interface ReferralStats {
  total_clicks: number;
  total_signups: number;
  pending_rewards: number;
  earned_rewards: number;
}

/**
 * Get referral stats for a user
 */
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  // Get user's ref code
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ref_code')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return {
      total_clicks: 0,
      total_signups: 0,
      pending_rewards: 0,
      earned_rewards: 0,
    };
  }

  // Count total clicks with ref code
  const { count: totalClicks } = await supabase
    .from('affiliate_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('ref_code', profile.ref_code);

  // Count total signups (users who used this ref code)
  const { count: totalSignups } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by_code', profile.ref_code);

  // Get rewards
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('status, reward_value')
    .eq('referrer_user_id', userId);

  const pendingRewards = rewards?.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.reward_value, 0) || 0;
  const earnedRewards = rewards?.filter(r => r.status === 'APPLIED').reduce((sum, r) => sum + r.reward_value, 0) || 0;

  return {
    total_clicks: totalClicks || 0,
    total_signups: totalSignups || 0,
    pending_rewards: pendingRewards,
    earned_rewards: earnedRewards,
  };
}

// =====================================================
// AFFILIATE STATS
// =====================================================

export interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  epc: number; // Earnings per click
}

/**
 * Get affiliate stats
 */
export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  // Count clicks
  const { count: totalClicks } = await supabase
    .from('affiliate_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId);

  // Count conversions
  const { count: totalConversions } = await supabase
    .from('order_attributions')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .eq('source_type', 'AFFILIATE');

  // Get commissions
  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('amount_cents, status')
    .eq('affiliate_id', affiliateId);

  const pendingCommissions = commissions?.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount_cents, 0) || 0;
  const approvedCommissions = commissions?.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + c.amount_cents, 0) || 0;
  const paidCommissions = commissions?.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount_cents, 0) || 0;
  const totalRevenue = pendingCommissions + approvedCommissions + paidCommissions;

  const epc = (totalClicks || 0) > 0 ? totalRevenue / (totalClicks || 1) : 0;

  return {
    totalClicks: totalClicks || 0,
    totalConversions: totalConversions || 0,
    totalRevenue,
    pendingCommissions,
    approvedCommissions,
    paidCommissions,
    epc,
  };
}
