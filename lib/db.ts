import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

// Support both SUPABASE_SERVICE_ROLE_KEY (standard) and SUPABASE_SERVICE_KEY (legacy) for backward compatibility
// Strip whitespace and newlines that may have been introduced during copy-paste
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY
)?.replace(/\s+/g, '');

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY is required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type OrderStatus = 'pending' | 'paid' | 'provisioning' | 'completed' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'revoked' | 'failed' | 'refunded';
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
  expires_at: string | null;
  amount_cents?: number;
  currency?: string;
  paid_at?: string | null;
  country_code?: string | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
  is_topup?: boolean;
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

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_percent: 10 | 20 | 30 | 40 | 50 | 100;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountCodeUsage {
  id: string;
  discount_code_id: string;
  order_id: string;
  user_id: string;
  discount_percent: number;
  original_price_usd: number;
  discount_amount_usd: number;
  final_price_usd: number;
  created_at: string;
}

export interface AppleServerNotification {
  id: string;
  notification_uuid: string;
  notification_type: string;
  subtype: string | null;
  transaction_id: string | null;
  original_transaction_id: string | null;
  web_order_line_item_id: string | null;
  order_id: string | null;
  signed_payload: string;
  decoded_payload: Record<string, unknown>;
  processed: boolean;
  processing_error: string | null;
  notification_sent_date: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface AppleNotificationProcessingLog {
  id: string;
  notification_id: string;
  attempt_number: number;
  success: boolean;
  error_message: string | null;
  processing_duration_ms: number | null;
  created_at: string;
}

// Push notification types
export type NotificationType =
  | 'data_50'
  | 'data_80'
  | 'data_90'
  | 'data_100'
  | 'validity_1_day'
  | 'validity_expired'
  | 'esim_ready'
  | 'esim_activated';

export interface UserPushToken {
  id: string;
  user_id: string;
  push_token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

export interface UsageNotificationSent {
  id: string;
  order_id: string;
  user_id: string;
  notification_type: NotificationType;
  threshold_value: number | null;
  sent_at: string;
  push_sent: boolean;
  email_sent: boolean;
}

export interface EsimUsage {
  id: string;
  order_id: string;
  data_used_bytes: number;
  data_remaining_bytes: number;
  total_bytes: number;
  usage_percent: number;
  source: 'webhook' | 'cron' | 'api_refresh';
  recorded_at: string;
}
