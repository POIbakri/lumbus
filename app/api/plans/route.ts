import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Log environment check
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);

    console.log('[Plans API] Environment check:', {
      hasSupabaseUrl,
      hasServiceKey,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    });

    const searchParams = req.nextUrl.searchParams;
    const region = searchParams.get('region');
    const continent = searchParams.get('continent');
    const search = searchParams.get('search');

    let query = supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('retail_price', { ascending: true });

    // Filter by region code
    if (region) {
      query = query.eq('region_code', region.toUpperCase());
    }

    // Filter by search term (name or region_code)
    if (search) {
      query = query.or(`name.ilike.%${search}%,region_code.ilike.%${search}%`);
    }

    console.log('[Plans API] Executing query...');
    const { data: plans, error } = await query;

    if (error) {
      console.error('[Plans API] Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch plans',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log(`[Plans API] Successfully fetched ${plans?.length || 0} plans`);
    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('[Plans API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
