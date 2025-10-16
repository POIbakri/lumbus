/**
 * Database Setup Verification Script
 *
 * This script verifies that the database has all required tables and columns
 * for the Lumbus eSIM marketplace.
 *
 * Usage: npx ts-node scripts/verify-database.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TableCheck {
  name: string;
  required: boolean;
  columns?: string[];
}

const REQUIRED_TABLES: TableCheck[] = [
  {
    name: 'users',
    required: true,
    columns: ['id', 'email', 'created_at', 'referral_code']
  },
  {
    name: 'plans',
    required: true,
    columns: ['id', 'name', 'region_code', 'data_gb', 'validity_days', 'retail_price', 'currency', 'supplier_sku', 'is_active']
  },
  {
    name: 'orders',
    required: true,
    columns: [
      'id', 'user_id', 'plan_id', 'status', 'amount_cents', 'currency',
      'stripe_session_id', 'connect_order_id', 'iccid', 'esim_tran_no',
      'smdp', 'activation_code', 'qr_url', 'data_usage_bytes',
      'data_remaining_bytes', 'last_usage_update', 'activated_at',
      'paid_at', 'created_at'
    ]
  },
  {
    name: 'affiliates',
    required: true,
    columns: ['id', 'user_id', 'display_name', 'slug', 'commission_type', 'commission_value', 'is_active', 'created_at']
  },
  {
    name: 'affiliate_clicks',
    required: true,
    columns: ['id', 'affiliate_id', 'session_id', 'ip_address', 'user_agent', 'country_code', 'clicked_at']
  },
  {
    name: 'commissions',
    required: true,
    columns: ['id', 'order_id', 'affiliate_id', 'amount_cents', 'currency', 'status', 'created_at', 'voided_at']
  },
  {
    name: 'referrals',
    required: true,
    columns: ['id', 'referrer_user_id', 'referred_user_id', 'order_id', 'reward_cents', 'currency', 'status', 'created_at', 'voided_at']
  },
  {
    name: 'order_attributions',
    required: true,
    columns: ['id', 'order_id', 'affiliate_id', 'affiliate_click_id', 'referrer_user_id', 'session_id', 'created_at']
  },
  {
    name: 'fraud_checks',
    required: true,
    columns: ['id', 'order_id', 'user_id', 'check_type', 'severity', 'details', 'created_at']
  },
  {
    name: 'webhook_idempotency',
    required: true,
    columns: ['idempotency_key', 'webhook_type', 'response_data', 'created_at']
  },
  {
    name: 'webhook_events',
    required: true,
    columns: ['id', 'provider', 'event_type', 'payload_json', 'processed_at', 'created_at']
  },
];

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    return error === null;
  } catch {
    return false;
  }
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    return error === null;
  } catch {
    return false;
  }
}

async function verifyDatabase() {
  console.log('🔍 Starting database verification...\n');

  let hasErrors = false;
  let warnings = 0;

  for (const table of REQUIRED_TABLES) {
    const exists = await checkTableExists(table.name);

    if (!exists) {
      if (table.required) {
        console.error(`❌ CRITICAL: Table '${table.name}' does not exist`);
        hasErrors = true;
      } else {
        console.warn(`⚠️  WARNING: Table '${table.name}' does not exist (optional)`);
        warnings++;
      }
      continue;
    }

    console.log(`✅ Table '${table.name}' exists`);

    // Check columns if specified
    if (table.columns && table.columns.length > 0) {
      const missingColumns: string[] = [];

      for (const column of table.columns) {
        const columnExists = await checkColumnExists(table.name, column);
        if (!columnExists) {
          missingColumns.push(column);
        }
      }

      if (missingColumns.length > 0) {
        console.error(`   ❌ Missing columns in '${table.name}': ${missingColumns.join(', ')}`);
        hasErrors = true;
      } else {
        console.log(`   ✓ All required columns present (${table.columns.length} columns)`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    console.error('\n❌ DATABASE VERIFICATION FAILED');
    console.error('\nYou need to run the database migrations:');
    console.error('  npm run db:migrate');
    console.error('\nOr manually apply the migration files in supabase/migrations/');
    process.exit(1);
  } else if (warnings > 0) {
    console.warn(`\n⚠️  DATABASE VERIFICATION COMPLETED WITH ${warnings} WARNING(S)`);
    console.warn('Optional tables are missing but the app should work.');
    process.exit(0);
  } else {
    console.log('\n✅ DATABASE VERIFICATION PASSED');
    console.log('All required tables and columns are present.');
    process.exit(0);
  }
}

// Run verification
verifyDatabase().catch((error) => {
  console.error('\n❌ Verification script failed:', error);
  process.exit(1);
});
