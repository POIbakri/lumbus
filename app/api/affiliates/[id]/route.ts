/**
 * Individual Affiliate API
 * GET /api/affiliates/[id] - Get specific affiliate
 * PATCH /api/affiliates/[id] - Update affiliate (admin only)
 * DELETE /api/affiliates/[id] - Deactivate affiliate (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/admin-auth';

const updateAffiliateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  commission_type: z.enum(['PERCENT', 'FIXED']).optional(),
  commission_value: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/affiliates/[id]
 * Get specific affiliate details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    return NextResponse.json({ affiliate });
  } catch (error) {
    console.error('Get affiliate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/affiliates/[id]
 * Update affiliate (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateAffiliateSchema.parse(body);

    // If slug is being updated, check if it's available
    if (validatedData.slug) {
      const { data: existing } = await supabase
        .from('affiliates')
        .select('id')
        .eq('slug', validatedData.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 400 }
        );
      }
    }

    // Update affiliate
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !affiliate) {
      console.error('Failed to update affiliate:', error);
      return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
    }

    return NextResponse.json({
      affiliate,
      message: 'Affiliate updated successfully',
    });
  } catch (error) {
    console.error('Update affiliate error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/affiliates/[id]
 * Deactivate affiliate (soft delete - admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Soft delete by setting is_active to false
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Affiliate deactivated successfully',
    });
  } catch (error) {
    console.error('Delete affiliate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
