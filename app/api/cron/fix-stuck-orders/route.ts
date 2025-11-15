import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getOrderStatus } from '@/lib/esimaccess';
import { sendOrderConfirmationEmail } from '@/lib/email';

/**
 * Automatic recovery for stuck orders
 * Run every 5 minutes via Vercel Cron or external scheduler
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/fix-stuck-orders",
 *     "schedule": "*\/5 * * * *"
 *   }]
 * }
 */

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Stuck Orders Cron] Starting automatic recovery...');

    // Find orders stuck in provisioning for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: stuckOrders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        plan_id,
        connect_order_id,
        created_at,
        users!inner(email),
        plans!inner(name, data_gb, validity_days, supplier_sku)
      `)
      .eq('status', 'provisioning')
      .not('connect_order_id', 'is', null)
      .lte('created_at', fiveMinutesAgo)
      .limit(10); // Process max 10 orders per run to avoid timeout

    if (error) {
      console.error('[Stuck Orders Cron] Error fetching stuck orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      console.log('[Stuck Orders Cron] No stuck orders found');
      return NextResponse.json({
        success: true,
        message: 'No stuck orders',
        processed: 0
      });
    }

    console.log(`[Stuck Orders Cron] Found ${stuckOrders.length} stuck orders`);

    let fixed = 0;
    let failed = 0;

    for (const order of stuckOrders) {
      try {
        // Poll eSIM Access API for activation details
        const orderDetails = await getOrderStatus(order.connect_order_id);

        if (!orderDetails?.esimList || orderDetails.esimList.length === 0) {
          console.log(`[Stuck Orders Cron] No eSIM details for order ${order.id} yet`);
          failed++;
          continue;
        }

        const firstProfile = orderDetails.esimList[0];
        const lpaString = firstProfile.ac;

        // Extract SMDP and activation code from LPA string
        const parts = lpaString.split('$');
        const smdpAddress = parts.length >= 2 ? parts[1] : '';
        const activationCode = parts.length >= 3 ? parts[2] : '';

        if (!smdpAddress || !activationCode) {
          console.log(`[Stuck Orders Cron] Incomplete activation details for order ${order.id}`);
          failed++;
          continue;
        }

        // Update order with activation details
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            iccid: firstProfile.iccid,
            esim_tran_no: firstProfile.esimTranNo,
            smdp: smdpAddress,
            activation_code: activationCode,
            qr_url: firstProfile.qrCodeUrl || firstProfile.shortUrl || null,
            last_usage_update: new Date().toISOString(),
          })
          .eq('id', order.id);

        console.log(`[Stuck Orders Cron] Fixed order ${order.id}`);

        // Send confirmation email
        const user = Array.isArray(order.users) ? order.users[0] : order.users;
        const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

        if (user?.email && plan) {
          try {
            // Format activation before date if available
            let formattedActivateBeforeDate: string | undefined;
            if (firstProfile.expiredTime) {
              const expireDate = new Date(firstProfile.expiredTime.replace(' UTC', 'Z'));
              formattedActivateBeforeDate = expireDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short',
              });
            }

            await sendOrderConfirmationEmail({
              to: user.email,
              orderDetails: {
                planName: plan.name,
                dataGb: plan.data_gb,
                validityDays: plan.validity_days,
              },
              activationDetails: {
                smdp: smdpAddress,
                activationCode: activationCode,
                qrUrl: firstProfile.qrCodeUrl || firstProfile.shortUrl || '',
                lpaString: lpaString,
                iccid: firstProfile.iccid,
                activateBeforeDate: formattedActivateBeforeDate,
                apn: firstProfile.apn,
              },
              installUrl: `${process.env.NEXT_PUBLIC_APP_URL}/install/${order.id}`,
            });

            console.log(`[Stuck Orders Cron] Email sent for order ${order.id}`);
          } catch (emailError) {
            console.error(`[Stuck Orders Cron] Email failed for order ${order.id}:`, emailError);
            // Don't count as failed - order was still fixed
          }
        }

        fixed++;
      } catch (error) {
        console.error(`[Stuck Orders Cron] Failed to fix order ${order.id}:`, error);
        failed++;
      }

      // Small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const message = `Fixed ${fixed} orders, ${failed} still stuck`;
    console.log(`[Stuck Orders Cron] ${message}`);

    // Alert if there are persistent stuck orders
    if (failed > 0) {
      // You could send an alert to admin here
      console.error(`[Stuck Orders Cron] WARNING: ${failed} orders remain stuck after recovery attempt`);
    }

    return NextResponse.json({
      success: true,
      message,
      processed: fixed + failed,
      fixed,
      failed
    });

  } catch (error) {
    console.error('[Stuck Orders Cron] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req);
}