# 🚀 Lumbus Production Setup Guide

## Prerequisites

Before deploying to production, ensure you have accounts with:
- ✅ [Supabase](https://supabase.com) - Database & Authentication
- ✅ [Stripe](https://stripe.com) - Payment Processing
- ✅ [1Global](https://www.1global.com/) - eSIM Provisioning API
- ✅ [Resend](https://resend.com) - Email Service
- ✅ [Vercel](https://vercel.com) or similar - Hosting

---

## 1. Supabase Setup

### Create Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Name it `lumbus-production`
4. Choose a strong database password
5. Select your preferred region

### Get Credentials
Navigate to **Settings → API** and copy:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_KEY`

### Database Schema
Run these SQL commands in **SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  region_code TEXT NOT NULL,
  data_gb INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  supplier_sku TEXT NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  connect_order_id TEXT,
  qr_url TEXT,
  smdp TEXT,
  activation_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook events table
CREATE TABLE webhook_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_plans_region_code ON plans(region_code);
CREATE INDEX idx_plans_is_active ON plans(is_active);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (is_active = true);
```

### Authentication Setup

1. **Email/Password Auth**
   - Go to **Authentication → Providers**
   - Enable "Email" provider
   - Configure email templates (optional)

2. **Google OAuth**
   - Go to **Authentication → Providers**
   - Enable "Google" provider
   - Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

3. **Apple OAuth** (Optional)
   - Enable "Apple" provider
   - Get credentials from [Apple Developer](https://developer.apple.com)
   - Add redirect URI

---

## 2. Stripe Setup

### Get API Keys
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Switch to **Live mode** (toggle in top-right)
3. Go to **Developers → API keys**
4. Copy:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

### Enable Payment Methods
1. Go to **Settings → Payment methods**
2. Enable:
   - ✅ Cards (Visa, Mastercard, Amex)
   - ✅ Apple Pay
   - ✅ Google Pay
   - ✅ Link by Stripe (optional)

### Webhook Setup
1. Go to **Developers → Webhooks**
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 3. 1Global eSIM API Setup

### Get API Credentials
1. Contact 1Global sales team
2. Sign partnership agreement
3. Receive API credentials:
   - API Key → `ONEGLOBAL_API_KEY`
   - Webhook Secret → `ONEGLOBAL_WEBHOOK_SECRET`

### Configure Webhooks
Set webhook URL to: `https://yourdomain.com/api/1global/webhook`

Events to receive:
- Order status updates
- eSIM activation status
- QR code generation

---

## 4. Resend Email Setup

### Get API Key
1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys**
3. Create new key → `RESEND_API_KEY`

### Verify Domain
1. Add your domain (e.g., `lumbus.com`)
2. Add DNS records they provide
3. Wait for verification
4. Set `RESEND_FROM_EMAIL=hello@yourdomain.com`

### Email Templates
Pre-configured templates in `/lib/email-templates.ts`:
- Welcome email
- Order confirmation
- eSIM activation instructions
- Password reset

---

## 5. Environment Variables

### Production `.env.local`

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 1GLOBAL Connect API
ONEGLOBAL_API_KEY=your_api_key_here
ONEGLOBAL_API_URL=https://connect.1global.com/api/v1
ONEGLOBAL_WEBHOOK_SECRET=your_webhook_secret_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=hello@yourdomain.com

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$xxxxx  # Generate with bcryptjs

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Generate Admin Password Hash
```bash
npm install -g bcryptjs-cli
bcryptjs "your_secure_password"
```

---

## 6. Deploy to Vercel

### Connect Repository
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository

### Configure Build Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Add Environment Variables
1. Go to **Settings → Environment Variables**
2. Add ALL variables from `.env.local`
3. Select "Production" scope

### Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your live site!

---

## 7. Post-Deployment Checklist

### ✅ Test Authentication
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Google OAuth login
- [ ] Apple OAuth login (if enabled)
- [ ] Password reset flow
- [ ] Session persistence

### ✅ Test Purchase Flow
- [ ] Browse plans
- [ ] Add plan to cart
- [ ] Checkout with test card: `4242 4242 4242 4242`
- [ ] Verify Stripe webhook received
- [ ] Check order created in Supabase
- [ ] Verify email sent via Resend

### ✅ Test eSIM Delivery
- [ ] Order status updates correctly
- [ ] QR code generated by 1Global
- [ ] Activation codes received
- [ ] Install page displays correctly
- [ ] Deep link works on iOS 17.4+
- [ ] Manual install works on older devices

### ✅ Test User Dashboard
- [ ] View active eSIMs
- [ ] Data usage displays
- [ ] Expiry dates correct
- [ ] Low data warnings show
- [ ] Order history loads
- [ ] Sign out works

### ✅ Security Checks
- [ ] All API endpoints require authentication
- [ ] Row Level Security enabled in Supabase
- [ ] Webhook secrets validated
- [ ] Rate limiting implemented (recommended)
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### ✅ Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Images optimized
- [ ] Fonts loaded efficiently

---

## 8. Monitoring & Maintenance

### Recommended Tools
- **Error Tracking:** [Sentry](https://sentry.io)
- **Analytics:** [PostHog](https://posthog.com) or Google Analytics
- **Uptime Monitoring:** [Better Uptime](https://betteruptime.com)
- **Performance:** [Vercel Analytics](https://vercel.com/analytics)

### Regular Maintenance
- Monitor Stripe dashboard for failed payments
- Check Supabase logs for errors
- Review 1Global API usage
- Update dependencies monthly
- Backup database weekly
- Test critical flows weekly

---

## 9. Common Issues & Solutions

### Issue: Stripe payments failing
**Solution:**
- Verify webhook is receiving events
- Check Stripe secret key is correct
- Ensure webhook signature validation

### Issue: eSIM not provisioning
**Solution:**
- Check 1Global API credentials
- Verify webhook endpoint is accessible
- Check order status in Supabase
- Review 1Global dashboard

### Issue: OAuth not working
**Solution:**
- Verify redirect URIs match exactly
- Check OAuth client IDs/secrets
- Enable providers in Supabase dashboard
- Test callback route works

### Issue: Emails not sending
**Solution:**
- Verify Resend API key
- Check domain verification status
- Review email send logs
- Test with different email address

---

## 10. Scaling Considerations

### When to Scale
- > 1000 users
- > 100 orders/day
- Response time > 3s

### Optimization Steps
1. **Database:**
   - Add database indexes
   - Enable connection pooling
   - Consider read replicas

2. **API:**
   - Implement Redis caching
   - Use CDN for static assets
   - Add rate limiting

3. **Monitoring:**
   - Set up error alerts
   - Track conversion metrics
   - Monitor API performance

---

## 🎉 You're Ready for Production!

All systems are configured and ready to handle real users. Make sure to:
1. Test thoroughly with test data
2. Monitor closely during first week
3. Have support channels ready
4. Keep backups of everything

**Need help?** Check the documentation or contact support.
