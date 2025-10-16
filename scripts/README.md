# Deployment Scripts

This directory contains utility scripts to help with database verification, health checks, and pre-deployment validation.

## Available Scripts

### 1. Import eSIM Plans (`import-plans.ts`)

Imports eSIM Access pricing data from CSV files into your Supabase database. **You don't need to manually configure Stripe products** - the checkout flow automatically creates Stripe sessions using the plan's retail price.

**Usage:**
```bash
npx tsx scripts/import-plans.ts path/to/your-plans.csv
```

**CSV Format Required:**
```csv
name,region_code,data_gb,validity_days,supplier_sku,retail_price,currency
USA 5GB - 7 Days,US,5,7,USA-5GB-7D,9.99,USD
Europe 10GB - 15 Days,EU,10,15,EU-10GB-15D,24.99,EUR
```

**Required Columns:**
- `name` - Plan display name
- `region_code` - Country/region code (e.g., "US", "EU", "GB")
- `data_gb` - Data allowance in GB
- `validity_days` - How many days the plan is valid
- `supplier_sku` - eSIM Access package ID (MUST match their API exactly)
- `retail_price` - Your selling price
- `currency` - Currency code (USD, EUR, GBP)

**When to use:**
- Initial setup: Import all your eSIM Access plans
- Adding new plans: Add new rows to CSV and re-run
- Price updates: Update CSV and re-import (skips duplicates)

**How Stripe Works (No Manual Setup Needed):**

The checkout API automatically creates Stripe sessions with dynamic pricing:
1. User selects a plan from your database
2. Checkout API reads the `retail_price` from the plan
3. Creates Stripe session using `price_data` (no product creation needed)
4. After payment, webhook provisions eSIM using `supplier_sku`

**Example output:**
```
Parsed 50 plans from CSV

Importing 50 plans to Supabase...
✅ Imported USA-5GB-7D - USA 5GB - 7 Days
✅ Imported USA-10GB-15D - USA 10GB - 15 Days
⏭️  Skipping EU-3GB-7D - already exists

=== Import Summary ===
✅ Imported: 48
⏭️  Skipped (already exists): 2
❌ Errors: 0
📊 Total processed: 50
```

---

### 2. Database Verification (`verify-database.ts`)

Verifies that your Supabase database has all required tables and columns for the Lumbus eSIM marketplace.

**Usage:**
```bash
npm run db:verify
```

**What it checks:**
- ✅ All required tables exist (users, orders, plans, affiliates, etc.)
- ✅ All required columns exist in each table
- ✅ Reports missing tables or columns

**When to use:**
- After running database migrations
- Before deploying to production
- When troubleshooting database issues

**Example output:**
```
🔍 Starting database verification...

✅ Table 'users' exists
   ✓ All required columns present (4 columns)
✅ Table 'orders' exists
   ✓ All required columns present (19 columns)
...

✅ DATABASE VERIFICATION PASSED
All required tables and columns are present.
```

---

### 3. Pre-Deployment Check (`pre-deployment-check.ts`)

Comprehensive checklist that verifies environment variables and provides a manual deployment checklist.

**Usage:**
```bash
npm run deploy:check
```

**What it checks:**
- ✅ All required environment variables are set
- ✅ Environment variable values are valid (format validation)
- ⚠️ Optional environment variables (warnings only)
- 📝 Provides manual deployment checklist

**When to use:**
- Before every production deployment
- After configuring environment variables
- When setting up a new environment (staging, production)

**Example output:**
```
======================================================================
LUMBUS eSIM MARKETPLACE - PRE-DEPLOYMENT CHECKLIST
======================================================================

📋 Environment Variables Check:

✅ NEXT_PUBLIC_APP_URL
   Application URL (should be production domain)

✅ NEXT_PUBLIC_SUPABASE_URL
   Supabase project URL

❌ STRIPE_WEBHOOK_SECRET
   Missing required variable: Stripe webhook signing secret

...

======================================================================
✅ Passed: 15
❌ Failed: 2
⚠️  Warnings: 1
======================================================================

📝 MANUAL DEPLOYMENT CHECKLIST:

1. Database Setup
----------------------------------------------------------------------
  [ ] Run database migrations: npm run db:migrate
  [ ] Verify all tables exist: npx ts-node scripts/verify-database.ts
  [ ] Enable RLS policies in Supabase dashboard
  ...
```

---

### 4. Health Check Endpoint

**Endpoint:** `GET /api/health`

**Usage:**
```bash
# Start your dev server first
npm run dev

# In another terminal, check health
npm run health
```

**What it checks:**
- 🔍 Supabase database connectivity
- 🔍 eSIM Access API connectivity
- 🔍 Stripe API connectivity
- 🔍 Resend email service connectivity
- ⏱️ Response latency for each service

**Response format:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "up",
      "latency_ms": 45
    },
    "esimaccess": {
      "status": "up",
      "latency_ms": 120
    },
    "stripe": {
      "status": "up",
      "latency_ms": 80
    },
    "email": {
      "status": "up",
      "latency_ms": 60
    }
  }
}
```

**HTTP Status Codes:**
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services unhealthy

**When to use:**
- Set up as an uptime monitoring endpoint (UptimeRobot, Pingdom, etc.)
- Debugging service connectivity issues
- Monitoring production health

**Integration with monitoring tools:**
```bash
# UptimeRobot configuration
Monitor Type: HTTP(s)
URL: https://yourdomain.com/api/health
Monitoring Interval: 5 minutes
Alert Conditions: Non-200 status code

# Or use curl in a cron job
*/5 * * * * curl -f https://yourdomain.com/api/health || echo "Health check failed"
```

---

## Quick Reference

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npx tsx scripts/import-plans.ts plans.csv` | Import eSIM plans from CSV | Initial setup, adding/updating plans |
| `npm run db:verify` | Verify database schema | After migrations, before deploy |
| `npm run deploy:check` | Pre-deployment checklist | Before every deployment |
| `npm run health` | Check service health | Debugging connectivity issues |

---

## Pre-Deployment Workflow

Follow this workflow before every production deployment:

```bash
# 1. Verify environment variables are set
npm run deploy:check

# 2. Run database migrations (if any)
# (Add your migration command here)

# 3. Verify database schema
npm run db:verify

# 4. Build the application
npm run build

# 5. Start the application
npm run start

# 6. Check health in another terminal
npm run health

# 7. Test critical user flows
# - Complete a purchase
# - Verify email received
# - Check order status in dashboard
```

---

## Troubleshooting

### Database verification fails
```bash
❌ CRITICAL: Table 'orders' does not exist
```

**Solution:** Run your database migrations
```bash
# Apply migrations manually or use your migration tool
# Check supabase/migrations/ directory
```

---

### Pre-deployment check fails
```bash
❌ STRIPE_WEBHOOK_SECRET
   Missing required variable: Stripe webhook signing secret
```

**Solution:** Configure the missing environment variable
```bash
# 1. Copy .env.example to .env.local if not done
cp .env.example .env.local

# 2. Edit .env.local and fill in the value
# 3. For webhook secrets, configure in provider dashboard first
```

---

### Health check shows service down
```json
{
  "database": {
    "status": "down",
    "error": "Connection refused"
  }
}
```

**Solution:**
1. Check environment variables are correct
2. Verify service credentials are valid
3. Check network connectivity
4. Review service status in provider dashboards

---

## Adding New Checks

### Add new environment variable check

Edit `scripts/pre-deployment-check.ts`:

```typescript
const ENV_CHECKS: EnvCheck[] = [
  // ... existing checks
  {
    key: 'YOUR_NEW_VAR',
    required: true,
    description: 'Your variable description',
    validate: (val) => val.length > 0, // Optional validator
  },
];
```

### Add new health check

Edit `app/api/health/route.ts`:

```typescript
async function checkYourService(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Your service check logic
    return {
      status: 'up',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Add to GET handler
const [database, esimaccess, stripe, email, yourService] = await Promise.all([
  checkDatabase(),
  checkEsimAccess(),
  checkStripe(),
  checkEmail(),
  checkYourService(), // Add your check here
]);
```

---

## Notes

- All scripts require `.env.local` to be configured
- Scripts use TypeScript and are run via `ts-node`
- Health check endpoint is always available at `/api/health`
- Scripts exit with code 0 (success) or 1 (failure) for CI/CD integration

---

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run pre-deployment checks
        run: npm run deploy:check
        env:
          # Pass all required environment variables
          NEXT_PUBLIC_APP_URL: ${{ secrets.APP_URL }}
          # ... other secrets

      - name: Build application
        run: npm run build

      - name: Deploy
        run: # Your deployment command
```
