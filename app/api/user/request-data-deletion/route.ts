import { NextRequest, NextResponse } from 'next/server';
import { sendDataDeletionRequestConfirmation, sendAdminDataDeletionNotification } from '@/lib/email';

/**
 * Request Data Deletion API (GDPR Compliance)
 *
 * This endpoint handles partial data deletion requests.
 * Users can request deletion of specific personal data without closing their account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, specificData, reason } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({
        error: 'Valid email address is required'
      }, { status: 400 });
    }

    // Send confirmation email to user
    try {
      await sendDataDeletionRequestConfirmation({
        userEmail: email,
        specificData: specificData || '',
        reason: reason || '',
      });
    } catch (emailError) {
      console.error('Failed to send user confirmation email:', emailError);
      // Continue even if user email fails
    }

    // Send notification to admin
    try {
      await sendAdminDataDeletionNotification({
        userEmail: email,
        specificData: specificData || '',
        reason: reason || '',
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      return NextResponse.json({
        error: 'Failed to submit deletion request. Please try again or contact support.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data deletion request submitted successfully. You will receive a confirmation email shortly.',
    });

  } catch (error) {
    console.error('Request data deletion error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
