# Pricing Management Scripts

This folder contains scripts for managing and updating eSIM plan pricing from eSIM Access CSV exports.

## 📁 Files

- **apply-variant-pricing.ts** - Main script to apply pricing updates from CSV
- **show-detailed-pricing.ts** - Preview pricing changes for specific countries
- **check-missing-plans.ts** - Analyze plans not in the new CSV
- **count-unchanged-plans.ts** - Count and categorize plans that won't change

## 🚀 Quick Start

### 1. Get Latest Pricing CSV from eSIM Access

Download the latest pricing CSV from eSIM Access and place it in the project root.

### 2. Preview Changes

Show detailed pricing for specific countries:

```bash
npx tsx scripts/pricing/show-detailed-pricing.ts "Price (2).csv"
```

This will show pricing changes for: Turkey, USA, UAE, UK, Japan, France

### 3. Dry Run (Recommended)

Always run a dry-run first to see what will change:

```bash
npx tsx scripts/pricing/apply-variant-pricing.ts "Price (2).csv" --dry-run
```

This shows:
- How many plans will be updated
- How many new plans will be added
- Sample of changes
- Average price changes

### 4. Apply Changes

Once satisfied with the dry-run, apply the changes:

```bash
npx tsx scripts/pricing/apply-variant-pricing.ts "Price (2).csv"
```

⚠️ **This updates your production database!**

## 📋 Pricing Rules

The script applies these rules automatically:

1. **Rounding**: All prices rounded to .99 (e.g., $9.00 → $8.99)
2. **Minimum Price**: $0.99 absolute minimum
3. **1GB Minimum**: All 1GB plans have $3.99 minimum
4. **Logical Progression**: More GB = higher price (per country/region)
5. **Filter**: Only updates plans >= 500MB

## 📊 Analysis Tools

### Count Unchanged Plans

See how many plans won't change and why:

```bash
npx tsx scripts/pricing/count-unchanged-plans.ts "Price (2).csv"
```

Shows:
- Plans not in CSV
- Plans with no price change
- Plans < 500MB

### Check Missing Plans

Analyze plans in your database that aren't in the new CSV:

```bash
npx tsx scripts/pricing/check-missing-plans.ts
```

This helps identify:
- Custom plans you created
- Discontinued eSIM Access plans
- Plans that need review

## 🎯 What Gets Updated

### ✅ Single Country Plans
- US, TR, GB, FR, DE, JP, etc.
- All individual country plans

### ✅ Regional/Multi-Country Plans
- EU-30, EU-7 (European regions)
- AUNZ-2 (Australia + New Zealand)
- AS-7 (Asian regions)
- NA-3 (North America)
- USCA-2 (USA + Canada)
- ME-6 (Middle East)
- And all other regional plans

### ❌ What Doesn't Get Updated
- Plans with < 500MB (excluded from CSV)
- Custom plans you created (with custom SKUs like `ESIMACCESS_*`)
- Plans not in the eSIM Access CSV
- Plans where new price = current price

## 📈 Expected Results

Based on the last update (Nov 2024):

- **950 plans updated** (out of 1,775 total)
- **884 plans decreased** in price (93%)
- **22 plans increased** in price (2% - mostly 1GB minimum enforcement)
- **32 new plans added**
- **Average savings: 30%** ($21.65 → $15.18)

## ⚡ Cache Clearing

After applying changes:
- API cache clears in **5 minutes**
- New prices visible to customers after cache clears
- No restart required

## 🔄 How to Update Pricing (Step by Step)

1. **Get CSV from eSIM Access**
   ```bash
   # Download latest pricing CSV
   # Place in project root as "Price (2).csv" or similar
   ```

2. **Preview Changes**
   ```bash
   npx tsx scripts/pricing/show-detailed-pricing.ts "Price (2).csv"
   ```

3. **Run Dry Run**
   ```bash
   npx tsx scripts/pricing/apply-variant-pricing.ts "Price (2).csv" --dry-run
   ```

4. **Review Output**
   - Check number of updates
   - Verify sample changes
   - Confirm average price change

5. **Apply Changes**
   ```bash
   npx tsx scripts/pricing/apply-variant-pricing.ts "Price (2).csv"
   ```

6. **Wait 5 Minutes**
   - API cache clears automatically
   - New prices go live

7. **Verify**
   - Check API: `/api/plans`
   - Spot check a few countries
   - Verify pricing on frontend

## 🛠️ Troubleshooting

### "File not found" Error
Make sure the CSV file path is correct:
```bash
ls -la "Price (2).csv"
```

### "Missing Supabase credentials" Error
Check your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
```

### Too Many Plans Increasing
This is usually fine - check the dry-run output. Increases are typically:
- 1GB plans hitting $3.99 minimum
- Logical progression adjustments (e.g., 2GB must cost more than 1GB)

### Custom Plans Being Affected
Custom plans (with SKUs like `ESIMACCESS_*`) are automatically skipped if they're not in the CSV.

## 📝 Notes

- Always run dry-run first
- Keep old CSV files for reference
- The script is idempotent - safe to run multiple times
- 825 plans typically remain unchanged (custom, <500MB, or already correct)
- Regional plans ARE included in updates
- All pricing follows logical progression per country

## 🔗 Related

- Main API: `/app/api/plans/route.ts`
- Sitemap: `/app/sitemap.ts` (also uses pagination)
- Database: Supabase `plans` table

## 📞 Support

If you encounter issues:
1. Check the dry-run output
2. Verify CSV format matches expected columns
3. Check Supabase connection
4. Review the pricing rules above
