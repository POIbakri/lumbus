import { Resend } from 'resend';

// App Store Links
const APP_STORE_URL = 'https://apps.apple.com/app/id6754379325';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lumbus.app&pcampaignid=web_share';

/**
 * Reusable app store links section for emails
 */
function getAppStoreSection() {
  return `
    <div style="margin: 40px 0 0; padding: 30px 20px; background-color: #F5F5F5; border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.5px;">Download the Lumbus App</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #666666; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.5;">
        Get instant activation, track your data usage in real-time, and access exclusive app-only deals.
      </p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <!--[if mso]>
            <table align="center" border="0" cellspacing="0" cellpadding="0">
            <tr>
            <td align="center" valign="top" width="160">
            <![endif]-->
            <a href="${APP_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 8px;">
              <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" alt="Download on the App Store" style="height: 40px; width: auto; display: block;" border="0" />
            </a>
            <!--[if mso]>
            </td>
            <td align="center" valign="top" width="160">
            <![endif]-->
            <a href="${PLAY_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 8px;">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 54px; width: auto; display: block; margin-top: -7px;" border="0" />
            </a>
            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>
    </div>
  `;
}

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

// Shared email template wrapper with Lumbus branding
// Color Palette:
// Primary: #2EFECC (Turquoise/Mint)
// Secondary: #FDFD74 (Yellow)
// Accent: #87EFFF (Cyan)
// Background: #FFFFFF
// Muted: #F5F5F5
// Text: #1A1A1A
// Muted Text: #666666
// Border: #E5E5E5

function createEmailTemplate(params: {
  title: string;
  subtitle?: string;
  content: string;
}) {
  const { title, subtitle, content } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Lumbus</title>
    <style>
        /* Reset styles for better email client compatibility */
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
            h3 { font-size: 16px !important; }
            p { font-size: 14px !important; }
            .mobile-button { display: block !important; width: 100% !important; text-align: center !important; }
            .code-box { font-size: 11px !important; padding: 12px 8px !important; word-break: break-all !important; }
            .qr-image { max-width: 220px !important; }
            .big-number { font-size: 32px !important; }
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
                            ${subtitle ? `<p style="margin: 12px 0 0; font-size: 14px; color: #666666; font-weight: 500;">${subtitle}</p>` : ''}
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
                                        <p style="margin: 0 0 8px; font-size: 13px; color: #666666;">
                                            Questions? <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 600; text-decoration: none;">support@getlumbus.com</a>
                                        </p>
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
  `;
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
    iccid?: string;
    activateBeforeDate?: string;
    apn?: string;
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

export interface SendAccountDeletionParams {
  to: string;
  userEmail: string;
}

export interface SendDataDeletionRequestParams {
  userEmail: string;
  specificData?: string;
  reason?: string;
}

export interface SendAdminAccountDeletionNotificationParams {
  userEmail: string;
  userId: string;
  scheduledDate: string;
}

export interface SendAdminDataDeletionNotificationParams {
  userEmail: string;
  specificData?: string;
  reason?: string;
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  const { to, orderDetails, activationDetails, installUrl } = params;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #E0FEF7; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#2EFECC"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Your eSIM is Ready!</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Your Lumbus eSIM has been activated and is ready to use!
    </p>

    <div style="margin: 0 0 30px; padding: 25px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
      <h3 style="margin: 0 0 15px; font-size: 20px; font-weight: 700; color: #1A1A1A;">${orderDetails.planName}</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #666666;">
            <strong>Data:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A; text-align: right; font-weight: 700;">
            ${orderDetails.dataGb} GB
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #666666;">
            <strong>Valid for:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A; text-align: right; font-weight: 700;">
            ${orderDetails.validityDays} days
          </td>
        </tr>
      </table>
    </div>

    <div style="margin: 0 0 30px; padding: 20px; background-color: #FDFD74; border-radius: 12px; border: 3px solid #1A1A1A;">
      <p style="margin: 0 0 10px; font-size: 15px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">HOW TO INSTALL</p>
      <ol style="margin: 0; padding-left: 20px; color: #1A1A1A; font-weight: 600; line-height: 1.8;">
        <li>Go to your device settings</li>
        <li>Navigate to Cellular/Mobile Data → Add eSIM</li>
        <li>Scan the QR code below or enter details manually</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Scan this QR Code</h3>
      <img src="${activationDetails.qrUrl}" alt="eSIM QR Code" class="qr-image" style="max-width: 300px; width: 100%; height: auto;" />
    </div>

    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="${installUrl}" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            OPEN INSTALLATION GUIDE
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Or enter manually:</h3>

      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-weight: 700; text-transform: uppercase;">SM-DP+ Address</p>
        <div class="code-box" style="background: #F5F5F5; border: 2px solid #E5E5E5; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 13px; overflow-wrap: break-word; word-wrap: break-word; color: #1A1A1A;">
          ${activationDetails.smdp}
        </div>
      </div>

      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-weight: 700; text-transform: uppercase;">Activation Code</p>
        <div class="code-box" style="background: #F5F5F5; border: 2px solid #E5E5E5; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 13px; overflow-wrap: break-word; word-wrap: break-word; color: #1A1A1A;">
          ${activationDetails.activationCode}
        </div>
      </div>

      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-weight: 700; text-transform: uppercase;">LPA String</p>
        <div class="code-box" style="background: #F5F5F5; border: 2px solid #E5E5E5; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; overflow-wrap: break-word; word-wrap: break-word; color: #1A1A1A;">
          ${activationDetails.lpaString}
        </div>
      </div>
    </div>

    ${activationDetails.iccid || activationDetails.activateBeforeDate || activationDetails.apn ? `
    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Technical Details:</h3>

      ${activationDetails.iccid ? `
      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-weight: 700; text-transform: uppercase;">ICCID</p>
        <div class="code-box" style="background: #F5F5F5; border: 2px solid #E5E5E5; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 13px; overflow-wrap: break-word; word-wrap: break-word; color: #1A1A1A;">
          ${activationDetails.iccid}
        </div>
      </div>
      ` : ''}

      ${activationDetails.activateBeforeDate ? `
      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-weight: 700; text-transform: uppercase;">Activate Before</p>
        <div style="background: #FDFD74; border: 2px solid #1A1A1A; border-radius: 8px; padding: 15px; font-size: 14px; color: #1A1A1A; font-weight: 600;">
          ${activationDetails.activateBeforeDate}
        </div>
        <p style="margin: 8px 0 0; font-size: 12px; color: #666666;">
          Please activate your eSIM before this date to ensure it works properly
        </p>
      </div>
      ` : ''}

      ${activationDetails.apn ? `
      <div style="margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-weight: 700; text-transform: uppercase;">APN (Access Point Name)</p>
        <div class="code-box" style="background: #F5F5F5; border: 2px solid #E5E5E5; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 13px; overflow-wrap: break-word; word-wrap: break-word; color: #1A1A1A;">
          ${activationDetails.apn}
        </div>
        <p style="margin: 8px 0 0; font-size: 12px; color: #666666;">
          Usually configured automatically. Manual setup is rarely needed.
        </p>
      </div>
      ` : ''}
    </div>
    ` : ''}

    ${getAppStoreSection()}
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      bcc: ['getlumbus.com+d39cc9736f@invite.trustpilot.com'], // Trustpilot review automation
      subject: `Your Lumbus eSIM is ready! - ${orderDetails.planName}`,
      html: createEmailTemplate({
        title: 'Your eSIM is Ready',
        subtitle: 'Fast Global Connectivity',
        content,
      }),
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
  const alertLevel = isUrgent ? 'Urgent' : isWarning ? 'Warning' : 'Notice';

  // SVG icons for different alert levels
  const alertIcon = isUrgent
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#EF4444"/></svg>`
    : isWarning
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#F59E0B"/></svg>`
    : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#2EFECC"/></svg>`;

  const iconBgColor = isUrgent ? '#FEF2F2' : isWarning ? '#FEF3C7' : '#E0FEF7';

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: ${iconBgColor}; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        ${alertIcon}
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Data Usage ${alertLevel}</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      This is a ${alertLevel.toLowerCase()} about your data usage for <strong>${planName}</strong>.
    </p>

    <table border="0" cellspacing="0" cellpadding="0" width="100%" class="progress-bar" style="margin: 0 0 30px; background: #E0FEF7; border-radius: 12px; height: 50px; overflow: hidden;">
      <tr>
        <td width="${usagePercent.toFixed(1)}%" style="background: linear-gradient(135deg, #2EFECC 0%, #87EFFF 100%); height: 50px; text-align: center; vertical-align: middle;">
          <span class="progress-bar-text" style="color: #1A1A1A; font-weight: 900; font-size: 18px; display: inline-block; white-space: nowrap;">
            ${usagePercent.toFixed(0)}%
          </span>
        </td>
        <td style="background: #E0FEF7; height: 50px;"></td>
      </tr>
    </table>

    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 0 0 30px;">
      <tr>
        <td class="stat-card mobile-stack" width="48%" style="padding: 20px; background: #E0FEF7; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 5px; font-size: 12px; color: #666666; text-transform: uppercase; font-weight: 700;">Data Used</p>
          <p class="stat-value" style="margin: 0 0 5px; font-size: 32px; font-weight: 900; color: #1A1A1A;">${dataUsedGB.toFixed(2)} GB</p>
          <p style="margin: 0; font-size: 14px; color: #666666;">of ${totalDataGB.toFixed(2)} GB</p>
        </td>
        <td class="mobile-hide" width="4%"></td>
        <td class="stat-card mobile-stack" width="48%" style="padding: 20px; background: #E0FEF7; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 5px; font-size: 12px; color: #666666; text-transform: uppercase; font-weight: 700;">Remaining</p>
          <p class="stat-value" style="margin: 0 0 5px; font-size: 32px; font-weight: 900; color: #1A1A1A;">${dataRemainingGB.toFixed(2)} GB</p>
          <p style="margin: 0; font-size: 14px; color: #666666;">${(100 - usagePercent).toFixed(0)}% left</p>
        </td>
      </tr>
    </table>

    ${isUrgent ? `
      <div style="margin: 0 0 30px; padding: 20px; background-color: #FEF2F2; border-radius: 12px; border: 3px solid #EF4444;">
        <p style="margin: 0 0 10px; font-size: 15px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">CRITICAL: RUNNING LOW ON DATA</p>
        <p style="margin: 0; font-size: 14px; color: #1A1A1A; font-weight: 600; line-height: 1.6;">
          You've used <strong>${usagePercent.toFixed(0)}%</strong> of your data. Consider purchasing a top-up to avoid service interruption.
        </p>
      </div>
    ` : isWarning ? `
      <div style="margin: 0 0 30px; padding: 20px; background-color: #FEF3C7; border-radius: 12px; border: 2px solid #F59E0B;">
        <p style="margin: 0 0 10px; font-size: 15px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">WARNING: HIGH DATA USAGE</p>
        <p style="margin: 0; font-size: 14px; color: #666666; font-weight: 600; line-height: 1.6;">
          You've used <strong>${usagePercent.toFixed(0)}%</strong> of your data. You may want to monitor your usage or purchase a top-up soon.
        </p>
      </div>
    ` : `
      <div style="margin: 0 0 30px; padding: 20px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
        <p style="margin: 0 0 10px; font-size: 15px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">NOTICE: DATA USAGE UPDATE</p>
        <p style="margin: 0; font-size: 14px; color: #666666; font-weight: 600; line-height: 1.6;">
          You've used <strong>${usagePercent.toFixed(0)}%</strong> of your data. You still have plenty of data remaining.
        </p>
      </div>
    `}

    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            VIEW DASHBOARD
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <p style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #1A1A1A;">Tips to manage your data:</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Use Wi-Fi when available</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Disable automatic app updates over cellular</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Monitor streaming quality settings</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Check background app refresh settings</p></td></tr>
      </table>
    </div>

    ${getAppStoreSection()}
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `${alertLevel}: ${usagePercent.toFixed(0)}% of your data used - ${planName}`,
      html: createEmailTemplate({
        title: 'Data Usage Alert',
        subtitle: 'Usage Notification',
        content,
      }),
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

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #FEF3C7; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="#F59E0B"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Plan Expiring Soon</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Your <strong>${planName}</strong> plan is expiring soon.
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: #FEF3C7; border: 3px solid #F59E0B; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Expires In</p>
      <p class="big-number" style="margin: 0 0 10px; font-size: 48px; font-weight: 900; color: #1A1A1A;">${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}</p>
      <p style="margin: 0; font-size: 16px; color: #666666; font-weight: 600;">Expiry Date: ${expiryDate}</p>
    </div>

    <div style="margin: 0 0 30px; padding: 20px; background-color: #FEF3C7; border-radius: 12px; border: 2px solid #F59E0B;">
      <p style="margin: 0 0 10px; font-size: 15px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">ACTION REQUIRED</p>
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; font-weight: 600; line-height: 1.6;">
        After the expiry date, your eSIM will no longer have data connectivity. Purchase a new plan or top-up to continue using your eSIM.
      </p>
    </div>

    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            BROWSE PLANS
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <p style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #1A1A1A;">What happens when my plan expires?</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Data connectivity will stop</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> You can still top-up your eSIM with a new plan</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Your eSIM profile will remain on your device</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> No action needed if you're done traveling</p></td></tr>
      </table>
    </div>

    ${getAppStoreSection()}
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `Your eSIM plan expires soon - ${planName}`,
      html: createEmailTemplate({
        title: 'Plan Expiring Soon',
        subtitle: 'Expiry Alert',
        content,
      }),
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

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #E0FEF7; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="#2EFECC"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Referral Reward!</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Great news! Someone used your referral code and made their first purchase. You've earned a reward!
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: linear-gradient(135deg, #E0FEF7 0%, #E0FEF7 100%); border: 3px solid #2EFECC; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">You Earned</p>
      <p class="big-number" style="margin: 0 0 10px; font-size: 48px; font-weight: 900; color: #1A1A1A;">${rewardAmount}</p>
      <p style="margin: 0; font-size: 16px; color: #666666; font-weight: 600;">Added to your wallet!</p>
    </div>

    <div style="margin: 0 0 30px; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>Referred user:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            ${referredUserEmail}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>Your referral code:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700; font-family: monospace;">
            ${referralCode}
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Your reward has been added to your Lumbus wallet and can be used on your next purchase!
    </p>

    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            VIEW WALLET
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <p style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #1A1A1A; text-align: center;">Keep sharing and earning!</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
        Share your referral code <strong>${referralCode}</strong> with friends and family. You'll earn rewards for every purchase they make, and they'll get a discount too!
      </p>
    </div>

    ${getAppStoreSection()}
  `;

  try {
    const { data, error} = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `You earned a reward! - ${rewardAmount}`,
      html: createEmailTemplate({
        title: 'Referral Reward Earned',
        subtitle: 'Congratulations!',
        content,
      }),
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

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #E0FEF7; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#2EFECC"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Top-Up Successful!</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Great news! Your eSIM has been successfully topped up with additional data.
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: #E0FEF7; border: 3px solid #2EFECC; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Data Added</p>
      <p class="big-number" style="margin: 0 0 10px; font-size: 48px; font-weight: 900; color: #1A1A1A;">${dataAdded} GB</p>
      <p style="margin: 0; font-size: 16px; color: #666666; font-weight: 600;">Ready to use!</p>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Top-Up Details</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #666666;">
            <strong>Plan:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A; text-align: right; font-weight: 700;">
            ${planName}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #666666;">
            <strong>Data Added:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A; text-align: right; font-weight: 700;">
            ${dataAdded} GB
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #666666;">
            <strong>Validity:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A; text-align: right; font-weight: 700;">
            ${validityDays} days from today
          </td>
        </tr>
      </table>
    </div>

    <div style="margin: 0 0 30px; padding: 20px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
      <p style="margin: 0 0 10px; font-size: 15px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">NO ACTION NEEDED</p>
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; font-weight: 600; line-height: 1.6;">
        The data has been automatically added to your existing eSIM. Just continue using your device as normal - no reinstallation required!
      </p>
    </div>

    <div class="code-box" style="margin: 0 0 20px; padding: 15px; background-color: #F5F5F5; border: 2px solid #E5E5E5; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #666666; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">ICCID</p>
      <p style="margin: 0; font-size: 12px; color: #1A1A1A; font-family: monospace; overflow-wrap: break-word; word-wrap: break-word;">
        ${iccid}
      </p>
    </div>

    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            VIEW DASHBOARD
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <p style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #1A1A1A;">How it works:</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Data is added to your existing eSIM instantly</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Validity period resets from the top-up date</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> No need to scan a new QR code or reinstall</p></td></tr>
        <tr><td style="padding: 5px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900;">•</span> Your eSIM continues working seamlessly</p></td></tr>
      </table>
    </div>

    <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Need more data? Visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #2EFECC; font-weight: 700; text-decoration: none;">dashboard</a> to top up again!
    </p>

    ${getAppStoreSection()}
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `Your eSIM top-up is complete! - ${dataAdded}GB added`,
      html: createEmailTemplate({
        title: 'Top-Up Successful',
        subtitle: 'Data Added',
        content,
      }),
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
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
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

        /* Reset styles for better email client compatibility */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }

        /* Force Outlook to provide "view in browser" button */
        #outlook a { padding: 0; }

        /* Prevent Webkit and Windows Mobile from changing default font sizes */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        /* Make sure the container is always responsive */
        .container {
            width: 100% !important;
            max-width: 600px !important;
            margin: 0 auto !important;
        }

        /* Ensure wrapper takes full width */
        .wrapper {
            width: 100% !important;
            table-layout: fixed !important;
            -webkit-text-size-adjust: 100% !important;
            -ms-text-size-adjust: 100% !important;
        }

        /* Desktop and larger screens (default) */
        @media screen and (min-width: 601px) {
            .container { width: 600px !important; }
        }

        /* Tablet and medium screens */
        @media screen and (max-width: 768px) {
            .mobile-padding { padding: 30px 20px !important; }
            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 10px !important;
            }
            .inner-padding { padding: 30px 25px !important; }
            h1 { font-size: 28px !important; }
            h2 { font-size: 24px !important; }
            h3 { font-size: 20px !important; }
        }

        /* Mobile phones */
        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px 15px !important; }
            .mobile-center { text-align: center !important; }
            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
            }
            .inner-padding { padding: 20px 15px !important; }
            h1 { font-size: 24px !important; line-height: 1.2 !important; }
            h2 { font-size: 20px !important; line-height: 1.3 !important; }
            h3 { font-size: 18px !important; line-height: 1.3 !important; }
            p { font-size: 14px !important; line-height: 1.5 !important; }
            .mobile-button {
                display: block !important;
                width: 100% !important;
                padding: 16px 20px !important;
                font-size: 14px !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
            .mobile-stack {
                display: block !important;
                width: 100% !important;
                padding: 0 !important;
            }
            .mobile-hide { display: none !important; }
            .mobile-text { font-size: 14px !important; line-height: 1.5 !important; }
            .mobile-large-text { font-size: 32px !important; }
            .mobile-code-box {
                font-size: 11px !important;
                padding: 12px 8px !important;
                word-break: break-all !important;
            }
            .code-box {
                font-size: 11px !important;
                padding: 12px 8px !important;
                word-break: break-all !important;
            }
            .qr-image {
                max-width: 250px !important;
                width: 100% !important;
                height: auto !important;
            }
            .progress-bar { height: 40px !important; }
            .progress-bar-text { font-size: 14px !important; }
            .stat-card {
                display: block !important;
                width: 100% !important;
                margin-bottom: 15px !important;
                box-sizing: border-box !important;
            }
            .stat-value { font-size: 26px !important; }
            .big-number { font-size: 32px !important; }
            /* Fix for table cells */
            td[class="mobile-stack"] {
                display: block !important;
                width: 100% !important;
            }
        }

        /* Small phones */
        @media screen and (max-width: 480px) {
            .mobile-padding { padding: 15px 10px !important; }
            .inner-padding { padding: 15px 10px !important; }
            h1 { font-size: 22px !important; }
            h2 { font-size: 19px !important; }
            h3 { font-size: 17px !important; }
            p { font-size: 13px !important; }
            .mobile-button {
                padding: 14px 16px !important;
                font-size: 13px !important;
            }
            .stat-value { font-size: 24px !important; }
            .big-number { font-size: 28px !important; }
        }

        /* Very small phones */
        @media screen and (max-width: 360px) {
            .mobile-padding { padding: 12px 8px !important; }
            .inner-padding { padding: 12px 8px !important; }
            h1 { font-size: 20px !important; }
            h2 { font-size: 18px !important; }
            h3 { font-size: 16px !important; }
            p { font-size: 12px !important; }
            .mobile-button {
                padding: 12px 14px !important;
                font-size: 12px !important;
            }
            .code-box {
                font-size: 10px !important;
                padding: 10px 6px !important;
            }
            .qr-image { max-width: 200px !important; }
            .big-number { font-size: 26px !important; }
            .stat-value { font-size: 22px !important; }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            /* Optional: Add dark mode styles if needed */
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!--[if mso]>
    <center>
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
    <tr>
    <td align="center" valign="top" width="600">
    <![endif]-->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px; background-color: #FFFFFF; border-bottom: 3px solid #2EFECC;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="160" style="display: block; width: 160px; height: auto; max-width: 100%;" />
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding inner-padding" style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; color: #1A1A1A; text-align: center;">Application Received!</h2>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                Hi ${displayName}!
                            </p>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                Thank you for applying to the Lumbus Affiliate Program! We've received your application and will review it within 1-2 business days.
                            </p>

                            <div style="margin: 0 0 30px; padding: 20px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">Application Details</p>
                                <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                                    <strong>Name/Brand:</strong> ${displayName}
                                </p>
                                ${website ? `<p style="margin: 5px 0; font-size: 14px; color: #666666;">
                                    <strong>Website:</strong> ${website}
                                </p>` : ''}
                                <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                                    <strong>Email:</strong> ${applicantEmail}
                                </p>
                            </div>

                            <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
                                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1A1A1A; text-align: center;">
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
                                                        <p style="margin: 0; font-size: 15px; color: #666666;">We'll review your application within 1-2 business days</p>
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
                                                        <p style="margin: 0; font-size: 15px; color: #666666;">You'll receive an email with our decision</p>
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
                                                        <p style="margin: 0; font-size: 15px; color: #666666;">If approved, you'll get access to your affiliate dashboard</p>
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
                        <td style="padding: 30px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                                            Questions? <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 600; text-decoration: none;">support@getlumbus.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #999999;">
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
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: 'Welcome to Lumbus Affiliate Program - Application Approved!',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Approved - Lumbus</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* Reset styles for better email client compatibility */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }

        /* Force Outlook to provide "view in browser" button */
        #outlook a { padding: 0; }

        /* Prevent Webkit and Windows Mobile from changing default font sizes */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        /* Make sure the container is always responsive */
        .container {
            width: 100% !important;
            max-width: 600px !important;
            margin: 0 auto !important;
        }

        /* Ensure wrapper takes full width */
        .wrapper {
            width: 100% !important;
            table-layout: fixed !important;
            -webkit-text-size-adjust: 100% !important;
            -ms-text-size-adjust: 100% !important;
        }

        /* Desktop and larger screens (default) */
        @media screen and (min-width: 601px) {
            .container { width: 600px !important; }
        }

        /* Tablet and medium screens */
        @media screen and (max-width: 768px) {
            .mobile-padding { padding: 30px 20px !important; }
            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 10px !important;
            }
            .inner-padding { padding: 30px 25px !important; }
            h1 { font-size: 28px !important; }
            h2 { font-size: 24px !important; }
            h3 { font-size: 20px !important; }
        }

        /* Mobile phones */
        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px 15px !important; }
            .mobile-center { text-align: center !important; }
            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
            }
            .inner-padding { padding: 20px 15px !important; }
            h1 { font-size: 24px !important; line-height: 1.2 !important; }
            h2 { font-size: 20px !important; line-height: 1.3 !important; }
            h3 { font-size: 18px !important; line-height: 1.3 !important; }
            p { font-size: 14px !important; line-height: 1.5 !important; }
            .mobile-button {
                display: block !important;
                width: 100% !important;
                padding: 16px 20px !important;
                font-size: 14px !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
            .mobile-stack {
                display: block !important;
                width: 100% !important;
                padding: 0 !important;
            }
            .mobile-hide { display: none !important; }
            .mobile-text { font-size: 14px !important; line-height: 1.5 !important; }
            .mobile-large-text { font-size: 32px !important; }
            .mobile-code-box {
                font-size: 11px !important;
                padding: 12px 8px !important;
                word-break: break-all !important;
            }
            .code-box {
                font-size: 11px !important;
                padding: 12px 8px !important;
                word-break: break-all !important;
            }
            .qr-image {
                max-width: 250px !important;
                width: 100% !important;
                height: auto !important;
            }
            .progress-bar { height: 40px !important; }
            .progress-bar-text { font-size: 14px !important; }
            .stat-card {
                display: block !important;
                width: 100% !important;
                margin-bottom: 15px !important;
                box-sizing: border-box !important;
            }
            .stat-value { font-size: 26px !important; }
            .big-number { font-size: 32px !important; }
            /* Fix for table cells */
            td[class="mobile-stack"] {
                display: block !important;
                width: 100% !important;
            }
        }

        /* Small phones */
        @media screen and (max-width: 480px) {
            .mobile-padding { padding: 15px 10px !important; }
            .inner-padding { padding: 15px 10px !important; }
            h1 { font-size: 22px !important; }
            h2 { font-size: 19px !important; }
            h3 { font-size: 17px !important; }
            p { font-size: 13px !important; }
            .mobile-button {
                padding: 14px 16px !important;
                font-size: 13px !important;
            }
            .stat-value { font-size: 24px !important; }
            .big-number { font-size: 28px !important; }
        }

        /* Very small phones */
        @media screen and (max-width: 360px) {
            .mobile-padding { padding: 12px 8px !important; }
            .inner-padding { padding: 12px 8px !important; }
            h1 { font-size: 20px !important; }
            h2 { font-size: 18px !important; }
            h3 { font-size: 16px !important; }
            p { font-size: 12px !important; }
            .mobile-button {
                padding: 12px 14px !important;
                font-size: 12px !important;
            }
            .code-box {
                font-size: 10px !important;
                padding: 10px 6px !important;
            }
            .qr-image { max-width: 200px !important; }
            .big-number { font-size: 26px !important; }
            .stat-value { font-size: 22px !important; }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            /* Optional: Add dark mode styles if needed */
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!--[if mso]>
    <center>
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
    <tr>
    <td align="center" valign="top" width="600">
    <![endif]-->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px; background-color: #FFFFFF; border-bottom: 3px solid #2EFECC;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="160" style="display: block; width: 160px; height: auto; max-width: 100%;" />
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding inner-padding" style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; color: #1A1A1A; text-align: center;">You're Approved!</h2>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                Congratulations ${displayName}! We're excited to welcome you to the Lumbus Affiliate Program.
                            </p>

                            <div style="margin: 0 0 30px; padding: 25px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
                                <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-align: center;">Your Affiliate Details</h3>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                                            <strong>Commission Rate:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">
                                            ${commissionRate}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                                            <strong>Cookie Duration:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">
                                            90 Days
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                                            <strong>Your Slug:</strong>
                                        </td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 700;">
                                            ${slug}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="margin: 0 0 30px; padding: 20px; background-color: #FFF; border-radius: 12px; border: 2px solid #E5E5E5;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                                    Your Affiliate Link
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #1A1A1A; font-weight: 600; word-break: break-all;">
                                    ${affiliateLink}
                                </p>
                            </div>

                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${dashboardLink}" class="mobile-button" style="display: inline-block; padding: 14px 32px; background-color: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px;">
                                            Go to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
                                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1A1A1A; text-align: center;">
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
                                                        <p style="margin: 0; font-size: 15px; color: #666666;">Copy your affiliate link and share it on your platforms</p>
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
                                                        <p style="margin: 0; font-size: 15px; color: #666666;">Track your performance in real-time from your dashboard</p>
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
                                                        <p style="margin: 0; font-size: 15px; color: #666666;">Earn ${commissionRate}% commission on every sale</p>
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
                        <td style="padding: 30px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                                            Questions? Contact us at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
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
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
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

        /* Reset styles for better email client compatibility */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }

        /* Force Outlook to provide "view in browser" button */
        #outlook a { padding: 0; }

        /* Prevent Webkit and Windows Mobile from changing default font sizes */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        /* Make sure the container is always responsive */
        .container {
            width: 100% !important;
            max-width: 600px !important;
            margin: 0 auto !important;
        }

        /* Ensure wrapper takes full width */
        .wrapper {
            width: 100% !important;
            table-layout: fixed !important;
            -webkit-text-size-adjust: 100% !important;
            -ms-text-size-adjust: 100% !important;
        }

        /* Desktop and larger screens (default) */
        @media screen and (min-width: 601px) {
            .container { width: 600px !important; }
        }

        /* Tablet and medium screens */
        @media screen and (max-width: 768px) {
            .mobile-padding { padding: 30px 20px !important; }
            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 10px !important;
            }
            .inner-padding { padding: 30px 25px !important; }
            h1 { font-size: 28px !important; }
            h2 { font-size: 24px !important; }
            h3 { font-size: 20px !important; }
        }

        /* Mobile phones */
        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 20px 15px !important; }
            .mobile-center { text-align: center !important; }
            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
            }
            .inner-padding { padding: 20px 15px !important; }
            h1 { font-size: 24px !important; line-height: 1.2 !important; }
            h2 { font-size: 20px !important; line-height: 1.3 !important; }
            h3 { font-size: 18px !important; line-height: 1.3 !important; }
            p { font-size: 14px !important; line-height: 1.5 !important; }
            .mobile-button {
                display: block !important;
                width: 100% !important;
                padding: 16px 20px !important;
                font-size: 14px !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
            .mobile-stack {
                display: block !important;
                width: 100% !important;
                padding: 0 !important;
            }
            .mobile-hide { display: none !important; }
            .mobile-text { font-size: 14px !important; line-height: 1.5 !important; }
            .mobile-large-text { font-size: 32px !important; }
            .mobile-code-box {
                font-size: 11px !important;
                padding: 12px 8px !important;
                word-break: break-all !important;
            }
            .code-box {
                font-size: 11px !important;
                padding: 12px 8px !important;
                word-break: break-all !important;
            }
            .qr-image {
                max-width: 250px !important;
                width: 100% !important;
                height: auto !important;
            }
            .progress-bar { height: 40px !important; }
            .progress-bar-text { font-size: 14px !important; }
            .stat-card {
                display: block !important;
                width: 100% !important;
                margin-bottom: 15px !important;
                box-sizing: border-box !important;
            }
            .stat-value { font-size: 26px !important; }
            .big-number { font-size: 32px !important; }
            /* Fix for table cells */
            td[class="mobile-stack"] {
                display: block !important;
                width: 100% !important;
            }
        }

        /* Small phones */
        @media screen and (max-width: 480px) {
            .mobile-padding { padding: 15px 10px !important; }
            .inner-padding { padding: 15px 10px !important; }
            h1 { font-size: 22px !important; }
            h2 { font-size: 19px !important; }
            h3 { font-size: 17px !important; }
            p { font-size: 13px !important; }
            .mobile-button {
                padding: 14px 16px !important;
                font-size: 13px !important;
            }
            .stat-value { font-size: 24px !important; }
            .big-number { font-size: 28px !important; }
        }

        /* Very small phones */
        @media screen and (max-width: 360px) {
            .mobile-padding { padding: 12px 8px !important; }
            .inner-padding { padding: 12px 8px !important; }
            h1 { font-size: 20px !important; }
            h2 { font-size: 18px !important; }
            h3 { font-size: 16px !important; }
            p { font-size: 12px !important; }
            .mobile-button {
                padding: 12px 14px !important;
                font-size: 12px !important;
            }
            .code-box {
                font-size: 10px !important;
                padding: 10px 6px !important;
            }
            .qr-image { max-width: 200px !important; }
            .big-number { font-size: 26px !important; }
            .stat-value { font-size: 22px !important; }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            /* Optional: Add dark mode styles if needed */
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!--[if mso]>
    <center>
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
    <tr>
    <td align="center" valign="top" width="600">
    <![endif]-->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px; background-color: #FFFFFF; border-bottom: 3px solid #2EFECC;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="160" style="display: block; width: 160px; height: auto; max-width: 100%;" />
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding inner-padding" style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; color: #1A1A1A; text-align: center;">Application Update</h2>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                Hi ${displayName},
                            </p>

                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                Thank you for your interest in the Lumbus Affiliate Program. After careful review, we're unable to approve your application at this time.
                            </p>

                            ${reason ? `<div style="margin: 0 0 30px; padding: 20px; background-color: #FDFD74; border-radius: 12px; border: 2px solid #1A1A1A;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #1A1A1A; font-weight: 800; text-transform: uppercase;">Reason</p>
                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                                    ${reason}
                                </p>
                            </div>` : ''}

                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                We appreciate your interest and encourage you to reapply in the future as your audience grows.
                            </p>

                            <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
                                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                    You can still enjoy Lumbus eSIMs for your own travels! Check out our plans at <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" style="color: #2EFECC; font-weight: 700; text-decoration: none;">lumbus.com/plans</a>
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                                            Questions? Contact us at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
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
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [adminEmail],
      subject: `New Affiliate Application - ${applicant.displayName}`,
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
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!--[if mso]>
    <center>
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
    <tr>
    <td align="center" valign="top" width="600">
    <![endif]-->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px; background-color: #FFFFFF; border-bottom: 3px solid #2EFECC;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="160" style="display: block; width: 160px; height: auto; max-width: 100%;" />
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding inner-padding" style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; color: #1A1A1A;">New Application Received</h2>

                            <div style="margin: 0 0 25px; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
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
                                            <a href="${applicant.website}" style="color: #2EFECC; text-decoration: none;">${applicant.website}</a>
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
                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6; padding: 12px; background: #F5F5F5; border-radius: 8px;">
                                    ${applicant.audienceDescription}
                                </p>
                            </div>

                            <div style="margin: 0 0 20px;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: #1A1A1A; font-weight: 700;">Traffic Sources:</p>
                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6; padding: 12px; background: #F5F5F5; border-radius: 8px;">
                                    ${applicant.trafficSources}
                                </p>
                            </div>

                            <div style="margin: 0 0 30px;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: #1A1A1A; font-weight: 700;">Promotional Methods:</p>
                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6; padding: 12px; background: #F5F5F5; border-radius: 8px;">
                                    ${applicant.promotionalMethods}
                                </p>
                            </div>

                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 20px;">
                                        <a href="${reviewLink}" class="mobile-button" style="display: inline-block; padding: 14px 32px; background-color: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px;">
                                            Review in Admin Panel
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #666666;">
                                © ${new Date().getFullYear()} Lumbus. All rights reserved.
                            </p>
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

    return data;
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
    throw error;
  }
}

/**
 * Send account deletion confirmation email
 */
export async function sendAccountDeletionEmail(params: SendAccountDeletionParams) {
  const { to, userEmail } = params;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #FEF2F2; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#EF4444"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Account Deletion Request Received</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      We've received your request to delete your Lumbus account. This email confirms that your deletion request has been submitted.
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: #FEF2F2; border: 3px solid #EF4444; border-radius: 12px; text-align: center;">
      <div style="margin-bottom: 10px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#EF4444"/>
        </svg>
      </div>
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: 1px;">DELETION IN PROGRESS</p>
      <p style="margin: 0; font-size: 16px; color: #666666; font-weight: 600;">Your account will be deleted within 30 days</p>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background-color: #FFF7ED; border-radius: 12px; border: 2px solid #F59E0B;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">What Happens Next</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>1. Processing Period:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            Up to 30 days
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>2. Account Status:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            Scheduled for deletion
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>3. Data Removal:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            Permanent
          </td>
        </tr>
      </table>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">What Will Be Deleted</h3>
      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; line-height: 2; color: #666666;">
        <li><strong>Account Information:</strong> Email, profile, and settings</li>
        <li><strong>eSIM Orders:</strong> Purchase history and order details</li>
        <li><strong>Referral Data:</strong> Rewards, referral codes, and stats</li>
        <li><strong>Data Wallet:</strong> Unused data credits</li>
      </ul>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background: linear-gradient(135deg, #E0FEF7 0%, #E0FEF7 100%); border: 2px solid #2EFECC; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Active eSIMs</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
        <strong>Good news:</strong> Any active eSIMs will continue to work until their expiry date, even after your account is deleted. You won't lose access to your current connectivity.
      </p>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Changed Your Mind?</h3>
      <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
        If you didn't request this deletion or want to cancel it, please contact our support team immediately:
      </p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <a href="mailto:support@getlumbus.com" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
              CONTACT SUPPORT
            </a>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      <strong>Account Email:</strong> ${userEmail}
    </p>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      We're sorry to see you go. If there's anything we could have done better, we'd love to hear from you.
    </p>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #1A1A1A; text-align: center;">Questions or concerns?</p>
      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #666666; text-align: center;">
        Contact us at <a href="mailto:support@getlumbus.com" style="color: #2EFECC; text-decoration: none; font-weight: 700;">support@getlumbus.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: 'Account Deletion Request Received - Lumbus',
      html: createEmailTemplate({
        title: 'Account Deletion Request',
        subtitle: 'Confirmation',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send account deletion email:', error);
    throw error;
  }
}

/**
 * Send admin notification for account deletion request
 */
export async function sendAdminAccountDeletionNotification(params: SendAdminAccountDeletionNotificationParams) {
  const { userEmail, userId, scheduledDate } = params;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Account Deletion Request</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      A user has requested to delete their account.
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: #FEF2F2; border: 3px solid #EF4444; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">User Details</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>Email:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            ${userEmail}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>User ID:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600; font-family: monospace;">
            ${userId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>Scheduled Deletion:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            ${new Date(scheduledDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>Request Time:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            ${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background: #FFF7ED; border: 2px solid #F59E0B; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Action Required</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
        The account has been marked for deletion and will be permanently removed after 30 days unless the user contacts support to cancel.
      </p>
    </div>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      This is an automated notification from the Lumbus deletion system.
    </p>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: ['delete@getlumbus.com'],
      subject: `Account Deletion Request - ${userEmail}`,
      html: createEmailTemplate({
        title: 'Account Deletion Request',
        subtitle: 'Admin Notification',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send admin account deletion notification:', error);
    throw error;
  }
}

/**
 * Send admin notification for data deletion request
 */
export async function sendAdminDataDeletionNotification(params: SendAdminDataDeletionNotificationParams) {
  const { userEmail, specificData, reason } = params;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Data Deletion Request</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      A user has requested deletion of specific personal data (GDPR request).
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: #E0FEF7; border: 3px solid #2EFECC; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Request Details</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>User Email:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            ${userEmail}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>Request Time:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            ${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </td>
        </tr>
      </table>
    </div>

    ${specificData ? `
    <div style="margin: 0 0 30px; padding: 25px; background: #FFF7ED; border: 2px solid #F59E0B; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Specific Data Requested</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; white-space: pre-wrap;">
        ${specificData}
      </p>
    </div>
    ` : ''}

    ${reason ? `
    <div style="margin: 0 0 30px; padding: 25px; background: #F5F5F5; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Reason Provided</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; white-space: pre-wrap;">
        ${reason}
      </p>
    </div>
    ` : ''}

    <div style="margin: 0 0 30px; padding: 25px; background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Timeline</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
        <strong>GDPR Compliance:</strong> Must respond within 30 days. Process the deletion request and send confirmation to the user.
      </p>
    </div>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      This is an automated notification from the Lumbus deletion system.
    </p>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: ['delete@getlumbus.com'],
      subject: `Data Deletion Request - ${userEmail}`,
      html: createEmailTemplate({
        title: 'Data Deletion Request',
        subtitle: 'GDPR Request - Admin Notification',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send admin data deletion notification:', error);
    throw error;
  }
}

/**
 * Send user confirmation for data deletion request
 */
export async function sendDataDeletionRequestConfirmation(params: SendDataDeletionRequestParams) {
  const { userEmail, specificData, reason } = params;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #E0FEF7; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#2EFECC"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Data Deletion Request Received</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      We've received your request to delete specific personal data from your Lumbus account.
    </p>

    <div style="margin: 0 0 30px; padding: 30px; background: #E0FEF7; border: 3px solid #2EFECC; border-radius: 12px; text-align: center;">
      <div style="margin-bottom: 10px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#2EFECC"/>
        </svg>
      </div>
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: 1px;">REQUEST SUBMITTED</p>
      <p style="margin: 0; font-size: 16px; color: #666666; font-weight: 600;">We'll process your request within 30 days</p>
    </div>

    <div style="margin: 0 0 30px; padding: 25px; background-color: #FFF7ED; border-radius: 12px; border: 2px solid #F59E0B;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">What Happens Next</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>1. Confirmation:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            24-48 hours
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>2. Identity Verification:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            1-2 days
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>3. Data Deletion:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            Up to 30 days
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666;">
            <strong>4. Final Confirmation:</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #1A1A1A; text-align: right; font-weight: 600;">
            Email sent
          </td>
        </tr>
      </table>
    </div>

    ${specificData ? `
    <div style="margin: 0 0 30px; padding: 25px; background: #F5F5F5; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Your Request</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; white-space: pre-wrap;">
        ${specificData}
      </p>
    </div>
    ` : ''}

    <div style="margin: 0 0 30px; padding: 25px; background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">Questions?</h3>
      <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
        If you have any questions about this request or need to provide additional information:
      </p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <a href="mailto:support@getlumbus.com" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
              CONTACT SUPPORT
            </a>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      <strong>Your Email:</strong> ${userEmail}
    </p>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      Your privacy is important to us. We'll keep you informed throughout the process.
    </p>

    <div style="margin: 40px 0 0; padding: 30px 0; border-top: 1px solid #E5E5E5;">
      <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #1A1A1A; text-align: center;">Questions or concerns?</p>
      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #666666; text-align: center;">
        Contact us at <a href="mailto:support@getlumbus.com" style="color: #2EFECC; text-decoration: none; font-weight: 700;">support@getlumbus.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [userEmail],
      subject: 'Data Deletion Request Received - Lumbus',
      html: createEmailTemplate({
        title: 'Data Deletion Request',
        subtitle: 'Confirmation',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send data deletion request confirmation:', error);
    throw error;
  }
}

/**
 * Send welcome email to new users who sign up without purchasing
 */
export interface SendWelcomeEmailParams {
  to: string;
  userName?: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  const { to, userName } = params;

  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const plansUrl = 'https://getlumbus.com/plans';

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Welcome to Lumbus</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666;">
      ${greeting}
    </p>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666;">
      Thanks for creating your Lumbus account. You're now ready to stay connected wherever you travel with affordable eSIM data plans in 150+ countries.
    </p>

    <div style="margin: 0 0 30px; padding: 25px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
      <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #1A1A1A;">What you can do with Lumbus:</h3>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A;">
            <strong>Instant activation</strong> - Get connected in seconds
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A;">
            <strong>150+ countries</strong> - One app, global coverage
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A;">
            <strong>No contracts</strong> - Pay only for what you need
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 15px; color: #1A1A1A;">
            <strong>Easy top-ups</strong> - Add more data anytime
          </td>
        </tr>
      </table>
    </div>

    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="${plansUrl}" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            BROWSE PLANS
          </a>
        </td>
      </tr>
    </table>

    ${getAppStoreSection()}

    <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      Questions? We're here to help at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
    </p>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: 'Welcome to Lumbus - Stay Connected Anywhere',
      html: createEmailTemplate({
        title: 'Welcome to Lumbus',
        subtitle: 'Your journey starts here',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}
