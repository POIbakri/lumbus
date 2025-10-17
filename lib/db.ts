import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
// Support both SUPABASE_SERVICE_ROLE_KEY (standard) and SUPABASE_SERVICE_KEY (legacy) for backward compatibility
// Strip whitespace and newlines that may have been introduced during copy-paste
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxOTI1MDM1MjAwfQ.placeholder'
).replace(/\s+/g, '');

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type OrderStatus = 'pending' | 'paid' | 'provisioning' | 'completed' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'revoked' | 'failed';
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'VOID';
export type RewardStatus = 'PENDING' | 'APPLIED' | 'EXPIRED' | 'VOID';
export type PayoutStatus = 'CREATED' | 'PROCESSING' | 'PAID' | 'FAILED';
export type AttributionSource = 'AFFILIATE' | 'REFERRAL' | 'DIRECT';
export type CommissionType = 'PERCENT' | 'FIXED';
export type RewardType = 'FREE_DATA' | 'DISCOUNT' | 'CREDIT';
export type PayoutMethod = 'WISE' | 'PAYPAL' | 'BANK' | 'OTHER';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  ref_code: string;
  referred_by_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  region_code: string;
  data_gb: number;
  validity_days: number;
  supplier_sku: string;
  retail_price: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  plan_id: string;
  status: OrderStatus;
  stripe_session_id: string | null;
  connect_order_id: string | null;
  qr_url: string | null;
  smdp: string | null;
  activation_code: string | null;
  iccid: string | null;
  esim_tran_no: string | null;
  data_usage_bytes: number | null;
  data_remaining_bytes: number | null;
  last_usage_update: string | null;
  activated_at: string | null;
  amount_cents?: number;
  currency?: string;
  paid_at?: string | null;
  country_code?: string | null;
  created_at: string;
  updated_at?: string;
}

export type AffiliateApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Affiliate {
  id: string;
  user_id: string | null;
  display_name: string;
  slug: string;
  commission_type: CommissionType;
  commission_value: number;
  is_active: boolean;
  notes: string | null;
  email: string | null;
  website: string | null;
  audience_description: string | null;
  traffic_sources: string | null;
  promotional_methods: string | null;
  application_status: AffiliateApplicationStatus;
  applied_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: number;
  affiliate_id: string | null;
  ref_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  user_agent: string | null;
  ip_address: string | null;
  landing_path: string | null;
  session_id: string | null;
  created_at: string;
}

export interface OrderAttribution {
  order_id: string;
  source_type: AttributionSource;
  affiliate_id: string | null;
  referrer_user_id: string | null;
  ref_code: string | null;
  click_id: number | null;
  created_at: string;
}

export interface AffiliateCommission {
  id: string;
  order_id: string;
  affiliate_id: string;
  amount_cents: number;
  status: CommissionStatus;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  notes: string | null;
}

export interface ReferralReward {
  id: string;
  order_id: string;
  referrer_user_id: string;
  referred_user_id: string;
  reward_type: RewardType;
  reward_value: number;
  status: RewardStatus;
  created_at: string;
  applied_at: string | null;
  expired_at: string | null;
  voided_at: string | null;
  notes: string | null;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  total_cents: number;
  method: PayoutMethod;
  destination: string;
  status: PayoutStatus;
  created_at: string;
  processing_at: string | null;
  paid_at: string | null;
  failed_at: string | null;
  notes: string | null;
  external_id: string | null;
}

export interface FraudFlag {
  id: string;
  entity_type: 'CLICK' | 'ORDER' | 'USER' | 'AFFILIATE';
  entity_id: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  notes: string | null;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  payload_json: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
}
