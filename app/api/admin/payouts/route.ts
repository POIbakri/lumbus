import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';

// GET: List commissions and payouts
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'commissions'; // 'commissions' or 'payouts'
    const affiliateId = searchParams.get('affiliate_id');
    const status = searchParams.get('status');

    if (view === 'payouts') {
      // Get payouts
      let query = supabase
        .from('affiliate_payouts')
        .select(`
          id,
          affiliate_id,
          total_cents,
          method,
          destination,
          status,
          external_id,
          notes,
          created_at,
          processing_at,
          paid_at,
          failed_at,
          affiliates(display_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data: payouts, error } = await query;

      if (error) {
        console.error('Error fetching payouts:', error);
        return NextResponse.json({ error: 'Failed to load payouts' }, { status: 500 });
      }

      const formattedPayouts = payouts?.map((p: any) => ({
        id: p.id,
        affiliate_id: p.affiliate_id,
        affiliate_name: p.affiliates?.display_name || 'N/A',
        affiliate_email: p.affiliates?.email || 'N/A',
        total_cents: p.total_cents,
        total_usd: (p.total_cents / 100).toFixed(2),
        method: p.method,
        destination: p.destination,
        status: p.status,
        external_id: p.external_id,
        notes: p.notes,
        created_at: p.created_at,
        processing_at: p.processing_at,
        paid_at: p.paid_at,
        failed_at: p.failed_at,
      }));

      return NextResponse.json({ payouts: formattedPayouts || [] });
    }

    // Default: Get commissions
    let query = supabase
      .from('affiliate_commissions')
      .select(`
        id,
        order_id,
        affiliate_id,
        amount_cents,
        status,
        created_at,
        approved_at,
        paid_at,
        voided_at,
        notes,
        affiliates(display_name, email, slug),
        orders(user_id, amount_cents, currency, users(email))
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (affiliateId) {
      query = query.eq('affiliate_id', affiliateId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: commissions, error } = await query;

    if (error) {
      console.error('Error fetching commissions:', error);
      return NextResponse.json({ error: 'Failed to load commissions' }, { status: 500 });
    }

    const formattedCommissions = commissions?.map((c: any) => ({
      id: c.id,
      order_id: c.order_id,
      affiliate_id: c.affiliate_id,
      affiliate_name: c.affiliates?.display_name || 'N/A',
      affiliate_email: c.affiliates?.email || 'N/A',
      affiliate_slug: c.affiliates?.slug || 'N/A',
      customer_email: c.orders?.users?.email || 'N/A',
      order_amount_cents: c.orders?.amount_cents || 0,
      order_currency: c.orders?.currency || 'USD',
      commission_cents: c.amount_cents,
      commission_usd: (c.amount_cents / 100).toFixed(2),
      status: c.status,
      created_at: c.created_at,
      approved_at: c.approved_at,
      paid_at: c.paid_at,
      voided_at: c.voided_at,
      notes: c.notes,
    }));

    // Calculate stats
    const stats = {
      total: commissions?.length || 0,
      pending: commissions?.filter((c: any) => c.status === 'PENDING').length || 0,
      approved: commissions?.filter((c: any) => c.status === 'APPROVED').length || 0,
      paid: commissions?.filter((c: any) => c.status === 'PAID').length || 0,
      voided: commissions?.filter((c: any) => c.status === 'VOID').length || 0,
      pending_amount_cents: commissions?.filter((c: any) => c.status === 'PENDING').reduce((sum: number, c: any) => sum + c.amount_cents, 0) || 0,
      approved_amount_cents: commissions?.filter((c: any) => c.status === 'APPROVED').reduce((sum: number, c: any) => sum + c.amount_cents, 0) || 0,
      paid_amount_cents: commissions?.filter((c: any) => c.status === 'PAID').reduce((sum: number, c: any) => sum + c.amount_cents, 0) || 0,
    };

    return NextResponse.json({ commissions: formattedCommissions || [], stats });
  } catch (error) {
    console.error('Admin payouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a payout or mark commissions as paid
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, affiliate_id, commission_ids, method, destination, notes } = body;

    if (action === 'create_payout') {
      // Create a payout for approved commissions
      if (!affiliate_id || !commission_ids || commission_ids.length === 0) {
        return NextResponse.json({ error: 'Missing affiliate_id or commission_ids' }, { status: 400 });
      }

      // Get approved commissions for this affiliate
      const { data: commissions, error: commError } = await supabase
        .from('affiliate_commissions')
        .select('id, amount_cents')
        .eq('affiliate_id', affiliate_id)
        .eq('status', 'APPROVED')
        .in('id', commission_ids);

      if (commError || !commissions || commissions.length === 0) {
        return NextResponse.json({ error: 'No approved commissions found' }, { status: 400 });
      }

      const totalCents = commissions.reduce((sum, c) => sum + c.amount_cents, 0);

      // Create payout record
      const { data: payout, error: payoutError } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_id,
          total_cents: totalCents,
          method: method || 'OTHER',
          destination: destination || '',
          status: 'CREATED',
          notes: notes || '',
        })
        .select()
        .single();

      if (payoutError) {
        console.error('Error creating payout:', payoutError);
        return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
      }

      // Link commissions to payout
      const payoutCommissions = commission_ids.map((commissionId: string) => ({
        payout_id: payout.id,
        commission_id: commissionId,
      }));

      const { error: linkError } = await supabase
        .from('payout_commissions')
        .insert(payoutCommissions);

      if (linkError) {
        console.error('Error linking commissions to payout:', linkError);
        // Don't fail - payout was created
      }

      return NextResponse.json({ success: true, payout });
    }

    if (action === 'mark_paid') {
      // Mark a payout as paid
      const { payout_id } = body;
      if (!payout_id) {
        return NextResponse.json({ error: 'Missing payout_id' }, { status: 400 });
      }

      // Get commission IDs for this payout
      const { data: payoutCommissions } = await supabase
        .from('payout_commissions')
        .select('commission_id')
        .eq('payout_id', payout_id);

      const commissionIds = payoutCommissions?.map((pc: any) => pc.commission_id) || [];

      // Update payout status
      const { error: payoutError } = await supabase
        .from('affiliate_payouts')
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString(),
        })
        .eq('id', payout_id);

      if (payoutError) {
        return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
      }

      // Update commission statuses
      if (commissionIds.length > 0) {
        const { error: commError } = await supabase
          .from('affiliate_commissions')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
          })
          .in('id', commissionIds);

        if (commError) {
          console.error('Error updating commissions:', commError);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'void_commission') {
      // Void a specific commission
      const { commission_id, reason } = body;
      if (!commission_id) {
        return NextResponse.json({ error: 'Missing commission_id' }, { status: 400 });
      }

      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'VOID',
          voided_at: new Date().toISOString(),
          notes: reason || 'Voided by admin',
        })
        .eq('id', commission_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to void commission' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin payouts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
