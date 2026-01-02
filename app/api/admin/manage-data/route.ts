import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';
import { assignEsim, topUpEsim, getOrderStatus } from '@/lib/esimaccess';
import { addFreeData } from '@/lib/wallet';
import { z } from 'zod';

// Schema for different gift types
const giftWalletSchema = z.object({
  type: z.literal('wallet'),
  userEmail: z.string().email(),
  dataMB: z.number().min(1).max(102400), // Max 100GB
  reason: z.string().min(1).max(500),
});

const giftTopUpSchema = z.object({
  type: z.literal('topup'),
  userEmail: z.string().email(),
  orderId: z.string().uuid(),
  planId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

const giftNewEsimSchema = z.object({
  type: z.literal('new_esim'),
  userEmail: z.string().email(),
  planId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

const giftDataSchema = z.discriminatedUnion('type', [
  giftWalletSchema,
  giftTopUpSchema,
  giftNewEsimSchema,
]);

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = giftDataSchema.parse(body);

    // Find user by email directly from users table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', data.userEmail)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (data.type) {
      case 'wallet': {
        // Add free data to wallet
        const success = await addFreeData(dbUser.id, data.dataMB, 'admin_credit');

        if (!success) {
          return NextResponse.json({ error: 'Failed to add data to wallet' }, { status: 500 });
        }

        // Log the action (don't fail if audit log fails)
        try {
          await supabase.from('admin_audit_log').insert({
            action: 'admin_credit_wallet',
            admin_email: req.headers.get('x-admin-email') || 'unknown',
            target_user_id: dbUser.id,
            target_user_email: dbUser.email,
            details: {
              data_mb: data.dataMB,
              data_gb: (data.dataMB / 1024).toFixed(2),
              reason: data.reason,
            },
          });
        } catch { /* ignore */ }

        return NextResponse.json({
          success: true,
          message: `Added ${(data.dataMB / 1024).toFixed(2)} GB to ${dbUser.email}'s wallet`,
          type: 'wallet',
          dataMB: data.dataMB,
        });
      }

      case 'topup': {
        // Get the existing order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            iccid,
            esim_tran_no,
            user_id,
            status,
            data_remaining_bytes,
            total_bytes,
            expired_at,
            plans(id, name, data_gb, validity_days, supplier_sku)
          `)
          .eq('id', data.orderId)
          .single();

        if (orderError || !order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.user_id !== dbUser.id) {
          return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 400 });
        }

        if (!order.iccid) {
          return NextResponse.json({ error: 'Order has no ICCID - eSIM not provisioned yet' }, { status: 400 });
        }

        // Get the plan to top up with
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, name, data_gb, validity_days, supplier_sku, is_reloadable')
          .eq('id', data.planId)
          .single();

        if (planError || !plan) {
          return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        if (!plan.is_reloadable) {
          return NextResponse.json({ error: 'This plan does not support top-ups' }, { status: 400 });
        }

        // Generate transaction ID
        const transactionId = `admin_gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Call eSIM Access API to top up
        console.log(`[Admin Gift] Topping up eSIM ${order.iccid} with plan ${plan.supplier_sku}`);

        const topUpResult = await topUpEsim({
          iccid: order.iccid,
          esimTranNo: order.esim_tran_no || undefined,
          packageCode: plan.supplier_sku,
          transactionId: transactionId,
        });

        // Create a new order record for the top-up
        const { data: newOrder, error: newOrderError } = await supabase
          .from('orders')
          .insert({
            user_id: dbUser.id,
            plan_id: plan.id,
            status: 'completed',
            is_topup: true,
            iccid: order.iccid,
            esim_tran_no: order.esim_tran_no,
            amount_cents: 0, // Free gift
            payment_method: 'admin_gift',
            paid_at: new Date().toISOString(),
            total_bytes: plan.data_gb * 1024 * 1024 * 1024,
            data_remaining_bytes: plan.data_gb * 1024 * 1024 * 1024,
            expired_at: topUpResult.expiredTime,
            topup_source: 'admin_gift',
          })
          .select()
          .single();

        if (newOrderError) {
          console.error('[Admin Gift] Failed to create top-up order:', newOrderError);
          // Top-up succeeded but order creation failed - log it
        }

        // Update the original order's data if needed
        await supabase
          .from('orders')
          .update({
            total_bytes: topUpResult.totalVolume,
            data_remaining_bytes: topUpResult.totalVolume - topUpResult.orderUsage,
            expired_at: topUpResult.expiredTime,
          })
          .eq('id', order.id);

        // Log the action (don't fail if audit log fails)
        try {
          await supabase.from('admin_audit_log').insert({
            action: 'admin_topup',
            admin_email: req.headers.get('x-admin-email') || 'unknown',
            target_user_id: dbUser.id,
            target_user_email: dbUser.email,
            details: {
              original_order_id: order.id,
              new_order_id: newOrder?.id,
              plan_name: plan.name,
              data_gb: plan.data_gb,
              iccid: order.iccid,
              reason: data.reason,
            },
          });
        } catch { /* ignore */ }

        return NextResponse.json({
          success: true,
          message: `Topped up ${dbUser.email}'s eSIM with ${plan.data_gb} GB (${plan.name})`,
          type: 'topup',
          orderId: newOrder?.id,
          planName: plan.name,
          dataGB: plan.data_gb,
          expiredAt: topUpResult.expiredTime,
        });
      }

      case 'new_esim': {
        // Get the plan
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, name, data_gb, validity_days, supplier_sku, retail_price')
          .eq('id', data.planId)
          .single();

        if (planError || !plan) {
          return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Create pending order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: dbUser.id,
            plan_id: plan.id,
            status: 'provisioning',
            is_topup: false,
            amount_cents: 0, // Free gift
            payment_method: 'admin_gift',
            paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError || !order) {
          return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        try {
          // Call eSIM Access API to provision new eSIM
          console.log(`[Admin Gift] Provisioning new eSIM with plan ${plan.supplier_sku} for ${dbUser.email}`);

          const esimResult = await assignEsim({
            packageId: plan.supplier_sku,
            email: dbUser.email,
            reference: order.id,
          });

          // If we got an orderId, poll for activation details
          let qrUrl = esimResult.qrCode;
          let iccid = esimResult.iccid;
          let activationCode = esimResult.activationCode;
          let esimTranNo = '';

          if (esimResult.orderId && esimResult.status === 'pending') {
            // Poll for activation details (max 30 seconds)
            const maxAttempts = 15;
            for (let i = 0; i < maxAttempts; i++) {
              await new Promise((r) => setTimeout(r, 2000)); // Wait 2 seconds

              try {
                const statusResult = await getOrderStatus(esimResult.orderId);
                const esim = statusResult.esimList?.[0];

                if (esim && esim.qrCodeUrl) {
                  qrUrl = esim.qrCodeUrl;
                  iccid = esim.iccid;
                  activationCode = esim.ac;
                  esimTranNo = esim.esimTranNo;
                  console.log(`[Admin Gift] Got eSIM details on attempt ${i + 1}`);
                  break;
                }
              } catch (e) {
                console.log(`[Admin Gift] Polling attempt ${i + 1} failed:`, e);
              }
            }
          }

          // Update order with eSIM details
          const totalBytes = plan.data_gb * 1024 * 1024 * 1024;
          const expiredAt = new Date();
          expiredAt.setDate(expiredAt.getDate() + plan.validity_days);

          await supabase
            .from('orders')
            .update({
              status: 'completed',
              iccid: iccid,
              esim_tran_no: esimTranNo,
              qr_url: qrUrl,
              activation_code: activationCode,
              esimaccess_order_id: esimResult.orderId,
              total_bytes: totalBytes,
              data_remaining_bytes: totalBytes,
              expired_at: expiredAt.toISOString(),
            })
            .eq('id', order.id);

          // Log the action (don't fail if audit log fails)
          try {
            await supabase.from('admin_audit_log').insert({
              action: 'admin_new_esim',
              admin_email: req.headers.get('x-admin-email') || 'unknown',
              target_user_id: dbUser.id,
              target_user_email: dbUser.email,
              details: {
                order_id: order.id,
                plan_name: plan.name,
                data_gb: plan.data_gb,
                iccid: iccid,
                reason: data.reason,
              },
            });
          } catch { /* ignore */ }

          return NextResponse.json({
            success: true,
            message: `Created new eSIM for ${dbUser.email} with ${plan.data_gb} GB (${plan.name})`,
            type: 'new_esim',
            orderId: order.id,
            planName: plan.name,
            dataGB: plan.data_gb,
            iccid: iccid,
            qrUrl: qrUrl,
          });
        } catch (esimError) {
          console.error('[Admin Gift] Failed to provision eSIM:', esimError);

          // Update order to failed
          await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('id', order.id);

          return NextResponse.json(
            {
              error: 'Failed to provision eSIM',
              details: esimError instanceof Error ? esimError.message : 'Unknown error',
            },
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error('[Admin Gift] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's orders for top-up selection
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Find user by email directly from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's orders with eSIMs
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        iccid,
        status,
        created_at,
        data_remaining_bytes,
        total_bytes,
        expired_at,
        is_topup,
        plans(id, name, data_gb, region_code)
      `)
      .eq('user_id', user.id)
      .not('iccid', 'is', null)
      .in('status', ['completed', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Get wallet balance
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('balance_mb')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      walletBalanceMB: wallet?.balance_mb || 0,
      orders: orders?.map((o: any) => ({
        id: o.id,
        iccid: o.iccid,
        status: o.status,
        createdAt: o.created_at,
        dataRemainingBytes: o.data_remaining_bytes,
        totalBytes: o.total_bytes,
        expiredAt: o.expired_at,
        isTopup: o.is_topup,
        plan: o.plans,
      })) || [],
    });
  } catch (error) {
    console.error('[Admin Gift GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
