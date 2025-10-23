# Account Deletion Feature

## Overview

Complete account deletion system with 30-day grace period and email confirmation.

## Files Created/Modified

### 1. Frontend Page
- **File**: `/app/delete-account/page.tsx`
- **Route**: `/delete-account`
- **Features**:
  - Two-step confirmation process
  - Warning section explaining what will be deleted
  - Type-to-confirm validation ("DELETE MY ACCOUNT")
  - Mobile responsive design matching Lumbus UI
  - Haptic feedback on interactions
  - Error handling and loading states

### 2. API Endpoint
- **File**: `/app/api/user/delete-account/route.ts`
- **Route**: `POST /api/user/delete-account`
- **Authentication**: Bearer token required
- **Process**:
  1. Validates user authentication
  2. Verifies confirmation text
  3. Soft deletes account (marks with `deleted_at` timestamp)
  4. Schedules permanent deletion 30 days later
  5. Sends confirmation email
  6. Signs out user

### 3. Email Notification
- **File**: `/lib/email.ts`
- **Function**: `sendAccountDeletionEmail()`
- **Template**: Follows existing Lumbus email pattern
- **Content**:
  - Confirmation of deletion request
  - 30-day processing period notice
  - List of what will be deleted
  - Active eSIMs continue working notice
  - Contact support option
  - Red gradient header for urgency

### 4. Database Migration
- **File**: `/supabase/migrations/015_add_account_deletion_fields.sql`
- **Changes**:
  - Added `deleted_at` column (timestamp of deletion request)
  - Added `scheduled_deletion_date` column (30 days after request)
  - Created index for finding accounts scheduled for deletion

## Database Schema

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_deletion_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_scheduled_deletion
ON public.users(scheduled_deletion_date)
WHERE deleted_at IS NOT NULL;
```

## How It Works

### User Flow

1. **Navigate to deletion page**: User visits `/delete-account`
2. **Warning screen**: Shows what will be deleted and alternatives
3. **Type confirmation**: User must type "DELETE MY ACCOUNT" exactly
4. **API request**: Calls `/api/user/delete-account` with auth token
5. **Account marked**: Database marks account with deletion timestamps
6. **Email sent**: Confirmation email with 30-day notice
7. **Sign out**: User is automatically signed out
8. **Redirect**: Redirected to homepage

### Soft Delete Process

Accounts are **soft deleted** (not immediately removed):

- `deleted_at`: Timestamp when user requested deletion
- `scheduled_deletion_date`: Date set to 30 days after request
- Account remains in database with these flags
- User is immediately signed out

### Permanent Deletion

**Important**: Actual deletion requires a cron job (not yet implemented).

Suggested implementation:
```typescript
// app/api/cron/delete-accounts/route.ts
export async function GET() {
  // Find accounts scheduled for deletion
  const { data: accounts } = await supabase
    .from('users')
    .select('id')
    .lte('scheduled_deletion_date', new Date().toISOString())
    .not('deleted_at', 'is', null);

  // Delete each account and related data
  for (const account of accounts) {
    // Delete related data (orders, referrals, etc.)
    // Delete user account
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/delete-accounts",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## What Gets Deleted

When permanent deletion happens (after 30 days):

- **Account Information**: Email, profile, settings
- **eSIM Orders**: Purchase history, order details
- **Referral Data**: Rewards, referral codes, stats
- **Data Wallet**: Unused data credits
- **User Record**: Complete user deletion

## What Continues Working

- **Active eSIMs**: Continue working until expiry date
- The eSIMs physically installed on devices will function regardless of account status

## Email Template

The deletion confirmation email includes:

1. **Header**: Red gradient for urgency
2. **Deletion Status**: Large icon with "Deletion in Progress"
3. **Timeline**: Up to 30 days processing period
4. **What Will Be Deleted**: Bulleted list
5. **Active eSIMs Notice**: Reassurance they'll keep working
6. **Changed Your Mind?**: Contact support CTA
7. **Footer**: Support email contact

## Security Features

- **Authentication Required**: Must be logged in
- **Exact Text Match**: Must type "DELETE MY ACCOUNT" exactly
- **Confirmation Email**: Sent to user's email address
- **Grace Period**: 30 days to contact support and cancel
- **Immediate Sign Out**: User can't access account after request

## Mobile Responsive

The delete account page is fully mobile responsive:

- **Mobile-first design**
- Responsive text sizing (`text-xs sm:text-sm md:text-base`)
- Responsive padding (`p-3 sm:p-4 md:p-6`)
- Responsive borders (`border-2 sm:border-4`)
- Stacked buttons on mobile, side-by-side on desktop
- Proper spacing across all breakpoints

## Testing Checklist

- [ ] Page loads correctly at `/delete-account`
- [ ] Warning screen displays all information
- [ ] Type-to-confirm validation works
- [ ] API authentication works correctly
- [ ] Database records updated with timestamps
- [ ] Email sends successfully
- [ ] User is signed out after deletion
- [ ] Redirect to homepage works
- [ ] Mobile responsive on all screen sizes
- [ ] Error handling displays properly
- [ ] Support contact links work

## Future Improvements

1. **Cron Job**: Implement permanent deletion after 30 days
2. **Cancellation**: Add ability to cancel deletion request
3. **Admin Dashboard**: View accounts pending deletion
4. **Data Export**: Allow users to download their data before deletion
5. **Cascade Deletes**: Define what happens to related data (orders, referrals)

## Support

If users want to cancel deletion or have questions:
- **Email**: support@getlumbus.com
- **Response Time**: Immediate for cancellation requests
- **Documentation**: Included in deletion email
