/**
 * Apply Free Data to eSIM
 * POST /api/rewards/apply-data - Apply free data from wallet to a specific eSIM
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireUserAuth } from '@/lib/server-auth';
import { topUpEsim } from '@/lib/esimaccess';
import { getSystemConfig } from '@/lib/commission';
import { sendTopUpConfirmationEmail } from '@/lib/email';
import { z } from 'zod';

const applyDataSchema = z.object({
  orderId: z.string().uuid(),
  amountMB: z.number().min(1024).max(10240), // Min 1GB, Max 10GB
  packageSku: z.string().optional(),
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
    const { orderId, amountMB, packageSku } = applyDataSchema.parse(body);

    // Load referral configuration so reward units align with system_config
    const systemConfig = await getSystemConfig();
    const cfgRewardMB = systemConfig.REFERRAL_GIVE_MB as unknown;
    const rewardUnitMB =
      typeof cfgRewardMB === 'number'
        ? cfgRewardMB
        : Number(cfgRewardMB as string) || 1024;

    // Amount must be a positive multiple of the reward unit (e.g. 1GB)
    if (amountMB < rewardUnitMB || amountMB % rewardUnitMB !== 0) {
      return NextResponse.json(
        {
          error: `Amount must be a multiple of ${rewardUnitMB}MB`,
          rewardUnitMB,
        },
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
        {
          error: 'Insufficient free data balance',
          required: amountMB,
          available: wallet?.balance_mb || 0,
        },
        { status: 400 }
      );
    }

    // Get the order and verify ownership (allow completed, active, or depleted eSIMs)
    const { data: order } = await supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .in('status', ['completed', 'active', 'depleted'])
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not eligible' }, { status: 404 });
    }

    // Check if eSIM is still active: reject ANY expired eSIM regardless of remaining data
    const isNotExpired = !order.expires_at || new Date(order.expires_at) > new Date();

    if (!isNotExpired) {
      return NextResponse.json(
        {
          error:
            'This eSIM has expired and cannot be topped up with rewards. Please purchase a new plan or top-up for a new eSIM.',
        },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Determine top-up package for referral rewards
    let referralRewardPackageCode: string | null = null;

    if (packageSku) {
      // Validate that the selected SKU is an active ~1GB plan in the database
      const { data: packagePlan, error: packagePlanError } = await supabase
        .from('plans')
        .select('supplier_sku, data_gb, is_active')
        .eq('supplier_sku', packageSku)
        .eq('is_active', true)
        .maybeSingle();

      if (packagePlanError || !packagePlan || packagePlan.data_gb < 0.9 || packagePlan.data_gb > 1.1) {
        return NextResponse.json(
          { error: 'Invalid package selected for reward application' },
          { status: 400 }
        );
      }

      referralRewardPackageCode = packagePlan.supplier_sku;
    } else {
      // Auto-detect: find a 1GB package matching the eSIM's region
      const esimRegion = plan.region_code;

      if (esimRegion) {
        // First try to find a regional 1GB package
        const { data: regionalPackage } = await supabase
          .from('plans')
          .select('supplier_sku')
          .eq('region_code', esimRegion)
          .eq('is_active', true)
          .gte('data_gb', 0.9)
          .lte('data_gb', 1.1)
          .order('retail_price', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (regionalPackage) {
          referralRewardPackageCode = regionalPackage.supplier_sku;
          console.log(`Auto-selected regional 1GB package: ${referralRewardPackageCode} for region ${esimRegion}`);
        }
      }

      // Fallback to system config if no regional package found
      if (!referralRewardPackageCode) {
        const pkgCodeRaw = systemConfig.REFERRAL_REWARD_PACKAGE_CODE as unknown;
        referralRewardPackageCode =
          typeof pkgCodeRaw === 'string' && pkgCodeRaw.trim().length > 0
            ? pkgCodeRaw.trim()
            : null;
      }
    }

    if (!referralRewardPackageCode) {
      return NextResponse.json(
        { error: 'No compatible 1GB package found for this eSIM region' },
        { status: 400 }
      );
    }

    // Ensure we have an identifier for the eSIM (prefer esim_tran_no)
    const esimTranNo: string | undefined = (order as any).esim_tran_no || undefined;
    const iccid: string | undefined = order.iccid || undefined;

    if (!esimTranNo && !iccid) {
      return NextResponse.json(
        { error: 'This eSIM cannot be topped up (missing esim_tran_no and ICCID)' },
        { status: 400 }
      );
    }

    // Call eSIM Access API to perform real top-ups (one per reward unit)
    let lastTopUpResponse:
      | {
          success: boolean;
          transactionId: string;
          iccid: string;
          expiredTime: string;
          totalVolume: number;
          totalDuration: number;
          orderUsage: number;
        }
      | null = null;

    for (let i = 0; i < units; i++) {
      const transactionId = `reward_${orderId}_${Date.now()}_${i}`;
      lastTopUpResponse = await topUpEsim({
        iccid: esimTranNo ? undefined : iccid,
        esimTranNo: esimTranNo,
        packageCode: referralRewardPackageCode,
        transactionId,
      });
    }

    // If we reached here without an exception and have a response, all top-ups succeeded
    if (!lastTopUpResponse) {
      return NextResponse.json(
        { error: 'Failed to apply free data via eSIM provider' },
        { status: 500 }
      );
    }

    const amountGB = amountMB / 1024;

    // Use provider's totals as the source of truth
    const newDataRemaining = lastTopUpResponse.totalVolume - lastTopUpResponse.orderUsage;
    const providerIccid = lastTopUpResponse.iccid || iccid || null;

    // Update orders table to reflect new free data and remaining balance
    const currentFreeData = (order as any).free_data_added_mb || 0;
    const newTotalFreeData = currentFreeData + amountMB;

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        free_data_added_mb: newTotalFreeData,
        free_data_added_at: new Date().toISOString(),
        data_remaining_bytes: newDataRemaining,
        last_usage_update: new Date().toISOString(),
        iccid: providerIccid,
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Failed to update order after provider top-up:', orderUpdateError);
      return NextResponse.json(
        {
          error:
            'Free data was added by the eSIM provider, but we could not update your order. Please contact support so we can fix this.',
        },
        { status: 500 }
      );
    }

    // Deduct from wallet AFTER successful provider top-up
    const newWalletBalance = (wallet.balance_mb || 0) - amountMB;
    const { error: walletError } = await supabase
      .from('user_data_wallet')
      .update({
        balance_mb: newWalletBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (walletError) {
      console.error('Failed to update wallet after provider top-up:', walletError);
      return NextResponse.json(
        {
          error:
            'Free data was added to your eSIM, but we could not update your wallet balance. Please contact support so we can fix this.',
        },
        { status: 500 }
      );
    }

    // Send confirmation email (non-blocking)
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (user?.email) {
        const validityDays =
          (lastTopUpResponse.totalDuration as number | undefined) ??
          (plan.validity_days as number | undefined) ??
          0;

        await sendTopUpConfirmationEmail({
          to: user.email,
          planName: plan.name,
          dataAdded: amountGB,
          validityDays,
          iccid: providerIccid || '',
        });
      }
    } catch (emailError) {
      console.error('Failed to send top-up confirmation email for reward:', emailError);
    }

    // Log the successful application
    console.log(`Applied ${amountMB}MB (${amountGB}GB) free data (via provider) to order ${orderId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amountGB}GB to your eSIM!`,
      newWalletBalance,
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