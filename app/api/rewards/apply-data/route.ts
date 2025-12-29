/**
 * Apply Free Data to eSIM
 * POST /api/rewards/apply-data - Apply free data from wallet to a specific eSIM
 *
 * This replicates the exact Stripe webhook top-up flow, but uses wallet credit instead of payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { topUpEsim, getTopUpPackages } from '@/lib/esimaccess';
import { getSystemConfig } from '@/lib/commission';
import { sendRewardClaimConfirmationEmail } from '@/lib/email';
import { z } from 'zod';

const applyDataSchema = z.object({
  orderId: z.string().uuid(),
  amountMB: z.number().min(1024).max(10240), // Min 1GB, Max 10GB
});

/**
 * POST /api/rewards/apply-data
 * Apply free data to an active eSIM - replicates paid top-up flow exactly
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

    // Check if user is a test user (for mock responses)
    const { data: user } = await supabase
      .from('users')
      .select('is_test_user')
      .eq('id', userId)
      .single();
    const isTestUser = (user as any)?.is_test_user === true;

    // Validate request
    const { orderId, amountMB } = applyDataSchema.parse(body);

    // Load referral configuration
    const systemConfig = await getSystemConfig();
    const cfgRewardMB = systemConfig.REFERRAL_GIVE_MB as unknown;
    const rewardUnitMB =
      typeof cfgRewardMB === 'number'
        ? cfgRewardMB
        : Number(cfgRewardMB as string) || 1024;

    // Amount must be a positive multiple of the reward unit (e.g. 1GB)
    if (amountMB < rewardUnitMB || amountMB % rewardUnitMB !== 0) {
      return NextResponse.json(
        { error: `Amount must be a multiple of ${rewardUnitMB}MB`, rewardUnitMB },
        { status: 400 }
      );
    }

    const units = amountMB / rewardUnitMB;

    // Get user's wallet balance
    const { data: wallet } = await supabase
      .from('user_data_wallet')
      .select('balance_mb')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet || wallet.balance_mb < amountMB) {
      return NextResponse.json(
        { error: 'Insufficient free data balance', required: amountMB, available: wallet?.balance_mb || 0 },
        { status: 400 }
      );
    }

    // Get the ORIGINAL order (the eSIM we want to top up)
    const { data: originalOrder } = await supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .eq('is_topup', false) // Must be original order, not a top-up
      .in('status', ['completed', 'active', 'depleted'])
      .maybeSingle();

    if (!originalOrder) {
      return NextResponse.json({ error: 'Original eSIM order not found or not eligible' }, { status: 404 });
    }

    // Check if eSIM is still active
    const isNotExpired = !originalOrder.expires_at || new Date(originalOrder.expires_at) > new Date();
    if (!isNotExpired) {
      return NextResponse.json(
        { error: 'This eSIM has expired and cannot be topped up with rewards.' },
        { status: 400 }
      );
    }

    // Get the original plan details
    const originalPlan = Array.isArray(originalOrder.plans) ? originalOrder.plans[0] : originalOrder.plans;
    if (!originalPlan) {
      return NextResponse.json({ error: 'Original plan not found' }, { status: 404 });
    }

    // Check if the plan is reloadable
    if ((originalPlan as any).is_reloadable === false) {
      return NextResponse.json(
        { error: 'This plan does not support top-ups. Please purchase a new plan instead.' },
        { status: 400 }
      );
    }

    // Get eSIM identifiers from original order
    const existingOrderIccid = originalOrder.iccid;
    const esimTranNo = (originalOrder as unknown as { esim_tran_no?: string }).esim_tran_no;

    if (!existingOrderIccid && !esimTranNo) {
      return NextResponse.json({ error: 'eSIM has no ICCID or transaction number' }, { status: 400 });
    }

    // For rewards, we want to add exactly 1GB
    const oneGbBytes = 1024 * 1024 * 1024;

    let rewardPackage: {
      packageCode: string;
      slug?: string;
      name: string;
      volume?: number;
      validity: string;
      price: number;
      currency: string;
      locationCode: string;
    };

    // Skip API call for test users (like Stripe webhook does)
    if (isTestUser) {
      console.log('[Reward Top-up] Test user - using mock package');
      rewardPackage = {
        packageCode: 'TEST_1GB_REWARD',
        slug: 'TEST_1_30',
        name: 'Test Reward 1GB 30Days',
        volume: oneGbBytes,
        validity: '30 Days',
        price: 0,
        currency: 'USD',
        locationCode: originalPlan.region_code,
      };
    } else {
      // Query eSIM Access API for compatible top-up packages for this specific ICCID
      console.log(`[Reward Top-up] Querying top-up packages for ICCID: ${existingOrderIccid}, esimTranNo: ${esimTranNo}`);

      let topUpPackages;
      try {
        topUpPackages = await getTopUpPackages({
          iccid: existingOrderIccid,
          esimTranNo: esimTranNo || undefined,
        });
      } catch (pkgError) {
        console.error('[Reward Top-up] Failed to get top-up packages:', pkgError);
        return NextResponse.json(
          { error: 'Failed to get available top-up packages for this eSIM' },
          { status: 400 }
        );
      }

      console.log(`[Reward Top-up] Total packages available: ${topUpPackages.length}`);

      // Filter packages by the original eSIM's region
      const regionPackages = topUpPackages.filter(pkg =>
        pkg.locationCode === originalPlan.region_code
      );
      console.log(`[Reward Top-up] Packages for region ${originalPlan.region_code}: ${regionPackages.length}`);

      // Find a ~1GB package with a valid slug for top-up
      const foundPackage = regionPackages.find(pkg => {
        const volumeBytes = pkg.volume || 0;
        const hasSlug = !!(pkg as any).slug;
        return volumeBytes >= oneGbBytes * 0.9 && volumeBytes <= oneGbBytes * 1.1 && hasSlug;
      }) || regionPackages.find(pkg => {
        // Fallback: any 1GB package even without slug
        const volumeBytes = pkg.volume || 0;
        return volumeBytes >= oneGbBytes * 0.9 && volumeBytes <= oneGbBytes * 1.1;
      });

      if (!foundPackage) {
        console.log('[Reward Top-up] No 1GB package found for region. Available:', regionPackages.map(p => ({
          code: p.packageCode,
          slug: (p as any).slug,
          name: p.name,
          volumeGB: p.volume ? (p.volume / oneGbBytes).toFixed(2) : 'N/A'
        })));
        return NextResponse.json(
          { error: `No 1GB top-up package available for region ${originalPlan.region_code}`, availablePackages: regionPackages.length },
          { status: 400 }
        );
      }

      rewardPackage = foundPackage as typeof rewardPackage;
    }

    // For top-ups, use slug (not packageCode) per eSIM Access API docs
    const topUpCode = (rewardPackage as any).slug || rewardPackage.packageCode;
    console.log(`[Reward Top-up] Using package: ${rewardPackage.name} (slug: ${topUpCode}, code: ${rewardPackage.packageCode})`);

    // Find matching plan in our database for order record (or use original plan)
    const { data: matchingPlan } = await supabase
      .from('plans')
      .select('id, data_gb, validity_days')
      .eq('supplier_sku', rewardPackage.packageCode)
      .eq('is_reloadable', true) // Only use reloadable plans
      .maybeSingle();

    // Extract validity days from package - validity is a string like "30 Days"
    const validityStr = rewardPackage.validity || '';
    const packageValidityDays = parseInt(validityStr.match(/\d+/)?.[0] || '7', 10);
    const packageDataGb = (rewardPackage.volume || 0) / (1024 * 1024 * 1024);

    // Process each reward unit (1GB each)
    // Track successfully applied units for partial failure handling
    let successfulUnits = 0;
    let lastTopUpResponse: {
      success: boolean;
      transactionId: string;
      iccid: string;
      expiredTime: string;
      totalVolume: number;
      totalDuration: number;
      orderUsage: number;
    } | null = null;

    // Track cumulative values for accurate mock calculations across loop iterations
    let cumulativeDataBytes = (originalOrder.total_bytes
      ?? ((originalOrder.data_remaining_bytes ?? 0) + (originalOrder.data_usage_bytes ?? 0)))
      || ((originalPlan.data_gb ?? 0) * 1024 * 1024 * 1024);
    let cumulativeUsageBytes = originalOrder.data_usage_bytes || 0;
    let cumulativeExpiryTime = originalOrder.expires_at || undefined;

    for (let i = 0; i < units; i++) {
      // Step 1: Create a top-up ORDER record (exactly like Stripe/checkout does)
      // Note: topup_source requires migration 029_add_topup_source.sql to be applied
      const { data: topUpOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          plan_id: matchingPlan?.id || originalPlan.id, // Use matching plan or original plan
          status: 'paid', // Mark as paid (using wallet credit)
          is_topup: true,
          topup_source: 'reward', // Distinguish from paid top-ups
          iccid: existingOrderIccid, // Target ICCID for top-up
        })
        .select()
        .single();

      if (createOrderError || !topUpOrder) {
        console.error('[Reward Top-up] Failed to create top-up order:', createOrderError);

        // Deduct wallet for any successfully applied units before failure
        if (successfulUnits > 0) {
          const appliedMB = successfulUnits * rewardUnitMB;
          const partialNewBalance = (wallet.balance_mb || 0) - appliedMB;
          await supabase
            .from('user_data_wallet')
            .update({ balance_mb: partialNewBalance, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

          console.log(`[Reward Top-up] Order creation failed after ${successfulUnits} successful units, deducted ${appliedMB}MB`);

          return NextResponse.json(
            {
              error: 'Partial failure: some data was applied before order creation error',
              appliedUnits: successfulUnits,
              appliedMB,
              newWalletBalance: partialNewBalance,
            },
            { status: 207 }
          );
        }

        return NextResponse.json({ error: 'Failed to create reward top-up order' }, { status: 500 });
      }

      console.log(`[Reward Top-up] Created top-up order: ${topUpOrder.id}`);

      // Step 2: Call eSIM provider EXACTLY like Stripe webhook does
      // Include loop index to ensure unique transactionId per iteration
      const transactionId = `${Date.now()}_${i}_reward`;

      try {
        console.log(`[Reward Top-up] Calling topUpEsim - slug: ${topUpCode}, iccid: ${existingOrderIccid}, esimTranNo: ${esimTranNo}`);

        lastTopUpResponse = await topUpEsim({
          iccid: existingOrderIccid,
          esimTranNo: esimTranNo || undefined,
          packageCode: topUpCode, // Use slug for top-ups per API docs
          transactionId,
          // Mock data for test users - use cumulative values for accurate multi-unit calculations
          mockPlanDataGb: packageDataGb,
          mockPlanValidityDays: packageValidityDays,
          mockExistingDataBytes: cumulativeDataBytes,
          mockExistingUsageBytes: cumulativeUsageBytes,
          mockExistingExpiryTime: cumulativeExpiryTime,
        }, isTestUser);

        console.log(`[Reward Top-up] Provider response:`, JSON.stringify(lastTopUpResponse));

        if (lastTopUpResponse.success) {
          // Step 3: Update top-up order with details (exactly like Stripe webhook)
          await supabase
            .from('orders')
            .update({
              status: 'completed',
              iccid: lastTopUpResponse.iccid,
              total_bytes: lastTopUpResponse.totalVolume,
              data_remaining_bytes: lastTopUpResponse.totalVolume - lastTopUpResponse.orderUsage,
              data_usage_bytes: lastTopUpResponse.orderUsage,
              expires_at: lastTopUpResponse.expiredTime,
              last_usage_update: new Date().toISOString(),
            })
            .eq('id', topUpOrder.id);

          // Step 4: Update ORIGINAL order's data (exactly like Stripe webhook)
          await supabase
            .from('orders')
            .update({
              data_remaining_bytes: lastTopUpResponse.totalVolume - lastTopUpResponse.orderUsage,
              data_usage_bytes: lastTopUpResponse.orderUsage,
              total_bytes: lastTopUpResponse.totalVolume,
              expires_at: lastTopUpResponse.expiredTime,
              last_usage_update: new Date().toISOString(),
            })
            .eq('id', orderId);

          console.log(`[Reward Top-up] Successfully applied reward ${i + 1}/${units}`);
          successfulUnits++;

          // Update cumulative values for next iteration's mock calculations
          cumulativeDataBytes = lastTopUpResponse.totalVolume;
          cumulativeUsageBytes = lastTopUpResponse.orderUsage;
          cumulativeExpiryTime = lastTopUpResponse.expiredTime;
        }
      } catch (providerError: unknown) {
        const errorMessage = providerError instanceof Error ? providerError.message : 'Unknown error';
        console.error(`[Reward Top-up] Provider failed:`, errorMessage);

        // Update order to failed status
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', topUpOrder.id);

        // Deduct wallet for any successfully applied units before failure
        if (successfulUnits > 0) {
          const appliedMB = successfulUnits * rewardUnitMB;
          const partialNewBalance = (wallet.balance_mb || 0) - appliedMB;
          await supabase
            .from('user_data_wallet')
            .update({ balance_mb: partialNewBalance, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

          console.log(`[Reward Top-up] Partial failure: deducted ${appliedMB}MB for ${successfulUnits} successful units`);

          return NextResponse.json(
            {
              error: 'Partial failure: some data was applied before error',
              details: errorMessage,
              appliedUnits: successfulUnits,
              appliedMB,
              newWalletBalance: partialNewBalance,
            },
            { status: 207 } // 207 Multi-Status for partial success
          );
        }

        return NextResponse.json(
          { error: 'eSIM provider rejected the top-up', details: errorMessage },
          { status: 400 }
        );
      }
    }

    if (!lastTopUpResponse) {
      return NextResponse.json({ error: 'Top-up failed' }, { status: 500 });
    }

    // Deduct from wallet AFTER successful top-up
    const newWalletBalance = (wallet.balance_mb || 0) - amountMB;
    const { error: walletError } = await supabase
      .from('user_data_wallet')
      .update({ balance_mb: newWalletBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (walletError) {
      // Critical: Data was added but wallet wasn't deducted
      console.error('[Reward Top-up] CRITICAL: Wallet deduction failed after successful top-up:', walletError);
      // Still return success since data was applied, but log for manual reconciliation
      // Don't fail the request as user already received the data
    }

    // Send confirmation email
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (user?.email) {
        await sendRewardClaimConfirmationEmail({
          to: user.email,
          planName: rewardPackage.name,
          dataAdded: amountMB / 1024,
          validityDays: packageValidityDays, // Days added by this package, not cumulative total
          iccid: lastTopUpResponse.iccid || existingOrderIccid || '',
          remainingBalanceGB: (newWalletBalance / 1024).toFixed(1),
        });
      }
    } catch (emailError) {
      console.error('[Reward Top-up] Email failed:', emailError);
    }

    console.log(`[Reward Top-up] Complete - applied ${amountMB}MB to order ${orderId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amountMB / 1024}GB to your eSIM!`,
      newWalletBalance,
      newWalletBalanceGB: (newWalletBalance / 1024).toFixed(1),
    });

  } catch (error) {
    console.error('Apply data error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
