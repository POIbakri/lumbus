/**
 * Apply Free Data to eSIM
 * POST /api/rewards/apply-data - Apply free data from wallet to a specific eSIM
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { z } from 'zod';

const applyDataSchema = z.object({
  orderId: z.string().uuid(),
  amountMB: z.number().min(1024).max(10240), // Min 1GB, Max 10GB
});

/**
 * POST /api/rewards/apply-data
 * Apply free data to an active eSIM
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;
    const body = await req.json();

    // Validate request
    const { orderId, amountMB } = applyDataSchema.parse(body);

    // Get user's wallet balance
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('balance_mb')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet || wallet.balance_mb < amountMB) {
      return NextResponse.json({
        error: 'Insufficient free data balance',
        required: amountMB,
        available: wallet?.balance_mb || 0
      }, { status: 400 });
    }

    // Get the order and verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not eligible' }, { status: 404 });
    }

    // Check if eSIM is still active (has data remaining or not expired)
    const hasDataRemaining = order.data_remaining_bytes > 0;
    const isNotExpired = !order.expires_at || new Date(order.expires_at) > new Date();

    if (!hasDataRemaining && !isNotExpired) {
      return NextResponse.json({
        error: 'This eSIM has expired or has no data remaining. Please purchase a top-up instead.'
      }, { status: 400 });
    }

    // Get plan details
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Start transaction - deduct from wallet first
    const newWalletBalance = wallet.balance_mb - amountMB;
    const { error: walletError } = await supabase
      .from('user_data_wallet')
      .update({
        balance_mb: newWalletBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (walletError) {
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }

    // Apply free data to the order (internal tracking)
    // Note: Free data is bonus data that extends the eSIM's usable data
    const amountGB = amountMB / 1024;
    const amountBytes = amountMB * 1024 * 1024; // Convert MB to bytes

    // Update order with free data info
    const currentFreeData = order.free_data_added_mb || 0;
    const newTotalFreeData = currentFreeData + amountMB;
    const currentDataRemaining = order.data_remaining_bytes || 0;
    const newDataRemaining = currentDataRemaining + amountBytes;

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        free_data_added_mb: newTotalFreeData,
        free_data_added_at: new Date().toISOString(),
        // Add the free data to the remaining data balance
        data_remaining_bytes: newDataRemaining,
        last_usage_update: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      // Rollback wallet change
      await supabase
        .from('user_data_wallet')
        .update({
          balance_mb: wallet.balance_mb,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return NextResponse.json({
        error: 'Failed to apply free data. Your balance has been restored.'
      }, { status: 500 });
    }

    // Log the successful application
    console.log(`Applied ${amountMB}MB (${amountGB}GB) free data to order ${orderId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amountGB}GB to your eSIM!`,
      newWalletBalance: newWalletBalance,
      newWalletBalanceGB: (newWalletBalance / 1024).toFixed(1),
      orderDataRemaining: newDataRemaining,
      orderDataRemainingGB: (newDataRemaining / (1024 * 1024 * 1024)).toFixed(1),
    });

  } catch (error) {
    console.error('Apply data error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}