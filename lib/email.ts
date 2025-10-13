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
      <p>Powered by 1GLOBAL's eSIM network</p>
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
