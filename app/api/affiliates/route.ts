/**
 * Affiliate Management API
 * GET /api/affiliates - List all affiliates (admin only) or get own affiliate (authenticated users)
 * POST /api/affiliates - Create new affiliate (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { z } from 'zod';
import { requireAuth, checkAdminAuth } from '@/lib/admin-auth';
import { requireUserAuth } from '@/lib/server-auth';

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
 * List all affiliates (admin) or get own affiliate (authenticated users)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    // If user_id is provided, verify the requester is authenticated and requesting their own data
    if (userId) {
      // Check if admin
      const isAdmin = checkAdminAuth(req);

      let userEmail: string | undefined;
      if (!isAdmin) {
        // If not admin, require user auth and verify they're requesting their own data
        const auth = await requireUserAuth(req);
        if (auth.error) {
          return auth.error;
        }

        if (auth.user.id !== userId) {
          return NextResponse.json(
            { error: 'Forbidden: You can only view your own affiliate data' },
            { status: 403 }
          );
        }

        userEmail = auth.user.email;
      }

      // First, try to find affiliate by user_id
      const { data: initialData, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('Failed to get affiliate by user_id:', error);
        return NextResponse.json({ error: 'Failed to get affiliate' }, { status: 500 });
      }

      let data = initialData;

      // If no affiliate found by user_id, try to find by email (for existing affiliates without user_id)
      if ((!data || data.length === 0) && userEmail) {
        const { data: emailData, error: emailError } = await supabase
          .from('affiliates')
          .select('*')
          .eq('email', userEmail.toLowerCase())
          .limit(1);

        if (emailError) {
          console.error('Failed to get affiliate by email:', emailError);
          return NextResponse.json({ error: 'Failed to get affiliate' }, { status: 500 });
        }

        // If we found an affiliate by email but it doesn't have a user_id, link it now
        if (emailData && emailData.length > 0 && !emailData[0].user_id) {
          const { error: updateError } = await supabase
            .from('affiliates')
            .update({ user_id: userId })
            .eq('id', emailData[0].id);

          if (updateError) {
            console.error('Failed to link user_id to affiliate:', updateError);
          } else {
            console.log(`Successfully linked user_id ${userId} to affiliate ${emailData[0].id}`);
            emailData[0].user_id = userId; // Update the returned data
          }
        }

        data = emailData;
      }

      return NextResponse.json({
        affiliates: data || [],
        total: data?.length || 0,
      });
    }

    // For listing all affiliates, require admin authentication
    const authError = requireAuth(req);
    if (authError) return authError;

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
