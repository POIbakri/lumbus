import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  const { to, orderDetails, activationDetails, installUrl } = params;

  try {
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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
