import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { sendManualMilestoneSummary } from '@/lib/emails/milestone-alerts';
import { sendInstallReminderEmail, sendActivationReminderEmail } from '@/lib/emails/esim-reminders';
import { sendReferralPromoEmail } from '@/lib/marketing-emails';
import { sendAppDownloadEmail } from '@/lib/app-download-email';

// GET: List users for email selection
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('users')
      .select('id, email, referral_code, created_at, is_test_user')
      .eq('is_test_user', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    // Get user count
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_test_user', false);

    return NextResponse.json({
      users: users || [],
      totalUsers: count || 0,
    });
  } catch (error) {
    console.error('Admin email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send emails
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { emailType, recipients } = body;

    const results: { success: string[]; failed: string[] } = {
      success: [],
      failed: [],
    };

    switch (emailType) {
      case 'welcome': {
        // Send welcome email to selected users
        if (!recipients || recipients.length === 0) {
          return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }

        for (const email of recipients) {
          try {
            await sendWelcomeEmail({ to: email });
            results.success.push(email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send welcome email to ${email}:`, err);
            results.failed.push(email);
          }
        }
        break;
      }

      case 'welcome_all': {
        // Send welcome email to all non-test users
        const { data: users, error } = await supabase
          .from('users')
          .select('email')
          .eq('is_test_user', false);

        if (error || !users) {
          return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        for (const user of users) {
          try {
            await sendWelcomeEmail({ to: user.email });
            results.success.push(user.email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send welcome email to ${user.email}:`, err);
            results.failed.push(user.email);
          }
        }
        break;
      }

      case 'referral_promo': {
        // Send referral promo email to selected users
        if (!recipients || recipients.length === 0) {
          return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }

        // Get user referral codes
        const { data: users, error } = await supabase
          .from('users')
          .select('email, referral_code')
          .in('email', recipients);

        if (error || !users) {
          return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
        }

        for (const user of users) {
          if (!user.referral_code) continue;

          try {
            await sendReferralPromoEmail({
              to: user.email,
              referralCode: user.referral_code,
              referralLink: `https://getlumbus.com/r/${user.referral_code}`,
            });
            results.success.push(user.email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send referral promo email to ${user.email}:`, err);
            results.failed.push(user.email);
          }
        }
        break;
      }

      case 'referral_promo_all': {
        // Send referral promo to all users with referral codes
        const { data: users, error } = await supabase
          .from('users')
          .select('email, referral_code')
          .eq('is_test_user', false)
          .not('referral_code', 'is', null);

        if (error || !users) {
          return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        for (const user of users) {
          try {
            await sendReferralPromoEmail({
              to: user.email,
              referralCode: user.referral_code,
              referralLink: `https://getlumbus.com/r/${user.referral_code}`,
            });
            results.success.push(user.email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send referral promo email to ${user.email}:`, err);
            results.failed.push(user.email);
          }
        }
        break;
      }

      case 'app_download': {
        // Send app download email to selected users
        if (!recipients || recipients.length === 0) {
          return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }

        for (const email of recipients) {
          try {
            await sendAppDownloadEmail({ to: email, planName: 'your eSIM' });
            results.success.push(email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send app download email to ${email}:`, err);
            results.failed.push(email);
          }
        }
        break;
      }

      case 'install_reminder': {
        // Send install reminder to users who haven't installed their eSIM
        if (!recipients || recipients.length === 0) {
          return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }

        // Get active orders with plan details for each user
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            activated_at,
            users!orders_user_id_fkey(email),
            plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days)
          `)
          .in('status', ['paid', 'active'])
          .is('activated_at', null)
          .eq('is_topup', false);

        if (error || !orders) {
          return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        // Filter to selected recipients and get latest order per user
        type OrderWithJoins = {
          id: string;
          user_id: string;
          activated_at: string | null;
          users: { email: string } | null;
          plans: { name: string; region_code: string; data_gb: number; validity_days: number } | null;
        };
        const userOrders = new Map<string, OrderWithJoins>();
        for (const order of orders as unknown as OrderWithJoins[]) {
          const email = order.users?.email;
          if (email && recipients.includes(email)) {
            // Keep latest order
            if (!userOrders.has(email) || new Date(order.id) > new Date(userOrders.get(email)!.id)) {
              userOrders.set(email, order);
            }
          }
        }

        for (const [email, order] of userOrders) {
          const plan = order.plans;
          if (!plan) continue;

          try {
            await sendInstallReminderEmail({
              to: email,
              planName: plan.name,
              regionName: plan.region_code,
              dataGb: plan.data_gb,
              validityDays: plan.validity_days,
            });
            results.success.push(email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send install reminder to ${email}:`, err);
            results.failed.push(email);
          }
        }
        break;
      }

      case 'activation_reminder': {
        // Send activation reminder to users who installed but haven't used
        if (!recipients || recipients.length === 0) {
          return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
        }

        // Get orders that are active (installed) but have no data usage
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            activated_at,
            data_usage_bytes,
            users!orders_user_id_fkey(email),
            plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days)
          `)
          .eq('status', 'active')
          .not('activated_at', 'is', null)
          .or('data_usage_bytes.is.null,data_usage_bytes.eq.0')
          .eq('is_topup', false);

        if (error || !orders) {
          return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        // Filter to selected recipients
        type ActivationOrderWithJoins = {
          id: string;
          user_id: string;
          activated_at: string | null;
          data_usage_bytes: number | null;
          users: { email: string } | null;
          plans: { name: string; region_code: string; data_gb: number; validity_days: number } | null;
        };
        const userOrders = new Map<string, ActivationOrderWithJoins>();
        for (const order of orders as unknown as ActivationOrderWithJoins[]) {
          const email = order.users?.email;
          if (email && recipients.includes(email)) {
            if (!userOrders.has(email)) {
              userOrders.set(email, order);
            }
          }
        }

        for (const [email, order] of userOrders) {
          const plan = order.plans;
          if (!plan) continue;

          try {
            await sendActivationReminderEmail({
              to: email,
              planName: plan.name,
              regionName: plan.region_code,
              dataGb: plan.data_gb,
              validityDays: plan.validity_days,
            });
            results.success.push(email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send activation reminder to ${email}:`, err);
            results.failed.push(email);
          }
        }
        break;
      }

      case 'app_download_all': {
        // Send app download email to all non-test users
        const { data: users, error } = await supabase
          .from('users')
          .select('email')
          .eq('is_test_user', false);

        if (error || !users) {
          return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        for (const user of users) {
          try {
            await sendAppDownloadEmail({ to: user.email, planName: 'your eSIM' });
            results.success.push(user.email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send app download email to ${user.email}:`, err);
            results.failed.push(user.email);
          }
        }
        break;
      }

      case 'install_reminder_all': {
        // Send install reminder to all users with uninstalled eSIMs
        type InstallOrderWithJoins = {
          id: string;
          user_id: string;
          users: { email: string; is_test_user: boolean } | null;
          plans: { name: string; region_code: string; data_gb: number; validity_days: number } | null;
        };

        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            users!orders_user_id_fkey(email, is_test_user),
            plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days)
          `)
          .in('status', ['paid', 'active'])
          .is('activated_at', null)
          .eq('is_topup', false);

        if (error || !orders) {
          return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        // Get unique users (latest order per user)
        const userOrders = new Map<string, InstallOrderWithJoins>();
        for (const order of orders as unknown as InstallOrderWithJoins[]) {
          if (order.users?.is_test_user) continue;
          const email = order.users?.email;
          if (email && !userOrders.has(email)) {
            userOrders.set(email, order);
          }
        }

        for (const [email, order] of userOrders) {
          const plan = order.plans;
          if (!plan) continue;

          try {
            await sendInstallReminderEmail({
              to: email,
              planName: plan.name,
              regionName: plan.region_code,
              dataGb: plan.data_gb,
              validityDays: plan.validity_days,
            });
            results.success.push(email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send install reminder to ${email}:`, err);
            results.failed.push(email);
          }
        }
        break;
      }

      case 'activation_reminder_all': {
        // Send activation reminder to all users with installed but unused eSIMs
        type ActivationOrderWithJoins = {
          id: string;
          user_id: string;
          users: { email: string; is_test_user: boolean } | null;
          plans: { name: string; region_code: string; data_gb: number; validity_days: number } | null;
        };

        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            users!orders_user_id_fkey(email, is_test_user),
            plans!orders_plan_id_fkey(name, region_code, data_gb, validity_days)
          `)
          .eq('status', 'active')
          .not('activated_at', 'is', null)
          .or('data_usage_bytes.is.null,data_usage_bytes.eq.0')
          .eq('is_topup', false);

        if (error || !orders) {
          return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        // Get unique users
        const userOrders = new Map<string, ActivationOrderWithJoins>();
        for (const order of orders as unknown as ActivationOrderWithJoins[]) {
          if (order.users?.is_test_user) continue;
          const email = order.users?.email;
          if (email && !userOrders.has(email)) {
            userOrders.set(email, order);
          }
        }

        for (const [email, order] of userOrders) {
          const plan = order.plans;
          if (!plan) continue;

          try {
            await sendActivationReminderEmail({
              to: email,
              planName: plan.name,
              regionName: plan.region_code,
              dataGb: plan.data_gb,
              validityDays: plan.validity_days,
            });
            results.success.push(email);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send activation reminder to ${email}:`, err);
            results.failed.push(email);
          }
        }
        break;
      }

      case 'milestone_summary': {
        // Send milestone summary to admins
        const success = await sendManualMilestoneSummary();
        if (success) {
          results.success.push('admin');
        } else {
          results.failed.push('admin');
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sent: results.success.length,
      failed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Admin email POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
