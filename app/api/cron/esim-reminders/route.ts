/**
 * Cron Job: Send eSIM Reminder Emails
 *
 * Automatically sends reminder emails to users who:
 * 1. Install Reminder: Purchased 24+ hours ago but haven't installed (no activated_at)
 * 2. Activation Reminder: Installed 3+ days ago but haven't used (data_usage_bytes = 0)
 *
 * Repeats weekly (won't send if already sent within 7 days)
 *
 * Runs daily at 10:00 AM UTC via Vercel Cron
 *
 * GET /api/cron/esim-reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendInstallReminderEmail, sendActivationReminderEmail } from '@/lib/emails/esim-reminders';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (!cronSecret) {
    console.warn('[Reminder Cron] No CRON_SECRET set, allowing request (local dev only)');
    return true;
  }

  return false;
}

// Time constants
const HOURS_24 = 24 * 60 * 60 * 1000;
const DAYS_3 = 3 * 24 * 60 * 60 * 1000;
const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

interface OrderWithDetails {
  id: string;
  user_id: string;
  created_at: string;
  activated_at: string | null;
  data_usage_bytes: number | null;
  users: { email: string; is_test_user: boolean } | null;
  plans: { name: string; region_code: string; data_gb: number; validity_days: number } | null;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Reminder Cron] Starting eSIM reminder job...');

  const results = {
    install_reminders: { sent: 0, skipped: 0, failed: 0 },
    activation_reminders: { sent: 0, skipped: 0, failed: 0 },
    errors: [] as string[],
  };

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - HOURS_24);
    const threeDaysAgo = new Date(now.getTime() - DAYS_3);
    const sevenDaysAgo = new Date(now.getTime() - DAYS_7);

    // =========================================================
    // 1. INSTALL REMINDERS
    // Users who purchased 24+ hours ago but haven't installed
    // =========================================================
    console.log('[Reminder Cron] Checking for install reminders...');

    const { data: installOrders, error: installError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        created_at,
        activated_at,
        data_usage_bytes,
        users!orders_user_id_fkey(email, is_test_user),
        plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days)
      `)
      .in('status', ['paid', 'active'])
      .is('activated_at', null)
      .eq('is_topup', false)
      .lte('created_at', twentyFourHoursAgo.toISOString());

    if (installError) {
      console.error('[Reminder Cron] Error fetching install orders:', installError);
      results.errors.push(`Install query error: ${installError.message}`);
    } else if (installOrders && installOrders.length > 0) {
      console.log(`[Reminder Cron] Found ${installOrders.length} orders needing install reminder check`);

      for (const order of installOrders as unknown as OrderWithDetails[]) {
        // Skip test users
        if (order.users?.is_test_user) {
          results.install_reminders.skipped++;
          continue;
        }

        // Check if we already sent this reminder in the last 7 days
        const { data: recentReminder } = await supabase
          .from('esim_reminder_emails')
          .select('id')
          .eq('order_id', order.id)
          .eq('email_type', 'install_reminder')
          .gte('sent_at', sevenDaysAgo.toISOString())
          .limit(1);

        if (recentReminder && recentReminder.length > 0) {
          results.install_reminders.skipped++;
          continue;
        }

        // Send the reminder
        const email = order.users?.email;
        const plan = order.plans;

        if (!email || !plan) {
          results.install_reminders.skipped++;
          continue;
        }

        try {
          await sendInstallReminderEmail({
            to: email,
            planName: plan.name,
            regionName: plan.region_code,
            dataGb: plan.data_gb,
            validityDays: plan.validity_days,
          });

          // Track the sent email
          const { error: trackError } = await supabase.from('esim_reminder_emails').insert({
            order_id: order.id,
            email_type: 'install_reminder',
          });

          if (trackError) {
            console.error(`[Reminder Cron] Failed to track install reminder for order ${order.id}:`, trackError);
          }

          results.install_reminders.sent++;
          console.log(`[Reminder Cron] Sent install reminder to ${email} for order ${order.id}`);

          // Small delay between emails to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`[Reminder Cron] Failed to send install reminder to ${email}:`, err);
          results.install_reminders.failed++;
          results.errors.push(`Install reminder failed for ${email}`);
        }
      }
    } else {
      console.log('[Reminder Cron] No orders need install reminders');
    }

    // =========================================================
    // 2. ACTIVATION REMINDERS
    // Users who installed 3+ days ago but haven't used
    // =========================================================
    console.log('[Reminder Cron] Checking for activation reminders...');

    const { data: activationOrders, error: activationError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        created_at,
        activated_at,
        data_usage_bytes,
        users!orders_user_id_fkey(email, is_test_user),
        plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days)
      `)
      .eq('status', 'active')
      .not('activated_at', 'is', null)
      .lte('activated_at', threeDaysAgo.toISOString())
      .or('data_usage_bytes.is.null,data_usage_bytes.eq.0')
      .eq('is_topup', false);

    if (activationError) {
      console.error('[Reminder Cron] Error fetching activation orders:', activationError);
      results.errors.push(`Activation query error: ${activationError.message}`);
    } else if (activationOrders && activationOrders.length > 0) {
      console.log(`[Reminder Cron] Found ${activationOrders.length} orders needing activation reminder check`);

      for (const order of activationOrders as unknown as OrderWithDetails[]) {
        // Skip test users
        if (order.users?.is_test_user) {
          results.activation_reminders.skipped++;
          continue;
        }

        // Check if we already sent this reminder in the last 7 days
        const { data: recentReminder } = await supabase
          .from('esim_reminder_emails')
          .select('id')
          .eq('order_id', order.id)
          .eq('email_type', 'activation_reminder')
          .gte('sent_at', sevenDaysAgo.toISOString())
          .limit(1);

        if (recentReminder && recentReminder.length > 0) {
          results.activation_reminders.skipped++;
          continue;
        }

        // Send the reminder
        const email = order.users?.email;
        const plan = order.plans;

        if (!email || !plan) {
          results.activation_reminders.skipped++;
          continue;
        }

        try {
          await sendActivationReminderEmail({
            to: email,
            planName: plan.name,
            regionName: plan.region_code,
            dataGb: plan.data_gb,
            validityDays: plan.validity_days,
          });

          // Track the sent email
          const { error: trackError } = await supabase.from('esim_reminder_emails').insert({
            order_id: order.id,
            email_type: 'activation_reminder',
          });

          if (trackError) {
            console.error(`[Reminder Cron] Failed to track activation reminder for order ${order.id}:`, trackError);
          }

          results.activation_reminders.sent++;
          console.log(`[Reminder Cron] Sent activation reminder to ${email} for order ${order.id}`);

          // Small delay between emails
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`[Reminder Cron] Failed to send activation reminder to ${email}:`, err);
          results.activation_reminders.failed++;
          results.errors.push(`Activation reminder failed for ${email}`);
        }
      }
    } else {
      console.log('[Reminder Cron] No orders need activation reminders');
    }

    const duration = Date.now() - startTime;
    console.log(`[Reminder Cron] Completed in ${duration}ms:`, results);

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      results,
    });

  } catch (error) {
    console.error('[Reminder Cron] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}
