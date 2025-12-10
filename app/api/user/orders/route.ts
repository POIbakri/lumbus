/**
 * User Orders API
 * GET /api/user/orders - Get all orders for the authenticated user
 *
 * Returns all orders with plan details joined for the logged-in user.
 * Used by mobile app dashboard to display user's eSIM orders.
 *
 * For test users: Uses cron-populated data from DB, with on-the-fly
 * simulation as fallback if cron hasn't run yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { applyTestSimulationToOrders } from '@/lib/test-simulation';

export async function GET(req: NextRequest) {
  try {
    console.log('[User Orders API] Request received');

    // Require authentication
    const auth = await requireUserAuth(req);
    if (auth.error) {
      console.log('[User Orders API] Authentication failed');
      return auth.error;
    }

    const userId = auth.user.id;
    console.log('[User Orders API] Fetching orders for user:', userId);

    // Check if user is a test user (for fallback simulation if cron hasn't run)
    const { data: userData } = await supabase
      .from('users')
      .select('is_test_user')
      .eq('id', userId)
      .single();

    const isTestUser = userData?.is_test_user === true;

    // Fetch all orders for the user with plan details joined
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        smdp,
        activation_code,
        iccid,
        activated_at,
        expires_at,
        data_usage_bytes,
        data_remaining_bytes,
        last_usage_update,
        stripe_session_id,
        amount_cents,
        currency,
        is_topup,
        created_at,
        updated_at,
        plans!orders_plan_id_fkey (
          id,
          name,
          region_code,
          data_gb,
          validity_days,
          retail_price,
          currency
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[User Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[User Orders API] Successfully fetched ${orders?.length || 0} orders`);

    // Helper function to calculate time remaining
    const calculateTimeRemaining = (order: any) => {
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
      const validityDays = plan?.validity_days || 0;

      // If not activated, return full validity
      if (!order.activated_at) {
        return {
          days: validityDays,
          hours: 0,
          minutes: 0,
          total_seconds: validityDays * 24 * 60 * 60,
          is_expired: false,
          formatted: `${validityDays} ${validityDays === 1 ? 'day' : 'days'}`,
        };
      }

      // Calculate expiry date from expires_at or activated_at + validity_days
      let expiryDate: Date;
      if (order.expires_at) {
        expiryDate = new Date(order.expires_at);
        // Validate the parsed date - fall back to calculation if invalid
        if (isNaN(expiryDate.getTime())) {
          const activationDate = new Date(order.activated_at);
          expiryDate = new Date(activationDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
        }
      } else {
        const activationDate = new Date(order.activated_at);
        expiryDate = new Date(activationDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
      }

      // Final validation - if still invalid, return full validity as fallback
      if (isNaN(expiryDate.getTime())) {
        return {
          days: validityDays,
          hours: 0,
          minutes: 0,
          total_seconds: validityDays * 24 * 60 * 60,
          is_expired: false,
          formatted: `${validityDays} ${validityDays === 1 ? 'day' : 'days'}`,
        };
      }

      const now = new Date();
      const totalMs = expiryDate.getTime() - now.getTime();

      if (totalMs <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          total_seconds: 0,
          is_expired: true,
          formatted: 'Expired',
        };
      }

      const totalSeconds = Math.floor(totalMs / 1000);
      const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));

      // Format: days if >= 1 day, hours if < 1 day, minutes if < 1 hour
      let formatted: string;
      if (days >= 1) {
        formatted = `${days} ${days === 1 ? 'day' : 'days'}`;
      } else if (hours >= 1) {
        formatted = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        formatted = `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
      }

      return {
        days,
        hours,
        minutes,
        total_seconds: totalSeconds,
        is_expired: false,
        formatted,
      };
    };

    // Format the response to ensure plans is always an object and include time_remaining
    const formattedOrders = orders?.map((order: any) => ({
      ...order,
      plan: Array.isArray(order.plans) ? order.plans[0] : order.plans,
      plans: undefined, // Remove the plans array
      time_remaining: calculateTimeRemaining(order),
    })) || [];

    // For test users: check if cron has populated data, otherwise apply on-the-fly simulation
    // This ensures test users always see realistic data even if cron hasn't run yet
    let finalOrders = formattedOrders;

    if (isTestUser) {
      // Only simulate individual orders that need it (cron hasn't run yet)
      // Preserve cron-populated data for orders that already have it
      finalOrders = formattedOrders.map((order: any) => {
        // Only handle completed or provisioning orders (matches applyTestSimulationToOrders behavior)
        if (order.status !== 'completed' && order.status !== 'provisioning') return order;

        // If cron has already populated this order, keep the cron data
        if (order.last_usage_update !== null) return order;

        // Only simulate this specific order (cron hasn't run yet)
        const simulated = applyTestSimulationToOrders([order], true);
        return simulated[0] || order;
      });

      const simulatedCount = formattedOrders.filter((o: any) =>
        (o.status === 'completed' || o.status === 'provisioning') && o.last_usage_update === null
      ).length;

      if (simulatedCount > 0) {
        console.log(`[User Orders API] Applied on-the-fly simulation for ${simulatedCount} order(s) (cron not yet run)`);
      } else {
        console.log('[User Orders API] Using cron-populated data for test user');
      }
    }

    return NextResponse.json({
      orders: finalOrders,
      count: finalOrders.length,
    });

  } catch (error) {
    console.error('[User Orders API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
