/**
 * Affiliate Management API
 * GET /api/affiliates - List all affiliates (admin only)
 * POST /api/affiliates - Create new affiliate (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/admin-auth';

const createAffiliateSchema = z.object({
  user_id: z.string().uuid().optional(),
  display_name: z.string().min(1).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  commission_type: z.enum(['PERCENT', 'FIXED']),
  commission_value: z.number().min(0),
  notes: z.string().optional(),
});

/**
 * GET /api/affiliates
 * List all affiliates (admin only)
 */
export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('affiliates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to list affiliates:', error);
      return NextResponse.json({ error: 'Failed to list affiliates' }, { status: 500 });
    }

    return NextResponse.json({
      affiliates: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('List affiliates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/affiliates
 * Create new affiliate (admin only)
 */
export async function POST(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const validatedData = createAffiliateSchema.parse(body);

    // Check if slug is already taken
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('slug', validatedData.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 400 }
      );
    }

    // Create affiliate
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .insert({
        user_id: validatedData.user_id || null,
        display_name: validatedData.display_name,
        slug: validatedData.slug,
        commission_type: validatedData.commission_type,
        commission_value: validatedData.commission_value,
        notes: validatedData.notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create affiliate:', error);
      return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 });
    }

    return NextResponse.json({
      affiliate,
      message: 'Affiliate created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create affiliate error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
