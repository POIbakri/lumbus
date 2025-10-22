import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { topUpEsim, assignEsim } from '@/lib/esimaccess';
import { sendTopUpConfirmationEmail } from '@/lib/email';

const validateReceiptSchema = z.object({
  receipt: z.string(), // Base64 encoded receipt from Apple
  orderId: z.string().uuid(),
  transactionId: z.string().optional(), // Apple transaction ID
  isTopUp: z.boolean().optional(), // Whether this is a top-up purchase
  iccid: z.string().optional(), // ICCID for top-up purchases
});

/**
 * Apple Receipt Validation API
 *
 * This endpoint validates an Apple App Store receipt server-side.
 * Called by the mobile app after a successful IAP purchase.
 *
 * Flow:
 * 1. User completes purchase in app
 * 2. App receives receipt from Apple
 * 3. App sends receipt to this endpoint
 * 4. We validate with Apple's verifyReceipt endpoint
 * 5. If valid, we mark order as paid and provision eSIM
 * 6. We return success to app
 *
 * Apple Receipt Validation Docs:
 * https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[IAP Validate] Starting receipt validation...');
    const body = await req.json();
    console.log('[IAP Validate] Request body:', {
      orderId: body.orderId,
      hasReceipt: !!body.receipt,
      receiptLength: body.receipt?.length,
      transactionId: body.transactionId
    });

    const { receipt, orderId, transactionId, isTopUp, iccid } = validateReceiptSchema.parse(body);

    // Get order details
    console.log('[IAP Validate] Fetching order:', orderId);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, plan:plans(*), user:users(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[IAP Validate] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate top-up request has ICCID
    if (isTopUp && !iccid) {
      console.error('[IAP Validate] Top-up request missing ICCID');
      return NextResponse.json({ error: 'ICCID required for top-up' }, { status: 400 });
    }

    // Check if already processed
    if (order.status === 'paid' || order.status === 'completed' || order.status === 'provisioning') {
      console.log('[IAP Validate] Order already processed:', order.status);
      return NextResponse.json({
        valid: true,
        alreadyProcessed: true,
        orderId: order.id,
        status: order.status,
      });
    }

    console.log('[IAP Validate] Order found:', order.id, 'Status:', order.status);

    // Validate receipt with Apple
    console.log('[IAP Validate] Validating with Apple...');
    const appleValidation = await validateWithApple(receipt);

    if (!appleValidation.valid) {
      console.error('[IAP Validate] Receipt validation failed:', appleValidation.error);
      return NextResponse.json({
        error: 'Invalid receipt',
        details: appleValidation.error
      }, { status: 400 });
    }

    console.log('[IAP Validate] Receipt is valid!');
    console.log('[IAP Validate] Transaction ID:', appleValidation.transactionId);
    console.log('[IAP Validate] Product ID:', appleValidation.productId);

    // Get user for provisioning
    const user = Array.isArray(order.user) ? order.user[0] : order.user;
    const plan = Array.isArray(order.plan) ? order.plan[0] : order.plan;

    // Update order with Apple transaction details
    console.log('[IAP Validate] Updating order status to paid...');
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_session_id: appleValidation.transactionId, // Store Apple transaction ID
        amount_cents: appleValidation.amountCents || 0, // Apple doesn't provide amount in sandbox
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[IAP Validate] Failed to update order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Trigger eSIM provisioning or top-up
    console.log('[IAP Validate] Triggering eSIM provisioning/top-up...');

    try {
      if (isTopUp && iccid) {
        // Top-up existing eSIM
        console.log('[IAP Validate] Processing top-up for ICCID:', iccid);

        // Get existing order to retrieve esimTranNo
        const { data: existingOrderForTopUp } = await supabase
          .from('orders')
          .select('esim_tran_no, iccid')
          .eq('user_id', user.id)
          .eq('iccid', iccid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const esimTranNo = existingOrderForTopUp?.esim_tran_no;

        // Generate unique transaction ID
        const topUpTransactionId = `apple_topup_${orderId}_${Date.now()}`;

        const topUpResponse = await topUpEsim({
          iccid: esimTranNo ? undefined : iccid, // Use iccid only if no esimTranNo
          esimTranNo: esimTranNo || undefined,
          packageCode: plan.supplier_sku,
          transactionId: topUpTransactionId,
          amount: plan.retail_price.toString(),
        });

        if (topUpResponse.success) {
          // Update order with top-up details
          await supabase
            .from('orders')
            .update({
              status: 'completed',
              iccid: topUpResponse.iccid,
              data_remaining_bytes: topUpResponse.totalVolume - topUpResponse.orderUsage,
              data_usage_bytes: topUpResponse.orderUsage,
              last_usage_update: new Date().toISOString(),
            })
            .eq('id', orderId);

          // Send top-up confirmation email
          try {
            await sendTopUpConfirmationEmail({
              to: user.email,
              planName: plan.name,
              dataAdded: plan.data_gb,
              validityDays: plan.validity_days,
              iccid: topUpResponse.iccid,
            });
          } catch (emailError) {
            console.error('[IAP Validate] Failed to send top-up email:', emailError);
            // Don't fail the request
          }

          console.log('[IAP Validate] Top-up completed successfully');
        } else {
          throw new Error('Top-up failed');
        }
      } else {
        // Assign new eSIM
        console.log('[IAP Validate] Provisioning new eSIM...');

        const esimResponse = await assignEsim({
          packageId: plan.supplier_sku,
          email: user.email,
          reference: orderId,
        });

        // Update order with initial eSIM details
        // Status is 'provisioning' until we get activation details from ORDER_STATUS webhook
        await supabase
          .from('orders')
          .update({
            status: 'provisioning',
            connect_order_id: esimResponse.orderId,
            iccid: esimResponse.iccid || null,
          })
          .eq('id', orderId);

        console.log('[IAP Validate] New eSIM provisioning initiated');
      }
    } catch (provisionError) {
      console.error('[IAP Validate] Failed to provision/top-up:', provisionError);

      // Mark order as failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);

      return NextResponse.json({
        error: 'Provisioning failed',
        details: provisionError instanceof Error ? provisionError.message : 'Unknown error'
      }, { status: 500 });
    }

    console.log('[IAP Validate] Success! Receipt validated and order processed');
    return NextResponse.json({
      valid: true,
      orderId: order.id,
      transactionId: appleValidation.transactionId,
      status: 'paid',
    });
  } catch (error) {
    console.error('[IAP Validate] Error:', error);
    console.error('[IAP Validate] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

/**
 * Validate receipt with Apple's verifyReceipt endpoint
 *
 * Apple has two environments:
 * - Production: https://buy.itunes.apple.com/verifyReceipt
 * - Sandbox: https://sandbox.itunes.apple.com/verifyReceipt
 *
 * We try production first, then fall back to sandbox if status = 21007
 */
async function validateWithApple(receiptData: string): Promise<{
  valid: boolean;
  transactionId?: string;
  productId?: string;
  amountCents?: number;
  error?: string;
}> {
  const password = process.env.APPLE_IAP_SHARED_SECRET;

  if (!password) {
    console.error('[Apple Validate] APPLE_IAP_SHARED_SECRET not configured');
    return {
      valid: false,
      error: 'Apple IAP not configured. Contact support.'
    };
  }

  // Try production first
  console.log('[Apple Validate] Trying production environment...');
  let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': password,
      'exclude-old-transactions': true,
    }),
  });

  let data = await response.json();
  console.log('[Apple Validate] Production response status:', data.status);

  // Status 21007 means receipt is sandbox
  if (data.status === 21007) {
    console.log('[Apple Validate] Receipt is sandbox, trying sandbox environment...');
    response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': password,
        'exclude-old-transactions': true,
      }),
    });

    data = await response.json();
    console.log('[Apple Validate] Sandbox response status:', data.status);
  }

  // Status 0 = valid receipt
  if (data.status === 0) {
    // Extract latest transaction
    const latestReceipt = data.latest_receipt_info?.[0] || data.receipt?.in_app?.[0];

    if (!latestReceipt) {
      console.error('[Apple Validate] No transaction found in receipt');
      return {
        valid: false,
        error: 'No transaction found in receipt'
      };
    }

    console.log('[Apple Validate] Valid receipt!');
    console.log('[Apple Validate] Transaction ID:', latestReceipt.transaction_id);
    console.log('[Apple Validate] Product ID:', latestReceipt.product_id);

    return {
      valid: true,
      transactionId: latestReceipt.transaction_id,
      productId: latestReceipt.product_id,
      // Apple doesn't provide price in receipt, only in App Store Connect
      amountCents: 0, // We'll need to look this up from our product catalog
    };
  }

  // Invalid receipt
  const errorMessages: Record<number, string> = {
    21000: 'The App Store could not read the JSON object you provided.',
    21002: 'The data in the receipt-data property was malformed or missing.',
    21003: 'The receipt could not be authenticated.',
    21004: 'The shared secret you provided does not match the shared secret on file.',
    21005: 'The receipt server is not currently available.',
    21006: 'This receipt is valid but the subscription has expired.',
    21008: 'This receipt is from the test environment, but sent to production.',
    21009: 'Internal data access error.',
    21010: 'The user account cannot be found or has been deleted.',
  };

  const errorMessage = errorMessages[data.status] || `Unknown error: ${data.status}`;
  console.error('[Apple Validate] Receipt validation failed:', errorMessage);

  return {
    valid: false,
    error: errorMessage
  };
}
