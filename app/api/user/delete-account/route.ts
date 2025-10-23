import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendAccountDeletionEmail, sendAdminAccountDeletionNotification } from '@/lib/email';

/**
 * Delete User Account API
 *
 * This endpoint handles account deletion requests.
 * It marks the account for deletion and schedules it for removal within 30 days.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user with Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { confirmText } = body;

    // Verify confirmation text
    if (confirmText.toLowerCase() !== 'delete my account') {
      return NextResponse.json({
        error: 'Invalid confirmation text. Please type "DELETE MY ACCOUNT" exactly.'
      }, { status: 400 });
    }

    // Mark account for deletion (soft delete with scheduled removal)
    // We'll add a deleted_at timestamp and schedule actual deletion for 30 days later
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Update user profile with deletion timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        scheduled_deletion_date: deletionDate.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error marking account for deletion:', updateError);
      return NextResponse.json({
        error: 'Failed to process deletion request'
      }, { status: 500 });
    }

    // Send deletion confirmation email to user
    try {
      await sendAccountDeletionEmail({
        to: user.email || '',
        userEmail: user.email || '',
      });
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to admin
    try {
      await sendAdminAccountDeletionNotification({
        userEmail: user.email || '',
        userId: user.id,
        scheduledDate: deletionDate.toISOString(),
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the request if admin email fails
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account marked for deletion. You will be signed out.',
      scheduledDeletion: deletionDate.toISOString(),
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
