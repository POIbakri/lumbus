import { Resend } from 'resend';

// Lazy initialization - only create instance when needed
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

export interface SendOrderConfirmationParams {
  to: string;
  orderDetails: {
    planName: string;
    dataGb: number;
    validityDays: number;
  };
  activationDetails: {
    smdp: string;
    activationCode: string;
    qrUrl: string;
    lpaString: string;
  };
  installUrl: string;
}

export interface SendDataUsageAlertParams {
  to: string;
  planName: string;
  usagePercent: number;
  dataUsedGB: number;
  dataRemainingGB: number;
  totalDataGB: number;
}

export interface SendPlanExpiryAlertParams {
  to: string;
  planName: string;
  daysRemaining: number;
  expiryDate: string;
}

export interface SendReferralRewardParams {
  to: string;
  referredUserEmail: string;
  rewardAmount: string;
  referralCode: string;
}

export interface SendTopUpConfirmationParams {
  to: string;
  planName: string;
  dataAdded: number; // in GB
  validityDays: number;
  iccid: string;
}

export interface SendAffiliateApplicationParams {
  applicantEmail: string;
  displayName: string;
  website?: string;
}

export interface SendAffiliateApprovedParams {
  to: string;
  displayName: string;
  slug: string;
  commissionRate: number;
}

export interface SendAffiliateRejectedParams {
  to: string;
  displayName: string;
  reason?: string;
}

export interface SendAdminNewAffiliateApplicationParams {
  adminEmail: string;
  applicant: {
    displayName: string;
    email: string;
    website?: string;
    audienceDescription: string;
    trafficSources: string;
    promotionalMethods: string;
  };
  applicationId: string;
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  const { to, orderDetails, activationDetails, installUrl } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: `Your Lumbus eSIM is ready! - ${orderDetails.planName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Lumbus eSIM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .plan-details {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .plan-details h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #1a1a1a;
    }
    .plan-details p {
      margin: 5px 0;
      color: #666;
    }
    .qr-code {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .qr-code img {
      max-width: 300px;
      width: 100%;
      height: auto;
    }
    .activation-code {
      background: #fff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .instructions {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your eSIM is Ready!</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>Your Lumbus eSIM has been activated and is ready to use. Here are your plan details:</p>

      <div class="plan-details">
        <h2>${orderDetails.planName}</h2>
        <p><strong>Data:</strong> ${orderDetails.dataGb} GB</p>
        <p><strong>Valid for:</strong> ${orderDetails.validityDays} days</p>
      </div>

      <div class="instructions">
        <strong>How to install:</strong>
        <ol>
          <li>Go to your device settings</li>
          <li>Navigate to Cellular/Mobile Data → Add eSIM</li>
          <li>Scan the QR code below or enter the details manually</li>
        </ol>
      </div>

      <div class="qr-code">
        <h3>Scan this QR Code</h3>
        <img src="${activationDetails.qrUrl}" alt="eSIM QR Code" />
      </div>

      <p style="text-align: center;">
        <a href="${installUrl}" class="btn">Open Installation Guide</a>
      </p>

      <h3>Or enter manually:</h3>
      <p><strong>SM-DP+ Address:</strong></p>
      <div class="activation-code">${activationDetails.smdp}</div>

      <p><strong>Activation Code:</strong></p>
      <div class="activation-code">${activationDetails.activationCode}</div>

      <p><strong>LPA String:</strong></p>
      <div class="activation-code">${activationDetails.lpaString}</div>

      <p style="margin-top: 30px;">Need help? Visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">lumbus.com/support</a></p>
    </div>
    <div class="footer">
      <p>Powered by eSIM Access network</p>
      <p>&copy; ${new Date().getFullYear()} Lumbus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send data usage alert email (50%, 80%, 90% thresholds)
 */
export async function sendDataUsageAlert(params: SendDataUsageAlertParams) {
  const { to, planName, usagePercent, dataUsedGB, dataRemainingGB, totalDataGB } = params;

  // Determine urgency level
  const isUrgent = usagePercent >= 90;
  const isWarning = usagePercent >= 80;
  const alertColor = isUrgent ? '#dc2626' : isWarning ? '#f59e0b' : '#3b82f6';
  const alertLevel = isUrgent ? 'Urgent' : isWarning ? 'Warning' : 'Notice';

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: `${alertLevel}: ${usagePercent.toFixed(0)}% of your data used - ${planName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Usage Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: ${alertColor};
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .usage-bar {
      background: #e5e7eb;
      border-radius: 12px;
      height: 40px;
      overflow: hidden;
      margin: 20px 0;
      position: relative;
    }
    .usage-fill {
      background: ${alertColor};
      height: 100%;
      width: ${usagePercent.toFixed(1)}%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      transition: width 0.5s ease;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .stat-box {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: ${alertColor};
      margin: 10px 0;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid ${alertColor};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Data Usage Alert</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>This is a ${alertLevel.toLowerCase()} about your data usage for <strong>${planName}</strong>.</p>

      <div class="usage-bar">
        <div class="usage-fill">
          ${usagePercent.toFixed(0)}%
        </div>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">Data Used</div>
          <div class="stat-value">${dataUsedGB.toFixed(2)} GB</div>
          <div class="stat-label">of ${totalDataGB.toFixed(2)} GB</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Remaining</div>
          <div class="stat-value">${dataRemainingGB.toFixed(2)} GB</div>
          <div class="stat-label">${(100 - usagePercent).toFixed(0)}% left</div>
        </div>
      </div>

      ${isUrgent ? `
      <div class="alert-box">
        <strong>⚠️ Critical: Running Low on Data</strong>
        <p>You've used <strong>${usagePercent.toFixed(0)}%</strong> of your data. Consider purchasing a top-up to avoid service interruption.</p>
      </div>
      ` : isWarning ? `
      <div class="alert-box">
        <strong>⚠️ Warning: High Data Usage</strong>
        <p>You've used <strong>${usagePercent.toFixed(0)}%</strong> of your data. You may want to monitor your usage or purchase a top-up soon.</p>
      </div>
      ` : `
      <div class="alert-box">
        <strong>ℹ️ Notice: Data Usage Update</strong>
        <p>You've used <strong>${usagePercent.toFixed(0)}%</strong> of your data. You still have plenty of data remaining.</p>
      </div>
      `}

      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Dashboard</a>
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>Tips to manage your data:</strong><br>
        • Use Wi-Fi when available<br>
        • Disable automatic app updates over cellular<br>
        • Monitor streaming quality settings<br>
        • Check background app refresh settings
      </p>

      <p style="margin-top: 20px;">Need help? Visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">lumbus.com/support</a></p>
    </div>
    <div class="footer">
      <p>This is an automated alert from Lumbus eSIM</p>
      <p>&copy; ${new Date().getFullYear()} Lumbus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send data usage alert:', error);
    throw error;
  }
}

/**
 * Send plan expiry alert email (1 day before expiry)
 */
export async function sendPlanExpiryAlert(params: SendPlanExpiryAlertParams) {
  const { to, planName, daysRemaining, expiryDate } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: `Your eSIM plan expires soon - ${planName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan Expiring Soon</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .expiry-box {
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 20px 0;
    }
    .expiry-date {
      font-size: 36px;
      font-weight: 700;
      color: #dc2626;
      margin: 10px 0;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Plan Expiring Soon</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>Your <strong>${planName}</strong> plan is expiring soon.</p>

      <div class="expiry-box">
        <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Expires In</div>
        <div class="expiry-date">${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}</div>
        <div style="font-size: 16px; color: #666; margin-top: 10px;">Expiry Date: ${expiryDate}</div>
      </div>

      <div class="alert-box">
        <strong>⚠️ Action Required</strong>
        <p>After the expiry date, your eSIM will no longer have data connectivity. Purchase a new plan or top-up to continue using your eSIM.</p>
      </div>

      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" class="btn">Browse Plans</a>
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>What happens when my plan expires?</strong><br>
        • Data connectivity will stop<br>
        • You can still top-up your eSIM with a new plan<br>
        • Your eSIM profile will remain on your device<br>
        • No action needed if you're done traveling
      </p>

      <p style="margin-top: 20px;">Need help? Visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">lumbus.com/support</a></p>
    </div>
    <div class="footer">
      <p>This is an automated alert from Lumbus eSIM</p>
      <p>&copy; ${new Date().getFullYear()} Lumbus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send plan expiry alert:', error);
    throw error;
  }
}

/**
 * Send referral reward earned notification
 */
export async function sendReferralRewardEmail(params: SendReferralRewardParams) {
  const { to, referredUserEmail, rewardAmount, referralCode } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: `You earned a reward! 🎉 - ${rewardAmount}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Reward Earned</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .reward-box {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 20px 0;
    }
    .reward-amount {
      font-size: 48px;
      font-weight: 700;
      color: #059669;
      margin: 10px 0;
    }
    .info-box {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Referral Reward!</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>Great news! Someone used your referral code and made their first purchase. You've earned a reward!</p>

      <div class="reward-box">
        <div style="font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 1px;">You Earned</div>
        <div class="reward-amount">${rewardAmount}</div>
        <div style="font-size: 16px; color: #059669; margin-top: 10px;">🎊 Added to your wallet!</div>
      </div>

      <div class="info-box">
        <p style="margin: 5px 0;"><strong>Referred user:</strong> ${referredUserEmail}</p>
        <p style="margin: 5px 0;"><strong>Your referral code:</strong> ${referralCode}</p>
      </div>

      <p>Your reward has been added to your Lumbus wallet and can be used on your next purchase!</p>

      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Wallet</a>
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>Keep sharing and earning!</strong><br>
        Share your referral code <strong>${referralCode}</strong> with friends and family. You'll earn rewards for every purchase they make, and they'll get a discount too!
      </p>

      <p style="margin-top: 20px;">Questions? Visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">lumbus.com/support</a></p>
    </div>
    <div class="footer">
      <p>Thank you for spreading the word about Lumbus eSIM!</p>
      <p>&copy; ${new Date().getFullYear()} Lumbus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send referral reward email:', error);
    throw error;
  }
}

/**
 * Send top-up confirmation email
 */
export async function sendTopUpConfirmationEmail(params: SendTopUpConfirmationParams) {
  const { to, planName, dataAdded, validityDays, iccid } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: `Your eSIM top-up is complete! - ${dataAdded}GB added`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Top-Up Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .success-box {
      background: linear-gradient(135deg, #dcfce7 0%, #dbeafe 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 20px 0;
    }
    .data-amount {
      font-size: 48px;
      font-weight: 700;
      color: #059669;
      margin: 10px 0;
    }
    .plan-details {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .plan-details p {
      margin: 5px 0;
      color: #666;
    }
    .info-box {
      background: #fef3c7;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      background: #f9fafb;
    }
    .iccid-box {
      background: #fff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      word-break: break-all;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Top-Up Successful!</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>Great news! Your eSIM has been successfully topped up with additional data.</p>

      <div class="success-box">
        <div style="font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 1px;">Data Added</div>
        <div class="data-amount">${dataAdded} GB</div>
        <div style="font-size: 16px; color: #059669; margin-top: 10px;">📶 Ready to use!</div>
      </div>

      <div class="plan-details">
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Data Added:</strong> ${dataAdded} GB</p>
        <p><strong>Validity:</strong> ${validityDays} days from today</p>
        <p><strong>ICCID:</strong></p>
        <div class="iccid-box">${iccid}</div>
      </div>

      <div class="info-box">
        <strong>✨ No action needed!</strong>
        <p>The data has been automatically added to your existing eSIM. Just continue using your device as normal - no reinstallation required!</p>
      </div>

      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Dashboard</a>
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>How it works:</strong><br>
        • Data is added to your existing eSIM instantly<br>
        • Validity period resets from the top-up date<br>
        • No need to scan a new QR code or reinstall<br>
        • Your eSIM continues working seamlessly
      </p>

      <p style="margin-top: 20px;">Need more data? Visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">your dashboard</a> to top up again!</p>
    </div>
    <div class="footer">
      <p>Thank you for choosing Lumbus eSIM!</p>
      <p>&copy; ${new Date().getFullYear()} Lumbus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send top-up confirmation email:', error);
    throw error;
  }
}

/**
 * Send affiliate application confirmation to applicant
 */
export async function sendAffiliateApplicationEmail(params: SendAffiliateApplicationParams) {
  const { applicantEmail, displayName, website } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [applicantEmail],
      subject: 'Application Received - Lumbus Affiliate Program',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Received - Lumbus</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px !important; }
            .mobile-center { text-align: center !important; }
            .container { width: 100% !important; max-width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px; background: linear-gradient(135deg, #2EFECC 0%, #87EFFF 100%);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #1A1A1A; letter-spacing: -0.5px; text-transform: uppercase;">Lumbus</h1>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #1A1A1A; font-weight: 600;">Affiliate Program</p>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding" style="padding: 40px 60px;">
                            <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1d1d1f; text-align: center;">Application Received!</h2>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                Hi ${displayName}! 👋
                            </p>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                Thank you for applying to the Lumbus Affiliate Program! We've received your application and will review it within 1-2 business days.
                            </p>

                            <div style="margin: 0 0 30px; padding: 20px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">Application Details</p>
                                <p style="margin: 5px 0; font-size: 14px; color: #515154;">
                                    <strong>Name/Brand:</strong> ${displayName}
                                </p>
                                ${website ? `<p style="margin: 5px 0; font-size: 14px; color: #515154;">
                                    <strong>Website:</strong> ${website}
                                </p>` : ''}
                                <p style="margin: 5px 0; font-size: 14px; color: #515154;">
                                    <strong>Email:</strong> ${applicantEmail}
                                </p>
                            </div>

                            <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #e5e5e7;">
                                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1d1d1f; text-align: center;">
                                    What Happens Next?
                                </h3>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 0 15px;">
                                            <table border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #2EFECC; font-size: 18px; font-weight: 900;">1</span>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <p style="margin: 0; font-size: 15px; color: #515154;">We'll review your application within 1-2 business days</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0 0 15px;">
                                            <table border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #2EFECC; font-size: 18px; font-weight: 900;">2</span>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <p style="margin: 0; font-size: 15px; color: #515154;">You'll receive an email with our decision</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #2EFECC; font-size: 18px; font-weight: 900;">3</span>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <p style="margin: 0; font-size: 15px; color: #515154;">If approved, you'll get access to your affiliate dashboard</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px; background-color: #F0FFFB; border-top: 3px solid #2EFECC;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #515154;">
                                            Questions? Contact us at <a href="mailto:partners@lumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">partners@lumbus.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #666666;">
                                            © ${new Date().getFullYear()} Lumbus. All rights reserved.
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
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send affiliate application email:', error);
    throw error;
  }
}

/**
 * Send affiliate approved notification
 */
export async function sendAffiliateApprovedEmail(params: SendAffiliateApprovedParams) {
  const { to, displayName, slug, commissionRate } = params;
  const affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/a/${slug}`;
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/affiliate`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: '🎉 Welcome to Lumbus Affiliate Program - Application Approved!',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Approved - Lumbus</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px !important; }
            .mobile-center { text-align: center !important; }
            .container { width: 100% !important; max-width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px; background: linear-gradient(135deg, #2EFECC 0%, #87EFFF 100%);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #1A1A1A; letter-spacing: -0.5px; text-transform: uppercase;">Lumbus</h1>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #1A1A1A; font-weight: 600;">Affiliate Program</p>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding" style="padding: 40px 60px;">
                            <h2 style="margin: 0 0 20px; font-size: 32px; font-weight: 600; color: #1d1d1f; text-align: center;">🎉 You're Approved!</h2>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                Congratulations ${displayName}! We're excited to welcome you to the Lumbus Affiliate Program.
                            </p>

                            <div style="margin: 0 0 30px; padding: 25px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
                                <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-align: center;">Your Affiliate Details</h3>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #515154;">
                                            <strong>Commission Rate:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">
                                            ${commissionRate}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #515154;">
                                            <strong>Cookie Duration:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">
                                            90 Days
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #515154;">
                                            <strong>Your Slug:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">
                                            ${slug}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="margin: 0 0 30px; padding: 20px; background-color: #FFF; border-radius: 12px; border: 2px solid #e5e5e7;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #86868b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                                    Your Affiliate Link
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #1A1A1A; font-weight: 600; word-break: break-all;">
                                    ${affiliateLink}
                                </p>
                            </div>

                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${dashboardLink}" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05);">
                                            Go to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #e5e5e7;">
                                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1d1d1f; text-align: center;">
                                    Get Started
                                </h3>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 0 0 15px;">
                                            <table border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #2EFECC; font-size: 18px; font-weight: 900;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <p style="margin: 0; font-size: 15px; color: #515154;">Copy your affiliate link and share it on your platforms</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0 0 15px;">
                                            <table border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #2EFECC; font-size: 18px; font-weight: 900;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <p style="margin: 0; font-size: 15px; color: #515154;">Track your performance in real-time from your dashboard</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #2EFECC; font-size: 18px; font-weight: 900;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <p style="margin: 0; font-size: 15px; color: #515154;">Earn ${commissionRate}% commission on every sale</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px; background-color: #F0FFFB; border-top: 3px solid #2EFECC;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #515154;">
                                            Questions? Contact us at <a href="mailto:partners@lumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">partners@lumbus.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #666666;">
                                            © ${new Date().getFullYear()} Lumbus. All rights reserved.
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
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send affiliate approved email:', error);
    throw error;
  }
}

/**
 * Send affiliate rejected notification
 */
export async function sendAffiliateRejectedEmail(params: SendAffiliateRejectedParams) {
  const { to, displayName, reason } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [to],
      subject: 'Update on Your Affiliate Application - Lumbus',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update - Lumbus</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px !important; }
            .mobile-center { text-align: center !important; }
            .container { width: 100% !important; max-width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" border="0" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px; background: linear-gradient(135deg, #2EFECC 0%, #87EFFF 100%);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #1A1A1A; letter-spacing: -0.5px; text-transform: uppercase;">Lumbus</h1>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #1A1A1A; font-weight: 600;">Affiliate Program</p>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding" style="padding: 40px 60px;">
                            <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1d1d1f; text-align: center;">Application Update</h2>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                Hi ${displayName},
                            </p>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                Thank you for your interest in the Lumbus Affiliate Program. After careful review, we're unable to approve your application at this time.
                            </p>

                            ${reason ? `<div style="margin: 0 0 30px; padding: 20px; background-color: #FEF3C7; border-radius: 12px; border: 2px solid #F59E0B;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">Reason</p>
                                <p style="margin: 0; font-size: 14px; color: #515154; line-height: 1.6;">
                                    ${reason}
                                </p>
                            </div>` : ''}

                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                We appreciate your interest and encourage you to reapply in the future as your audience grows.
                            </p>

                            <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #e5e5e7;">
                                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #515154; text-align: center;">
                                    You can still enjoy Lumbus eSIMs for your own travels! Check out our plans at <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" style="color: #2EFECC; font-weight: 700; text-decoration: none;">lumbus.com/plans</a>
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px; background-color: #F0FFFB; border-top: 3px solid #2EFECC;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #515154;">
                                            Questions? Contact us at <a href="mailto:partners@lumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">partners@lumbus.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #666666;">
                                            © ${new Date().getFullYear()} Lumbus. All rights reserved.
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
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send affiliate rejected email:', error);
    throw error;
  }
}

/**
 * Send admin notification about new affiliate application
 */
export async function sendAdminNewAffiliateApplicationEmail(params: SendAdminNewAffiliateApplicationParams) {
  const { adminEmail, applicant, applicationId } = params;
  const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/admin`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@lumbus.com',
      to: [adminEmail],
      subject: `🆕 New Affiliate Application - ${applicant.displayName}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Affiliate Application - Lumbus Admin</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px !important; }
            .container { width: 100% !important; max-width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; text-transform: uppercase;">Lumbus Admin</h1>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #FFFFFF; font-weight: 600;">New Affiliate Application</p>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding" style="padding: 40px 60px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1d1d1f;">New Application Received</h2>

                            <div style="margin: 0 0 25px; padding: 20px; background-color: #F3F4F6; border-radius: 12px;">
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                            <strong>Name/Brand:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right;">
                                            ${applicant.displayName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                            <strong>Email:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right;">
                                            ${applicant.email}
                                        </td>
                                    </tr>
                                    ${applicant.website ? `<tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                            <strong>Website:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; word-break: break-all;">
                                            <a href="${applicant.website}" style="color: #3B82F6; text-decoration: none;">${applicant.website}</a>
                                        </td>
                                    </tr>` : ''}
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                            <strong>Application ID:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-family: monospace;">
                                            ${applicationId.substring(0, 8)}...
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="margin: 0 0 20px;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: #1A1A1A; font-weight: 700;">Audience Description:</p>
                                <p style="margin: 0; font-size: 14px; color: #515154; line-height: 1.6; padding: 12px; background: #F9FAFB; border-radius: 8px;">
                                    ${applicant.audienceDescription}
                                </p>
                            </div>

                            <div style="margin: 0 0 20px;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: #1A1A1A; font-weight: 700;">Traffic Sources:</p>
                                <p style="margin: 0; font-size: 14px; color: #515154; line-height: 1.6; padding: 12px; background: #F9FAFB; border-radius: 8px;">
                                    ${applicant.trafficSources}
                                </p>
                            </div>

                            <div style="margin: 0 0 30px;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: #1A1A1A; font-weight: 700;">Promotional Methods:</p>
                                <p style="margin: 0; font-size: 14px; color: #515154; line-height: 1.6; padding: 12px; background: #F9FAFB; border-radius: 8px;">
                                    ${applicant.promotionalMethods}
                                </p>
                            </div>

                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 20px;">
                                        <a href="${reviewLink}" style="display: inline-block; padding: 16px 40px; background: #8B5CF6; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(139, 92, 246, 0.4);">
                                            Review in Admin Panel
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px; background-color: #F9FAFB; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #666666;">
                                © ${new Date().getFullYear()} Lumbus. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
    throw error;
  }
}
