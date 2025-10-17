/**
 * Pre-Deployment Checklist Script
 *
 * This script verifies that all required environment variables are configured
 * and provides a comprehensive checklist before deploying to production.
 *
 * Usage: npx ts-node scripts/pre-deployment-check.ts
 */

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
}

const ENV_CHECKS: EnvCheck[] = [
  // Application
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Application URL (should be production domain)',
    validate: (val) => val.startsWith('https://') || val.startsWith('http://localhost'),
  },

  // Supabase
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validate: (val) => val.includes('supabase.co'),
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (public)',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (secret)',
  },

  // eSIM Access
  {
    key: 'ESIMACCESS_API_URL',
    required: true,
    description: 'eSIM Access API URL (should be v1/open)',
    validate: (val) => val.includes('v1/open'),
  },
  {
    key: 'ESIMACCESS_ACCESS_CODE',
    required: true,
    description: 'eSIM Access RT-AccessCode',
  },
  {
    key: 'ESIMACCESS_WEBHOOK_SECRET',
    required: false,
    description: 'eSIM Access webhook secret (recommended)',
  },

  // Stripe
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook signing secret',
    validate: (val) => val.startsWith('whsec_'),
  },

  // Email
  {
    key: 'RESEND_API_KEY',
    required: true,
    description: 'Resend API key',
    validate: (val) => val.startsWith('re_'),
  },
  {
    key: 'RESEND_FROM_EMAIL',
    required: true,
    description: 'Email sender address',
    validate: (val) => val.includes('@'),
  },

  // Admin
  {
    key: 'ADMIN_TOKEN',
    required: true,
    description: 'Admin authentication token',
    validate: (val) => val.length >= 32,
  },
];

interface CheckResult {
  passed: number;
  failed: number;
  warnings: number;
  details: Array<{
    key: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>;
}

function checkEnvironmentVariables(): CheckResult {
  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [],
  };

  for (const check of ENV_CHECKS) {
    const value = process.env[check.key];

    if (!value) {
      if (check.required) {
        result.failed++;
        result.details.push({
          key: check.key,
          status: 'fail',
          message: `Missing required variable: ${check.description}`,
        });
      } else {
        result.warnings++;
        result.details.push({
          key: check.key,
          status: 'warning',
          message: `Optional variable not set: ${check.description}`,
        });
      }
      continue;
    }

    // Validate value if validator provided
    if (check.validate && !check.validate(value)) {
      result.failed++;
      result.details.push({
        key: check.key,
        status: 'fail',
        message: `Invalid value: ${check.description}`,
      });
      continue;
    }

    result.passed++;
    result.details.push({
      key: check.key,
      status: 'pass',
      message: check.description,
    });
  }

  return result;
}

function printResults(result: CheckResult) {
  console.log('\n' + '='.repeat(70));
  console.log('LUMBUS eSIM MARKETPLACE - PRE-DEPLOYMENT CHECKLIST');
  console.log('='.repeat(70) + '\n');

  console.log('📋 Environment Variables Check:\n');

  for (const detail of result.details) {
    const icon = detail.status === 'pass' ? '✅' : detail.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${detail.key}`);
    console.log(`   ${detail.message}\n`);
  }

  console.log('='.repeat(70));
  console.log(`✅ Passed: ${result.passed}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`⚠️  Warnings: ${result.warnings}`);
  console.log('='.repeat(70) + '\n');
}

function printManualChecklist() {
  console.log('📝 MANUAL DEPLOYMENT CHECKLIST:\n');

  const manualChecks = [
    {
      section: '1. Database Setup',
      items: [
        'Run database migrations: npm run db:migrate',
        'Verify all tables exist: npx ts-node scripts/verify-database.ts',
        'Enable RLS policies in Supabase dashboard',
        'Configure service role key for API access',
      ],
    },
    {
      section: '2. eSIM Access Configuration',
      items: [
        'Sync packages from eSIM Access dashboard to database',
        'Visit /admin and click "Sync Packages from eSIM Access"',
        'Verify at least one active plan exists in plans table',
        'Check account balance is sufficient (in eSIM Access dashboard)',
        'Configure webhook URL in eSIM Access dashboard:',
        '  URL: https://yourdomain.com/api/esimaccess/webhook',
        '  Events: ORDER_STATUS, SMDP_EVENT, ESIM_STATUS, DATA_USAGE, VALIDITY_USAGE',
      ],
    },
    {
      section: '3. Stripe Configuration',
      items: [
        'Switch to production API keys (not test keys)',
        'Configure webhook endpoint in Stripe dashboard:',
        '  URL: https://yourdomain.com/api/stripe/webhook',
        '  Events: checkout.session.completed, charge.refunded',
        'Copy webhook signing secret to STRIPE_WEBHOOK_SECRET',
        'Test webhook delivery using Stripe CLI or dashboard',
      ],
    },
    {
      section: '4. Email Configuration',
      items: [
        'Verify domain in Resend dashboard',
        'Configure SPF/DKIM/DMARC records for email domain',
        'Test email delivery by making a test purchase',
        'Verify order confirmation emails are received',
      ],
    },
    {
      section: '5. Security',
      items: [
        'Generate strong ADMIN_TOKEN (32+ characters)',
        'Never commit .env.local to version control',
        'Enable HTTPS for production domain',
        'Configure CORS settings if needed',
        'Review Supabase RLS policies',
      ],
    },
    {
      section: '6. Testing',
      items: [
        'Test complete purchase flow end-to-end',
        'Verify eSIM activation codes are received',
        'Test affiliate link tracking',
        'Test referral code discount',
        'Verify webhooks are processed correctly',
        'Check order status updates in database',
        'Test email notifications',
      ],
    },
    {
      section: '7. Monitoring',
      items: [
        'Set up health check monitoring: GET /api/health',
        'Configure uptime monitoring (e.g., UptimeRobot)',
        'Set up error tracking (e.g., Sentry)',
        'Monitor webhook delivery in provider dashboards',
        'Set up alerts for failed orders',
      ],
    },
    {
      section: '8. Final Checks',
      items: [
        'Run build: npm run build',
        'Fix any TypeScript errors',
        'Review all console.error logs',
        'Test on mobile devices (iOS Safari, Android Chrome)',
        'Verify eSIM installation flow on actual device',
        'Test Apple Pay / Google Pay integration',
      ],
    },
  ];

  for (const section of manualChecks) {
    console.log(`\n${section.section}`);
    console.log('-'.repeat(70));
    for (const item of section.items) {
      if (item.startsWith('  ')) {
        console.log(`    ${item.trim()}`);
      } else {
        console.log(`  [ ] ${item}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

function main() {
  // Check if .env.local exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('❌ ERROR: .env.local file not found!');
    console.error('   Copy .env.example to .env.local and configure your variables.');
    console.error('   Command: cp .env.example .env.local\n');
    process.exit(1);
  }

  // Load environment variables from .env.local
  require('dotenv').config({ path: envPath });

  // Check environment variables
  const result = checkEnvironmentVariables();
  printResults(result);

  // Print manual checklist
  printManualChecklist();

  // Determine exit code
  if (result.failed > 0) {
    console.error('❌ PRE-DEPLOYMENT CHECK FAILED');
    console.error(`   Fix ${result.failed} failed check(s) before deploying.\n`);
    process.exit(1);
  } else if (result.warnings > 0) {
    console.warn('⚠️  PRE-DEPLOYMENT CHECK PASSED WITH WARNINGS');
    console.warn(`   Consider addressing ${result.warnings} warning(s).\n`);
    process.exit(0);
  } else {
    console.log('✅ PRE-DEPLOYMENT CHECK PASSED');
    console.log('   Environment variables are configured correctly.');
    console.log('   Complete the manual checklist above before deploying.\n');
    process.exit(0);
  }
}

main();
