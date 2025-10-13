# 🌍 Lumbus - Fast eSIM Store

Modern, mobile-first eSIM marketplace with instant activation. Built with Next.js 15, Supabase, Stripe, and 1Global eSIM API.

## ✨ Features

### 🔐 Authentication & User Management
- **Email/Password Auth** - Secure authentication with Supabase
- **Social Login** - Google & Apple OAuth integration
- **User Dashboard** - Track eSIMs, data usage, and expiry dates
- **Session Management** - Persistent sessions across devices
- **Protected Routes** - Automatic redirects for authenticated content

### 💳 Payment & Checkout
- **Stripe Integration** - Apple Pay and Google Pay support via Payment Request Button
- **Multiple Currencies** - Support for USD, EUR, GBP, and more
- **Secure Checkout** - PCI-compliant payment processing
- **Webhook Integration** - Real-time payment status updates

### 📱 eSIM Provisioning
- **Instant Activation** - iOS 17.4+ users get scan-free eSIM activation via Universal Links
- **Multi-Platform** - Support for iOS, Android, and desktop with QR codes and manual entry
- **190+ Countries** - Global coverage via 1GLOBAL network
- **Auto Deep-Link** - One-tap eSIM installation on compatible devices
- **Success Animations** - Beautiful planet + signal bars animation

### 🌐 Smart Features
- **Location Detection** - IP-based geolocation for personalized plan suggestions
- **Device Detection** - Automatic eSIM compatibility checking
- **Email Delivery** - Automated eSIM delivery via Resend
- **PWA Support** - Add to Home Screen capability with offline install page caching
- **Mobile-First Design** - Optimized for touch with haptic feedback

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **UI**: shadcn/ui components
- **Database**: PostgreSQL (Supabase/Neon)
- **Payments**: Stripe
- **Email**: Resend
- **eSIM Provider**: 1GLOBAL Connect API
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ (preferably 20+)
- A Supabase or Neon PostgreSQL database
- Stripe account
- 1GLOBAL Connect API credentials
- Resend account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd lumbus
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
DATABASE_URL=your_db_url

# 1GLOBAL Connect API
ONEGLOBAL_API_KEY=your_1global_api_key
ONEGLOBAL_API_URL=https://connect.1global.com/api/v1
ONEGLOBAL_WEBHOOK_SECRET=your_webhook_secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@lumbus.com

# Admin (generate hash with: npx bcryptjs-cli <password>)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:

Run the SQL schema in `lib/db/schema.sql` on your PostgreSQL database:

```bash
psql $DATABASE_URL < lib/db/schema.sql
```

Or use Supabase Dashboard → SQL Editor to run the schema.

5. Generate admin password hash:

```bash
npm install -g bcryptjs-cli
bcryptjs-cli "your-password-here"
```

Copy the hash to `ADMIN_PASSWORD_HASH` in `.env.local`.

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The database consists of 4 main tables:

- **users**: Customer accounts (email-based)
- **plans**: eSIM data plans (region, GB, price, 1GLOBAL SKU)
- **orders**: Purchase orders linking users, plans, Stripe, and 1GLOBAL
- **webhook_events**: Audit log for Stripe and 1GLOBAL webhooks

See `lib/db/schema.sql` for the complete schema.

## API Routes

### Public Routes

- `POST /api/checkout/session` - Create Stripe Checkout session
- `GET /api/orders/[orderId]` - Get order status and activation details
- `GET /api/qr/[orderId]` - Generate QR code for eSIM activation

### Webhook Routes

- `POST /api/stripe/webhook` - Handle Stripe events (checkout completion)
- `POST /api/1global/webhook` - Handle 1GLOBAL events (order completion)

### Admin Routes

- `GET /api/admin/orders` - List recent orders (Basic Auth required)

## Webhooks Setup

### Stripe

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local dev:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
3. Copy the webhook secret to `.env.local`
4. For production, add webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`

### 1GLOBAL

1. Contact 1GLOBAL to set up webhook endpoint:
   - URL: `https://your-domain.com/api/1global/webhook`
   - Events: `order.completed`, `order.failed`
2. Add webhook secret to `.env.local`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy!

The project is optimized for Vercel with:
- Automatic HTTPS
- Edge functions for API routes
- PWA support
- Instant deployments

### Environment Variables

Make sure to set all environment variables in Vercel Dashboard → Settings → Environment Variables.

### Database Migration

Run the SQL schema on your production database before first deployment.

## PWA Configuration

Lumbus is a Progressive Web App with:
- **Manifest**: `/public/manifest.json`
- **Service Worker**: `/public/sw.js` (caches install pages for offline viewing)
- **Icons**: Add your app icons as `/public/icon-192.png` and `/public/icon-512.png`

Users can add Lumbus to their home screen for a native app-like experience.

## iOS 17.4+ Universal Link

For iOS 17.4+, Lumbus uses Apple's scan-free eSIM activation:

```
https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$<SM-DP+>$<ActivationCode>
```

This opens the native eSIM installer without requiring QR scanning.

## Admin Panel

Access the admin panel at `/admin`. You'll be prompted for Basic Auth credentials.

To set admin password:
```bash
npx bcryptjs-cli "your-secure-password"
```

Add the output hash to `ADMIN_PASSWORD_HASH` in your environment variables.

## Testing

### Test Cards (Stripe)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Test Flow

1. Visit homepage → Browse Plans
2. Select a plan → Enter email → Checkout
3. Use test card
4. Redirected to `/install/[orderId]`
5. See QR code + manual entry options
6. On iOS 17.4+, see "Activate without QR" button

## 1GLOBAL Integration Notes

- **Create Order**: Called immediately after successful Stripe payment
- **Order Webhook**: 1GLOBAL sends `order.completed` when eSIM is provisioned
- **QR Code**: 1GLOBAL provides QR URL, but we generate our own for security
- **LPA String**: `LPA:1$<SM-DP+>$<ActivationCode>`

Refer to 1GLOBAL Connect API docs for exact payload formats:
https://docs.connect.1global.com

## Troubleshooting

### Orders stuck in "provisioning"

Check 1GLOBAL API credentials and webhook configuration. Poll 1GLOBAL order status manually if needed.

### Stripe webhook not working

1. Check webhook secret is correct
2. Verify signature verification is passing
3. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Database connection errors

Verify `DATABASE_URL` and Supabase/Neon credentials. Check connection pooling settings.

### PWA not installing

1. Ensure HTTPS (required for PWA)
2. Check manifest.json is accessible
3. Verify service worker registers correctly
4. Icons must be PNG format, correct sizes

## License

MIT

## 📚 Documentation

- **PRODUCTION_SETUP.md** - Complete production deployment guide with step-by-step instructions
- **.env.example** - Environment variable template
- **lib/db/schema.sql** - Database schema (also in PRODUCTION_SETUP.md)
- Inline code comments throughout the codebase

## Support

For questions or issues:
1. Check `PRODUCTION_SETUP.md` for detailed setup instructions
2. Review inline code documentation
3. Refer to the 1GLOBAL documentation
4. Contact support

---

**Built with ❤️ for travelers worldwide 🌍**

Using Next.js 15, Supabase, Stripe, and 1GLOBAL eSIM technology.
