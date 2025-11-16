/**
 * Reward Packages API
 * GET /api/rewards/available-packages - List available 1GB top-up packages for rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  try {
    // Require authentication to protect rate limits and usage
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const region = req.nextUrl.searchParams.get('region');

    let query = supabase
      .from('plans')
      .select('id, name, supplier_sku, data_gb, validity_days, region_code, retail_price, currency, is_active')
      .eq('is_active', true);

    // Only ~1GB plans (0.9–1.1GB) are eligible as reward packages
    query = query.gte('data_gb', 0.9).lte('data_gb', 1.1);

    if (region) {
      query = query.eq('region_code', region);
    }

    const { data, error } = await query.order('region_code', { ascending: true }).order('retail_price', { ascending: true });

    if (error) {
      console.error('Failed to load reward packages:', error);
      return NextResponse.json({ error: 'Failed to load reward packages' }, { status: 500 });
    }

    const packages = (data || []).map(plan => ({
      id: plan.id,
      name: plan.name,
      supplier_sku: plan.supplier_sku,
      data_gb: plan.data_gb,
      validity_days: plan.validity_days,
      region_code: plan.region_code,
      retail_price: plan.retail_price,
      currency: plan.currency || 'USD',
    }));

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Available packages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


