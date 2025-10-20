import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendAffiliateApplicationEmail, sendAdminNewAffiliateApplicationEmail } from '@/lib/email';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      display_name,
      email,
      website,
      audience_description,
      traffic_sources,
      promotional_methods,
    } = body;

    // Validation
    if (!display_name || !email || !audience_description || !traffic_sources || !promotional_methods) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get authenticated user if available
    let authenticatedUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        authenticatedUserId = user.id;

        // Verify that the authenticated user's email matches the application email
        if (user.email?.toLowerCase() !== email.toLowerCase().trim()) {
          return NextResponse.json(
            { error: 'Application email must match your account email' },
            { status: 400 }
          );
        }
      }
    } catch (authError) {
      console.log('No authenticated user found, proceeding without user_id:', authError);
      // Continue without user_id - allow non-authenticated applications
    }

    // Check if email already exists
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('id, email, application_status, user_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingAffiliate) {
      if (existingAffiliate.application_status === 'pending') {
        return NextResponse.json(
          { error: 'An application with this email is already pending review' },
          { status: 400 }
        );
      } else if (existingAffiliate.application_status === 'approved') {
        return NextResponse.json(
          { error: 'An affiliate account with this email already exists' },
          { status: 400 }
        );
      } else if (existingAffiliate.application_status === 'rejected') {
        return NextResponse.json(
          { error: 'A previous application with this email was rejected. Please contact support.' },
          { status: 400 }
        );
      }
    }

    // Check if user already has an affiliate account with a different email
    if (authenticatedUserId) {
      const { data: userAffiliate } = await supabase
        .from('affiliates')
        .select('id, email, application_status')
        .eq('user_id', authenticatedUserId)
        .single();

      if (userAffiliate) {
        return NextResponse.json(
          { error: 'You already have an affiliate application/account' },
          { status: 400 }
        );
      }
    }

    // Generate slug from display name
    const slug = display_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    // Check if slug exists and make it unique
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const { data: existingSlug } = await supabase
        .from('affiliates')
        .select('id')
        .eq('slug', finalSlug)
        .single();

      if (!existingSlug) break;

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create affiliate application
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .insert([
        {
          user_id: authenticatedUserId, // Link to authenticated user if available
          display_name,
          email: email.toLowerCase().trim(),
          website: website?.trim() || null,
          audience_description: audience_description.trim(),
          traffic_sources: traffic_sources.trim(),
          promotional_methods: promotional_methods.trim(),
          slug: finalSlug,
          commission_type: 'PERCENT',
          commission_value: 12, // Default 12% commission
          is_active: false, // Inactive until approved
          application_status: 'pending',
          applied_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating affiliate application:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Send confirmation email to applicant
    try {
      await sendAffiliateApplicationEmail({
        applicantEmail: email.toLowerCase().trim(),
        displayName: display_name,
        website: website?.trim() || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send applicant email:', emailError);
      // Continue even if email fails
    }

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'partners@lumbus.com';
    try {
      await sendAdminNewAffiliateApplicationEmail({
        adminEmail,
        applicant: {
          displayName: display_name,
          email: email.toLowerCase().trim(),
          website: website?.trim() || undefined,
          audienceDescription: audience_description.trim(),
          trafficSources: traffic_sources.trim(),
          promotionalMethods: promotional_methods.trim(),
        },
        applicationId: affiliate.id,
      });
    } catch (emailError) {
      console.error('Failed to send admin email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully! We will review it within 1-2 business days.',
        affiliate: {
          id: affiliate.id,
          display_name: affiliate.display_name,
          email: affiliate.email,
          application_status: affiliate.application_status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in affiliate application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
