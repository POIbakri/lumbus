import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { supabase } from '@/lib/db';
import { ensureUserProfile } from '@/lib/referral';

/**
 * Supabase Auth Webhook Handler
 *
 * This endpoint is called by Supabase when auth events occur (user signup, login, etc.)
 * Configure in Supabase Dashboard: Authentication > Hooks > Add webhook
 *
 * Webhook URL: https://getlumbus.com/api/webhooks/supabase-auth
 * Events to listen for: user.created (or insert on auth.users)
 */

// Verify the webhook is from Supabase using the webhook secret
const WEBHOOK_SECRET = process.env.SUPABASE_AUTH_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get('authorization');
      const webhookSecret = req.headers.get('x-supabase-webhook-secret') ||
                           (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

      if (webhookSecret !== WEBHOOK_SECRET) {
        console.error('Supabase Auth Webhook: Invalid secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = await req.json();

    // Log for debugging (remove in production if too verbose)
    console.log('Supabase Auth Webhook received:', payload.type || payload.event || 'unknown event');

    // Handle different payload formats from Supabase
    // Database webhook format (from auth.users table trigger)
    if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'auth') {
      const user = payload.record;
      await handleNewUser(user);
      return NextResponse.json({ success: true, event: 'user_created' });
    }

    // Auth hook format (from Supabase Auth hooks)
    if (payload.event === 'user.created' || payload.event === 'signup') {
      const user = payload.user || payload.record;
      await handleNewUser(user);
      return NextResponse.json({ success: true, event: 'user_created' });
    }

    // Alternative payload structure
    if (payload.user && payload.event_type === 'signup') {
      await handleNewUser(payload.user);
      return NextResponse.json({ success: true, event: 'user_created' });
    }

    // If we have a user object with an id and email, treat as new user
    if (payload.id && payload.email && !payload.type && !payload.event) {
      await handleNewUser(payload);
      return NextResponse.json({ success: true, event: 'user_created' });
    }

    // Unhandled event type - just acknowledge
    return NextResponse.json({
      success: true,
      message: 'Event received but not processed',
      receivedType: payload.type || payload.event || 'unknown'
    });

  } catch (error) {
    console.error('Supabase Auth Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle new user signup - send welcome email if applicable
 */
async function handleNewUser(user: {
  id: string;
  email?: string;
  raw_user_meta_data?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}) {
  const userId = user.id;
  const email = user.email;
  const metadata = user.raw_user_meta_data || user.user_metadata || {};
  const userName = (metadata.full_name || metadata.name) as string | undefined;

  if (!userId || !email) {
    console.log('Supabase Auth Webhook: Missing userId or email, skipping welcome email');
    return;
  }

  console.log(`Supabase Auth Webhook: Processing new user ${userId} (${email})`);

  // Create user profile with referral code (for all signup methods: email, Google, Apple)
  try {
    await ensureUserProfile(userId);
    console.log(`Supabase Auth Webhook: User profile created for ${userId}`);
  } catch (profileError) {
    console.error(`Supabase Auth Webhook: Failed to create user profile for ${userId}:`, profileError);
    // Don't throw - continue with welcome email
  }

  // Check if user has any orders (they'll get order confirmation instead)
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['paid', 'completed', 'provisioning']);

  if (orderCount && orderCount > 0) {
    console.log(`Supabase Auth Webhook: User ${userId} has orders, skipping welcome email`);
    return;
  }

  // Check if we've already sent a welcome email (prevent duplicates)
  const { data: existingWelcome } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'internal')
    .eq('event_type', 'welcome_email_sent')
    .eq('notify_id', userId)
    .maybeSingle();

  if (existingWelcome) {
    console.log(`Supabase Auth Webhook: Welcome email already sent to user ${userId}`);
    return;
  }

  // Send welcome email
  try {
    await sendWelcomeEmail({
      to: email,
      userName: userName,
    });

    // Record that we sent the welcome email
    await supabase.from('webhook_events').insert({
      provider: 'internal',
      event_type: 'welcome_email_sent',
      notify_id: userId,
      payload_json: {
        email,
        userName,
        sentAt: new Date().toISOString(),
        source: 'supabase_auth_webhook'
      },
      processed_at: new Date().toISOString(),
    });

    console.log(`Supabase Auth Webhook: Welcome email sent to ${email}`);
  } catch (emailError) {
    console.error(`Supabase Auth Webhook: Failed to send welcome email to ${email}:`, emailError);
    throw emailError;
  }
}

// Also support GET for webhook verification (some systems ping GET first)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'supabase-auth-webhook',
    message: 'Webhook endpoint is active'
  });
}
