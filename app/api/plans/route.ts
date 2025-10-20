import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
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

    const response = NextResponse.json({ plans: plans || [] });

    // Cache for 5 minutes (300 seconds)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
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
