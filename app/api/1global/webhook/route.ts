import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyOneGlobalWebhook, OneGlobalWebhookPayload } from '@/lib/1global';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-1global-signature') || '';

    // Verify webhook signature
    const webhookSecret = process.env.ONEGLOBAL_WEBHOOK_SECRET || '';
    const isValid = verifyOneGlobalWebhook(body, signature, webhookSecret);

    if (!isValid) {
      console.error('1GLOBAL webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: OneGlobalWebhookPayload = JSON.parse(body);

    // Log webhook event (for idempotency and debugging)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', '1global')
      .eq('event_type', payload.eventType)
      .eq('payload_json', JSON.stringify(payload))
      .single();

    if (existingEvent) {
      console.log('Duplicate webhook event, skipping');
      return NextResponse.json({ received: true });
    }

    // Store webhook event
    await supabase.from('webhook_events').insert({
      provider: '1global',
      event_type: payload.eventType,
      payload_json: payload,
      processed_at: new Date().toISOString(),
    });

    // Handle order.completed event
    if (payload.eventType === 'order.completed') {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('connect_order_id', payload.orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found for 1GLOBAL order ID:', payload.orderId);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Update order with eSIM activation details
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          qr_url: payload.qrCode || null,
          smdp: payload.smdpAddress || null,
          activation_code: payload.activationCode || null,
        })
        .eq('id', order.id);

      console.log('Order completed:', order.id);

      // TODO: Send email notification with QR code and activation details
    }

    // Handle order.failed event
    if (payload.eventType === 'order.failed') {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('connect_order_id', payload.orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found for 1GLOBAL order ID:', payload.orderId);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Mark order as failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);

      console.log('Order failed:', order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('1GLOBAL webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
