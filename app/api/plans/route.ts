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
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
