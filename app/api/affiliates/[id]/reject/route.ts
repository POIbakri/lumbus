import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendAffiliateRejectedEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Basic auth check (same as admin panel)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"',
          },
        }
      );
    }

    // Verify admin credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedPasswordHash) {
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }

    // Verify credentials
    const isValid = username === expectedUsername && await bcrypt.compare(password, expectedPasswordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"',
          },
        }
      );
    }

    // Get affiliate
    const { data: affiliate, error: fetchError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    if (affiliate.application_status !== 'pending') {
      return NextResponse.json(
        { error: 'Affiliate application is not pending' },
        { status: 400 }
      );
    }

    // Reject affiliate
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({
        application_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
        is_active: false,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to reject affiliate:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject affiliate' },
        { status: 500 }
      );
    }

    // Send rejection email
    if (affiliate.email) {
      try {
        await sendAffiliateRejectedEmail({
          to: affiliate.email,
          displayName: affiliate.display_name,
          reason: reason || undefined,
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate rejected successfully',
      affiliate: {
        id: affiliate.id,
        display_name: affiliate.display_name,
        application_status: 'rejected',
      },
    });
  } catch (error) {
    console.error('Error rejecting affiliate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
