import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { supabase } from '@/lib/db';

/**
 * Send welcome email to new users who sign up without purchasing
 *
 * This endpoint should be called after successful signup (email/password, Google, Apple)
 * It checks if the user has any orders - if not, sends welcome email
 */
export async function POST(req: NextRequest) {
  try {
    // Handle both application/json and text/plain (sendBeacon uses text/plain for CORS safety)
    const contentType = req.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      // text/plain from sendBeacon - parse as JSON
      const text = await req.text();
      body = JSON.parse(text);
    }
    const { userId, email, userName } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
    }

    // Check if user has any orders (paid, completed, or provisioning)
    // If they do, they'll get order confirmation email instead - no need for welcome email
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['paid', 'completed', 'provisioning']);

    if (orderCount && orderCount > 0) {
      // User has orders, they'll get order confirmation email
      return NextResponse.json({
        sent: false,
        reason: 'User has existing orders - will receive order confirmation instead'
      });
    }

    // Check if we've already sent a welcome email to this user (prevent duplicates)
    // We'll use a simple check in webhook_events or create a flag
    const { data: existingWelcome } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', 'internal')
      .eq('event_type', 'welcome_email_sent')
      .eq('notify_id', userId)
      .maybeSingle();

    if (existingWelcome) {
      return NextResponse.json({
        sent: false,
        reason: 'Welcome email already sent to this user'
      });
    }

    // Send welcome email
    await sendWelcomeEmail({
      to: email,
      userName: userName || undefined,
    });

    // Record that we sent the welcome email
    await supabase.from('webhook_events').insert({
      provider: 'internal',
      event_type: 'welcome_email_sent',
      notify_id: userId,
      payload_json: { email, userName, sentAt: new Date().toISOString() },
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
