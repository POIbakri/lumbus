import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendAffiliateApprovedEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Approve affiliate
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({
        application_status: 'approved',
        approved_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to approve affiliate:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve affiliate' },
        { status: 500 }
      );
    }

    // Send approval email
    if (affiliate.email) {
      try {
        await sendAffiliateApprovedEmail({
          to: affiliate.email,
          displayName: affiliate.display_name,
          slug: affiliate.slug,
          commissionRate: affiliate.commission_value,
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate approved successfully',
      affiliate: {
        id: affiliate.id,
        display_name: affiliate.display_name,
        application_status: 'approved',
      },
    });
  } catch (error) {
    console.error('Error approving affiliate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
