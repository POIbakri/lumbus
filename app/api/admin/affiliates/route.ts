import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { data: affiliates, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('application_status', 'pending')
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Failed to load pending affiliates:', error);
      return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 });
    }

    return NextResponse.json(affiliates || []);
  } catch (error) {
    console.error('Admin affiliates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
