import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const region = searchParams.get('region');
    const continent = searchParams.get('continent');
    const search = searchParams.get('search');

    // Fetch all plans using pagination to handle Supabase's 1000 row limit
    let allPlans: any[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      let query = supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('retail_price', { ascending: true })
        .range(from, from + pageSize - 1);

      // Filter by region code
      if (region) {
        query = query.eq('region_code', region.toUpperCase());
      }

      // Filter by search term (name or region_code)
      if (search) {
        query = query.or(`name.ilike.%${search}%,region_code.ilike.%${search}%`);
      }

      const { data, error } = await query;

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

      if (!data || data.length === 0) break;

      allPlans = [...allPlans, ...data];

      // If we got fewer results than the page size, we've reached the end
      if (data.length < pageSize) break;

      from += pageSize;
    }

    console.log(`[Plans API] Fetched ${allPlans.length} plans total`);

    const response = NextResponse.json({ plans: allPlans });

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
