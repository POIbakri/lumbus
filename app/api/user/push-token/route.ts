/**
 * Push Token API
 * POST /api/user/push-token - Register Expo push notification token
 *
 * Saves the user's push notification token for sending notifications about:
 * - eSIM ready (order provisioned)
 * - Low data warning (80% used)
 * - Data depleted (100% used)
 * - Top-up success
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { z } from 'zod';

const pushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android']),
});

export async function POST(req: NextRequest) {
  try {
    console.log('[Push Token API] Request received');

    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      console.log('[Push Token API] Authentication failed');
      return auth.error;
    }

    const userId = auth.user.id;
    console.log('[Push Token API] Saving push token for user:', userId);

    // Parse and validate request body
    const body = await req.json();
    const validation = pushTokenSchema.safeParse(body);

    if (!validation.success) {
      console.error('[Push Token API] Validation error:', validation.error);
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { pushToken, platform } = validation.data;

    // Upsert push token (update if exists, insert if not)
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: userId,
          push_token: pushToken,
          platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('[Push Token API] Database error:', error);
      return NextResponse.json(
        {
          error: 'Failed to save push token',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('[Push Token API] Push token saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Push token saved successfully',
    });

  } catch (error) {
    console.error('[Push Token API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/push-token - Remove push notification token
 * Useful when user logs out or disables notifications
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('[Push Token API] DELETE request received');

    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      console.log('[Push Token API] Authentication failed');
      return auth.error;
    }

    const userId = auth.user.id;
    console.log('[Push Token API] Deleting push token for user:', userId);

    // Delete push token
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Push Token API] Database error:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete push token',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('[Push Token API] Push token deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Push token deleted successfully',
    });

  } catch (error) {
    console.error('[Push Token API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
