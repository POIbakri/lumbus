/**
 * Milestone Alerts
 * Sends summary emails to support@getlumbus.com every 10 orders
 */

import { Resend } from 'resend';
import { supabase } from '@/lib/db';

let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY?.replace(/\s+/g, '');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface OrderSummary {
  id: string;
  userEmail: string;
  planName: string;
  regionCode: string;
  dataGb: number;
  amountUsd: number; // Plan's USD retail price
  isTopup: boolean;
  createdAt: string;
}

/**
 * Check if we've hit a milestone and send summary email
 * Call this after each successful order
 */
export async function checkAndSendMilestoneAlert(currentOrderId: string): Promise<boolean> {
  try {
    // Get total completed orders count (excluding test users)
    const { data: orderCount } = await supabase
      .from('orders')
      .select('id, users!inner(is_test_user)')
      .in('status', ['completed', 'active'])
      .eq('users.is_test_user', false);

    const totalOrders = orderCount?.length || 0;

    if (!totalOrders) return false;

    // Only send on multiples of 10
    if (totalOrders % 10 !== 0) return false;

    // Get the last 10 orders (excluding test users)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        is_topup,
        created_at,
        users!inner(email, is_test_user),
        plans(name, region_code, data_gb, retail_price)
      `)
      .in('status', ['completed', 'active'])
      .eq('users.is_test_user', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentOrders || recentOrders.length < 10) return false;

    // Check if current order is in the batch (to prevent duplicate alerts)
    const hasCurrentOrder = recentOrders.some(o => o.id === currentOrderId);
    if (!hasCurrentOrder) return false;

    // Calculate summary stats - use plan's USD retail_price for accurate revenue
    const orders: OrderSummary[] = recentOrders.map(order => {
      const user = Array.isArray(order.users) ? order.users[0] : order.users;
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

      return {
        id: order.id,
        userEmail: (user as any)?.email || 'Unknown',
        planName: (plan as any)?.name || 'Unknown Plan',
        regionCode: (plan as any)?.region_code || 'N/A',
        dataGb: (plan as any)?.data_gb || 0,
        amountUsd: (plan as any)?.retail_price || 0, // USD price from plan
        isTopup: order.is_topup || false,
        createdAt: order.created_at,
      };
    });

    const totalRevenueUsd = orders.reduce((sum, o) => sum + o.amountUsd, 0);
    const totalDataGb = orders.reduce((sum, o) => sum + o.dataGb, 0);
    const newPurchases = orders.filter(o => !o.isTopup).length;
    const topups = orders.filter(o => o.isTopup).length;

    // Get unique regions
    const regions = [...new Set(orders.map(o => o.regionCode))];

    await sendMilestoneSummaryEmail({
      milestoneNumber: totalOrders,
      orders,
      totalRevenueUsd,
      totalDataGb,
      newPurchases,
      topups,
      regions,
    });

    return true;
  } catch (error) {
    console.error('[Milestone] Failed to check/send milestone alert:', error);
    return false;
  }
}

interface SendMilestoneSummaryParams {
  milestoneNumber: number;
  orders: OrderSummary[];
  totalRevenueUsd: number;
  totalDataGb: number;
  newPurchases: number;
  topups: number;
  regions: string[];
}

async function sendMilestoneSummaryEmail(params: SendMilestoneSummaryParams) {
  const {
    milestoneNumber,
    orders,
    totalRevenueUsd,
    totalDataGb,
    newPurchases,
    topups,
    regions,
  } = params;

  const formattedRevenue = totalRevenueUsd.toFixed(2);

  // Generate order rows
  const orderRows = orders.map((order, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
      <td style="padding: 10px 8px; font-size: 12px; color: #666666; border-bottom: 1px solid #E5E5E5;">
        ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </td>
      <td style="padding: 10px 8px; font-size: 12px; color: #1A1A1A; border-bottom: 1px solid #E5E5E5;">
        ${order.userEmail.length > 20 ? order.userEmail.substring(0, 17) + '...' : order.userEmail}
      </td>
      <td style="padding: 10px 8px; font-size: 12px; border-bottom: 1px solid #E5E5E5;">
        <span style="display: inline-block; padding: 2px 8px; background-color: ${order.isTopup ? '#E0F2FE' : '#D1FAE5'}; color: ${order.isTopup ? '#0369A1' : '#047857'}; border-radius: 4px; font-size: 10px; font-weight: 600;">
          ${order.isTopup ? 'TOP-UP' : 'NEW'}
        </span>
      </td>
      <td style="padding: 10px 8px; font-size: 12px; color: #1A1A1A; border-bottom: 1px solid #E5E5E5;">
        ${order.regionCode}
      </td>
      <td style="padding: 10px 8px; font-size: 12px; color: #1A1A1A; border-bottom: 1px solid #E5E5E5; text-align: right;">
        ${order.dataGb}GB
      </td>
      <td style="padding: 10px 8px; font-size: 12px; color: #1A1A1A; border-bottom: 1px solid #E5E5E5; text-align: right; font-weight: 600;">
        $${order.amountUsd.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1A1A1A; text-align: center;">
      ${milestoneNumber} Orders
    </h2>
    <p style="margin: 0 0 30px; font-size: 14px; color: #666666; text-align: center;">
      Milestone reached on ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
    </p>

    <!-- Stats Cards -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 0 0 30px;">
      <tr>
        <td width="48%" style="padding: 20px; background-color: #E0FEF7; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 32px; font-weight: 800; color: #1A1A1A;">$${formattedRevenue}</p>
          <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Revenue</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="padding: 20px; background-color: #F5F5F5; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 32px; font-weight: 800; color: #1A1A1A;">${totalDataGb}GB</p>
          <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Data Sold</p>
        </td>
      </tr>
    </table>

    <!-- Quick Stats -->
    <div style="margin: 0 0 30px; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #666666;">New Purchases</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">${newPurchases}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #666666;">Top-ups</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">${topups}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #666666;">Regions</td>
          <td style="padding: 6px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">${regions.join(', ')}</td>
        </tr>
      </table>
    </div>

    <!-- Order Details Table -->
    <p style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #1A1A1A;">Last 10 Orders</p>
    <div style="border: 1px solid #E5E5E5; border-radius: 8px; overflow: hidden;">
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <thead>
          <tr style="background-color: #1A1A1A;">
            <th style="padding: 10px 8px; font-size: 11px; color: #FFFFFF; text-align: left; font-weight: 600;">Date</th>
            <th style="padding: 10px 8px; font-size: 11px; color: #FFFFFF; text-align: left; font-weight: 600;">Customer</th>
            <th style="padding: 10px 8px; font-size: 11px; color: #FFFFFF; text-align: left; font-weight: 600;">Type</th>
            <th style="padding: 10px 8px; font-size: 11px; color: #FFFFFF; text-align: left; font-weight: 600;">Region</th>
            <th style="padding: 10px 8px; font-size: 11px; color: #FFFFFF; text-align: right; font-weight: 600;">Data</th>
            <th style="padding: 10px 8px; font-size: 11px; color: #FFFFFF; text-align: right; font-weight: 600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${orderRows}
        </tbody>
      </table>
    </div>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: ['support@getlumbus.com'],
      subject: `Milestone: ${milestoneNumber} Orders - $${formattedRevenue} in last 10`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Milestone - Lumbus</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }
        #outlook a { padding: 0; }
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        @media screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 0 !important; }
            .mobile-padding { padding: 20px 16px !important; }
            .inner-padding { padding: 24px 16px !important; }
            h2 { font-size: 20px !important; }
            p { font-size: 14px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!--[if mso]>
    <center>
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
    <tr>
    <td align="center" valign="top" width="600">
    <![endif]-->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 24px 16px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" class="mobile-padding" style="padding: 32px 24px 24px; border-bottom: 3px solid #2EFECC;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="140" style="display: block; width: 140px; height: auto;" />
                            </a>
                            <p style="margin: 12px 0 0; font-size: 14px; color: #666666; font-weight: 500;">Order Milestone Report</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="mobile-padding inner-padding" style="padding: 32px 24px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 12px; color: #999999;">
                                            © ${new Date().getFullYear()} Lumbus Technologies Limited
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <!--[if mso]>
    </td>
    </tr>
    </table>
    </center>
    <![endif]-->
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log(`[Milestone] Sent milestone alert for ${milestoneNumber} orders`);
    return data;
  } catch (error) {
    console.error('Failed to send milestone email:', error);
    return null;
  }
}

/**
 * Manually trigger a milestone summary (for testing or manual reports)
 */
export async function sendManualMilestoneSummary(): Promise<boolean> {
  try {
    // Get total count (excluding test users)
    const { data: orderCount } = await supabase
      .from('orders')
      .select('id, users!inner(is_test_user)')
      .in('status', ['completed', 'active'])
      .eq('users.is_test_user', false);

    const totalOrders = orderCount?.length || 0;

    if (!totalOrders) return false;

    // Get last 10 orders (excluding test users)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        is_topup,
        created_at,
        users!inner(email, is_test_user),
        plans(name, region_code, data_gb, retail_price)
      `)
      .in('status', ['completed', 'active'])
      .eq('users.is_test_user', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentOrders || recentOrders.length === 0) return false;

    // Use plan's USD retail_price for accurate revenue
    const orders: OrderSummary[] = recentOrders.map(order => {
      const user = Array.isArray(order.users) ? order.users[0] : order.users;
      const plan = Array.isArray(order.plans) ? order.plans[0] : order.plans;

      return {
        id: order.id,
        userEmail: (user as any)?.email || 'Unknown',
        planName: (plan as any)?.name || 'Unknown Plan',
        regionCode: (plan as any)?.region_code || 'N/A',
        dataGb: (plan as any)?.data_gb || 0,
        amountUsd: (plan as any)?.retail_price || 0, // USD price from plan
        isTopup: order.is_topup || false,
        createdAt: order.created_at,
      };
    });

    const totalRevenueUsd = orders.reduce((sum, o) => sum + o.amountUsd, 0);
    const totalDataGb = orders.reduce((sum, o) => sum + o.dataGb, 0);
    const newPurchases = orders.filter(o => !o.isTopup).length;
    const topups = orders.filter(o => o.isTopup).length;
    const regions = [...new Set(orders.map(o => o.regionCode))];

    await sendMilestoneSummaryEmail({
      milestoneNumber: totalOrders,
      orders,
      totalRevenueUsd,
      totalDataGb,
      newPurchases,
      topups,
      regions,
    });

    return true;
  } catch (error) {
    console.error('[Milestone] Failed to send manual summary:', error);
    return false;
  }
}
