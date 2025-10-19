# Cron Job Setup Guide

## eSIM Usage Update Cron Job

This cron job automatically fetches usage data from eSIM Access API for all activated eSIMs and updates the database every 3 hours.

### Schedule

- **Frequency**: Every 3 hours
- **Cron Expression**: `0 */3 * * *`
- **Path**: `/api/cron/update-usage`

### Setup Instructions

#### 1. Generate a Cron Secret

Generate a secure random string to use as your cron secret:

```bash
openssl rand -base64 32
```

#### 2. Add to Environment Variables

Add the cron secret to your environment variables:

**Local Development (.env.local):**
```bash
CRON_SECRET=your_generated_secret_here
```

**Vercel Production:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - Key: `CRON_SECRET`
   - Value: `your_generated_secret_here`
   - Environment: Production (and Preview if needed)

#### 3. Deploy to Vercel

The cron job is configured in `vercel.json` and will automatically be deployed when you push to your repository:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-usage",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

**Important**: Cron jobs only work on Vercel's Pro plan or higher. On the Hobby plan, you'll need to use an external service like:
- [Cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [GitHub Actions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

### Testing Locally

Test the cron job manually:

```bash
# Without CRON_SECRET (local dev only)
curl http://localhost:3000/api/cron/update-usage

# With CRON_SECRET
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/update-usage
```

### Testing in Production

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/update-usage
```

### Expected Response

```json
{
  "success": true,
  "total_orders": 5,
  "updated": 5,
  "errors": 0,
  "duration_ms": 2341,
  "results": [
    {
      "order_id": "...",
      "esim_tran_no": "...",
      "status": "updated",
      "old_status": "active",
      "new_status": "active",
      "data_remaining_gb": "0.486",
      "usage_percent": "2.5"
    }
  ]
}
```

### What the Cron Job Does

1. **Fetches all orders** with `esim_tran_no` (activated eSIMs)
2. **Calls eSIM Access API** in batches of 10 (API limit)
3. **Updates database** with:
   - `data_usage_bytes`: Total data used
   - `data_remaining_bytes`: Data remaining
   - `last_usage_update`: Timestamp from eSIM Access
   - `status`: Updated to 'depleted' if data_remaining_bytes <= 0
4. **Applies 1MB threshold**: eSIMs with < 1MB remaining are marked as depleted

### Monitoring

Check Vercel logs to monitor cron job execution:
1. Go to Vercel Dashboard → Your Project
2. Click "Logs"
3. Filter by path: `/api/cron/update-usage`

Look for log entries like:
```
[Usage Cron] Starting usage update job...
[Usage Cron] Found 5 orders with esim_tran_no
[Usage Cron] Processing batch 1: 5 eSIMs
[Usage Cron] Job completed in 2341ms: 5 updated, 0 errors
```

### Troubleshooting

**Issue**: Cron job returns 401 Unauthorized
- **Solution**: Make sure `CRON_SECRET` is set in Vercel environment variables

**Issue**: eSIM Access API rate limit errors
- **Solution**: The job processes eSIMs in batches of 10 with 1-second delays between batches. This should respect the 8 req/s limit.

**Issue**: Some orders not updating
- **Solution**: Check Vercel logs for specific error messages. The eSIM Access API may not have usage data for very recently activated eSIMs.

### Alternative: Using External Cron Service

If you're on Vercel Hobby plan, set up an external cron service:

**Cron-job.org Example:**
1. Create account at https://cron-job.org
2. Create new cron job:
   - URL: `https://your-domain.com/api/cron/update-usage`
   - Schedule: `0 */3 * * *` (every 3 hours)
   - Headers: Add `Authorization: Bearer YOUR_CRON_SECRET`
3. Save and enable

**GitHub Actions Example:**

Create `.github/workflows/update-usage.yml`:

```yaml
name: Update eSIM Usage

on:
  schedule:
    - cron: '0 */3 * * *'  # Every 3 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-usage:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger usage update
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/update-usage
```

Then add `CRON_SECRET` to your GitHub repository secrets.

### Manual Trigger

To manually trigger a usage update for all eSIMs, visit:
```
https://your-domain.com/api/cron/update-usage
```

Or use the admin fix endpoint for immediate one-time fix:
```
https://your-domain.com/api/admin/fix-usage
```
