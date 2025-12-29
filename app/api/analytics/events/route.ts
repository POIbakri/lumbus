/**
 * Analytics API - App Events
 * POST /api/analytics/events
 *
 * Receives events from the mobile app (installs, opens, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Valid event types
const VALID_EVENT_TYPES = [
  'first_open',      // First time app is opened (install)
  'app_open',        // App opened (subsequent)
  'signup',          // User created account
  'login',           // User logged in
  'purchase',        // User made a purchase
  'esim_activated',  // User activated an eSIM
] as const;

interface AppEventPayload {
  event_type: string;
  device_id: string;
  user_id?: string;
  platform: 'ios' | 'android';
  app_version?: string;
  os_version?: string;
  device_model?: string;
  install_source?: string;
  campaign?: string;
  country_code?: string;
  metadata?: Record<string, unknown>;
  event_timestamp?: string;  // ISO string from device
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

    // Rate limit by IP
    if (!checkRateLimit(ip, 100, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Parse body
    const body: AppEventPayload = await request.json();

    // Validate required fields
    if (!body.event_type || !body.device_id || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, device_id, platform' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(body.event_type as typeof VALID_EVENT_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate platform
    if (!['ios', 'android'].includes(body.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be ios or android' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit by device_id too (prevent spam from single device)
    if (!checkRateLimit(`device:${body.device_id}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many events from this device' },
        { status: 429, headers: corsHeaders }
      );
    }

    // For first_open events, check if this device already has one
    if (body.event_type === 'first_open') {
      const { data: existing } = await supabase
        .from('app_events')
        .select('id')
        .eq('device_id', body.device_id)
        .eq('event_type', 'first_open')
        .limit(1)
        .single();

      if (existing) {
        // Already tracked first_open for this device
        return NextResponse.json({
          ok: true,
          message: 'First open already recorded for this device',
          duplicate: true,
        }, { headers: corsHeaders });
      }
    }

    // Insert the event
    const { data, error } = await supabase
      .from('app_events')
      .insert({
        event_type: body.event_type,
        device_id: body.device_id,
        user_id: body.user_id || null,
        platform: body.platform,
        app_version: body.app_version || null,
        os_version: body.os_version || null,
        device_model: body.device_model || null,
        install_source: body.install_source || null,
        campaign: body.campaign || null,
        country_code: body.country_code || null,
        metadata: body.metadata || {},
        event_timestamp: body.event_timestamp || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to insert app event:', error);
      return NextResponse.json(
        { error: 'Failed to record event' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      ok: true,
      event_id: data.id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Analytics event error:', error);
    return NextResponse.json(
      { error: 'Failed to process event' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// GET endpoint to query stats (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type') || 'first_open';
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Get daily counts for the specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('app_events')
      .select('event_timestamp, platform')
      .eq('event_type', eventType)
      .gte('event_timestamp', startDate.toISOString())
      .order('event_timestamp', { ascending: false });

    if (error) {
      console.error('Failed to fetch analytics:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Group by date
    const dailyCounts: Record<string, { total: number; ios: number; android: number }> = {};

    for (const event of data || []) {
      const date = new Date(event.event_timestamp).toISOString().split('T')[0];
      if (!dailyCounts[date]) {
        dailyCounts[date] = { total: 0, ios: 0, android: 0 };
      }
      dailyCounts[date].total++;
      if (event.platform === 'ios') {
        dailyCounts[date].ios++;
      } else {
        dailyCounts[date].android++;
      }
    }

    // Today's count
    const today = new Date().toISOString().split('T')[0];
    const todayCount = dailyCounts[today] || { total: 0, ios: 0, android: 0 };

    return NextResponse.json({
      event_type: eventType,
      period_days: days,
      today: todayCount,
      daily: dailyCounts,
      total: data?.length || 0,
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
