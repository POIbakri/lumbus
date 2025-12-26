import { Resend } from 'resend';

// App Store Links
const APP_STORE_URL = 'https://apps.apple.com/app/id6754379325';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lumbus.app&pcampaignid=web_share';

// Lazy initialization
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

function createEmailTemplate(params: {
  title: string;
  subtitle?: string;
  content: string;
}) {
  const { title, subtitle, content } = params;

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${title} - Lumbus</title>
    <!--[if mso]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style>
        :root { color-scheme: light dark; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }

        @media (prefers-color-scheme: dark) {
            body, .body-bg { background-color: #1A1A1A !important; }
            .email-container { background-color: #2D2D2D !important; }
            .content-section { background-color: #2D2D2D !important; }
            .footer-section { background-color: #1A1A1A !important; border-top-color: #404040 !important; }
            .text-dark { color: #FFFFFF !important; }
            .text-muted { color: #B0B0B0 !important; }
            .card-mint { background-color: #1A3D35 !important; border-color: #2EFECC !important; }
            .card-yellow { background-color: #3D3D1A !important; border-color: #FDFD74 !important; }
            .card-muted { background-color: #333333 !important; }
            .card-white { background-color: #404040 !important; }
        }

        @media screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 0 !important; }
            .mobile-padding { padding: 20px 16px !important; }
            .inner-padding { padding: 24px 16px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 16px !important; }
            p { font-size: 14px !important; }
            .mobile-button { display: block !important; width: 100% !important; text-align: center !important; }
        }
    </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table class="body-bg" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 24px 16px;">
                <table class="container email-container" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" class="mobile-padding header-section email-container" style="padding: 32px 24px 24px; border-bottom: 3px solid #2EFECC; background-color: #FFFFFF;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="140" style="display: block; width: 140px; height: auto;" />
                            </a>
                            ${subtitle ? `<p class="text-muted" style="margin: 12px 0 0; font-size: 14px; color: #666666; font-weight: 500;">${subtitle}</p>` : ''}
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="mobile-padding inner-padding content-section email-container" style="padding: 32px 24px; background-color: #FFFFFF;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="footer-section" style="padding: 24px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p class="text-muted" style="margin: 0 0 8px; font-size: 13px; color: #666666;">
                                            Questions? <a class="link-dark" href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 600; text-decoration: none;">support@getlumbus.com</a>
                                        </p>
                                        <p class="text-light-muted" style="margin: 0; font-size: 12px; color: #999999;">
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
</body>
</html>
  `;
}

export interface SendInstallReminderParams {
  to: string;
  planName: string;
  regionName: string;
  dataGb: number;
  validityDays: number;
  qrUrl?: string;
  activationCode?: string;
  smdpAddress?: string;
}

/**
 * Send reminder to users who haven't installed their eSIM yet
 */
export async function sendInstallReminderEmail(params: SendInstallReminderParams) {
  const { to, planName, regionName, dataGb, validityDays, qrUrl, activationCode, smdpAddress } = params;

  const content = `
    <!-- Hero Section - CYAN THEME for Install Reminder -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #87EFFF 0%, #00D4FF 100%); border-radius: 50%; padding: 20px; box-sizing: border-box;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" fill="#1A1A1A"/>
          <path d="M12 17c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" fill="#1A1A1A"/>
        </svg>
      </div>
    </div>

    <h2 class="text-dark" style="margin: 0 0 16px; font-size: 28px; font-weight: 800; color: #1A1A1A; text-align: center; line-height: 1.2;">
      Don't Forget to Install Your eSIM!
    </h2>

    <p class="text-muted" style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Your <strong>${planName}</strong> eSIM is ready and waiting. Install it now so you're all set when you arrive in ${regionName}!
    </p>

    <!-- Plan Details Box - CYAN -->
    <div class="card-cyan" style="margin: 0 0 24px; padding: 20px; background-color: #E0F7FF; border-radius: 12px; border: 2px solid #87EFFF;">
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td width="50%" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase;">Data</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #1A1A1A;">${dataGb} GB</p>
          </td>
          <td width="50%" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase;">Validity</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #1A1A1A;">${validityDays} Days</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- iOS Instructions -->
    <div class="card-muted" style="margin: 0 0 16px; padding: 24px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #1A1A1A;">
        <span style="display: inline-block; width: 24px; height: 24px; background-color: #1A1A1A; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; vertical-align: middle;">
          <span style="color: #FFFFFF; font-size: 14px;"></span>
        </span>
        iPhone Installation
      </h3>

      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 24px; height: 24px; background-color: #87EFFF; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 800; color: #1A1A1A; font-size: 12px; display: inline-block;">1</div>
          </td>
          <td style="padding: 8px 0 8px 12px;">
            <p class="text-dark" style="margin: 0; font-size: 14px; color: #1A1A1A;">Go to <strong>Settings → Cellular → Add eSIM</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 24px; height: 24px; background-color: #87EFFF; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 800; color: #1A1A1A; font-size: 12px; display: inline-block;">2</div>
          </td>
          <td style="padding: 8px 0 8px 12px;">
            <p class="text-dark" style="margin: 0; font-size: 14px; color: #1A1A1A;">Tap <strong>"Use QR Code"</strong> then <strong>"Enter Details Manually"</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 24px; height: 24px; background-color: #87EFFF; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 800; color: #1A1A1A; font-size: 12px; display: inline-block;">3</div>
          </td>
          <td style="padding: 8px 0 8px 12px;">
            <p class="text-dark" style="margin: 0; font-size: 14px; color: #1A1A1A;">Paste your activation code and tap <strong>"Next"</strong></p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Android Instructions -->
    <div class="card-muted" style="margin: 0 0 24px; padding: 24px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #1A1A1A;">
        <span style="display: inline-block; width: 24px; height: 24px; background-color: #3DDC84; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; vertical-align: middle;">
          <span style="color: #FFFFFF; font-size: 14px;"></span>
        </span>
        Android Installation
      </h3>

      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 24px; height: 24px; background-color: #87EFFF; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 800; color: #1A1A1A; font-size: 12px; display: inline-block;">1</div>
          </td>
          <td style="padding: 8px 0 8px 12px;">
            <p class="text-dark" style="margin: 0; font-size: 14px; color: #1A1A1A;">Go to <strong>Settings → Network & Internet → SIMs → Add eSIM</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 24px; height: 24px; background-color: #87EFFF; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 800; color: #1A1A1A; font-size: 12px; display: inline-block;">2</div>
          </td>
          <td style="padding: 8px 0 8px 12px;">
            <p class="text-dark" style="margin: 0; font-size: 14px; color: #1A1A1A;">Select <strong>"Enter activation code"</strong> or scan QR</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 24px; height: 24px; background-color: #87EFFF; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 800; color: #1A1A1A; font-size: 12px; display: inline-block;">3</div>
          </td>
          <td style="padding: 8px 0 8px 12px;">
            <p class="text-dark" style="margin: 0; font-size: 14px; color: #1A1A1A;">Paste your code and tap <strong>"Download"</strong></p>
          </td>
        </tr>
      </table>
    </div>

    ${qrUrl ? `
    <!-- QR Code -->
    <div style="text-align: center; margin: 0 0 24px;">
      <p class="text-muted" style="margin: 0 0 12px; font-size: 14px; color: #666666;">Or scan this QR code:</p>
      <img src="${qrUrl}" alt="eSIM QR Code" width="200" style="display: inline-block; width: 200px; height: 200px; border-radius: 12px; border: 2px solid #E5E5E5;" />
    </div>
    ` : ''}

    <!-- CRITICAL: Data Roaming Section -->
    <div style="margin: 0 0 24px; padding: 20px; background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%); border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #FFFFFF; text-transform: uppercase; letter-spacing: 2px;">📱 AFTER INSTALLING</p>
      <p style="margin: 0; font-size: 20px; font-weight: 900; color: #FFFFFF;">Enable Your eSIM & Data Roaming</p>
      <p style="margin: 8px 0 0; font-size: 13px; color: #FFFFFF; opacity: 0.9;">Required for your eSIM to work abroad!</p>
    </div>

    <!-- iPhone Activation Settings -->
    <div class="card-muted" style="margin: 0 0 16px; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 12px; font-size: 16px; font-weight: 800; color: #1A1A1A;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: #1A1A1A; border-radius: 4px; text-align: center; line-height: 20px; margin-right: 8px; vertical-align: middle;"></span>
        iPhone: Enable After Installing
      </h3>
      <p class="text-muted" style="margin: 0 0 12px; font-size: 13px; color: #666666;">
        Go to <strong>Settings → Cellular</strong>, select your Lumbus eSIM:
      </p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">Turn On This Line</p></td>
                <td align="right"><span style="display: inline-block; padding: 3px 10px; background-color: #87EFFF; border-radius: 10px; font-size: 11px; font-weight: 700; color: #1A1A1A;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">Cellular Data → Lumbus eSIM</p></td>
                <td align="right"><span style="display: inline-block; padding: 3px 10px; background-color: #87EFFF; border-radius: 10px; font-size: 11px; font-weight: 700; color: #1A1A1A;">SELECT</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">Data Roaming</p></td>
                <td align="right"><span style="display: inline-block; padding: 3px 10px; background-color: #00B4D8; border-radius: 10px; font-size: 11px; font-weight: 700; color: #FFFFFF;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Android Activation Settings -->
    <div class="card-muted" style="margin: 0 0 24px; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 12px; font-size: 16px; font-weight: 800; color: #1A1A1A;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: #3DDC84; border-radius: 4px; text-align: center; line-height: 20px; margin-right: 8px; vertical-align: middle;"></span>
        Android: Enable After Installing
      </h3>
      <p class="text-muted" style="margin: 0 0 12px; font-size: 13px; color: #666666;">
        Go to <strong>Settings → Network & Internet → SIMs</strong>, select Lumbus eSIM:
      </p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">Use SIM</p></td>
                <td align="right"><span style="display: inline-block; padding: 3px 10px; background-color: #87EFFF; border-radius: 10px; font-size: 11px; font-weight: 700; color: #1A1A1A;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">Mobile Data → Lumbus eSIM</p></td>
                <td align="right"><span style="display: inline-block; padding: 3px 10px; background-color: #87EFFF; border-radius: 10px; font-size: 11px; font-weight: 700; color: #1A1A1A;">SELECT</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">Data Roaming</p></td>
                <td align="right"><span style="display: inline-block; padding: 3px 10px; background-color: #00B4D8; border-radius: 10px; font-size: 11px; font-weight: 700; color: #FFFFFF;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Install CTA - CYAN -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${APP_STORE_URL}" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #87EFFF 0%, #00D4FF 100%); color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(135, 239, 255, 0.4);">
            INSTALL IN APP
          </a>
        </td>
      </tr>
    </table>

    <!-- Warning Box -->
    <div class="card-yellow" style="margin: 0 0 16px; padding: 16px 20px; background-color: #FDFD74; border-radius: 12px; border: 2px solid #1A1A1A;">
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; line-height: 1.5;">
        <strong>⚠️ Important:</strong> Each eSIM can only be installed once. Don't delete it until you've finished your trip!
      </p>
    </div>

    <!-- Country Note -->
    <div style="margin: 0 0 24px; padding: 16px 20px; background-color: #E0F7FF; border-radius: 12px; border: 2px solid #87EFFF;">
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; line-height: 1.5;">
        <strong>📍 Note:</strong> Your eSIM will only connect to the network when you arrive in <strong>${regionName}</strong>. It won't use data while you're still at home.
      </p>
    </div>

    <!-- App Download Section -->
    <div style="margin: 0 0 24px; padding: 24px 20px; background-color: #1A1A1A; border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #FFFFFF;">Manage Your eSIM in the App</p>
      <p style="margin: 0 0 20px; font-size: 13px; color: #999999;">Track usage, get alerts & top up anytime</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <a href="${APP_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 6px;">
              <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" alt="Download on the App Store" style="height: 36px; width: auto; display: block;" border="0" />
            </a>
            <a href="${PLAY_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 6px;">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 48px; width: auto; display: block; margin-top: -6px;" border="0" />
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Help & Support Links -->
    <div style="margin: 0 0 24px; text-align: center;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1A1A1A;">Need Help?</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <a href="https://getlumbus.com/support" style="display: inline-block; padding: 10px 20px; margin: 4px; background-color: #F5F5F5; color: #1A1A1A; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 8px;">
              📚 Support Center
            </a>
            <a href="https://getlumbus.com/support#installation" style="display: inline-block; padding: 10px 20px; margin: 4px; background-color: #F5F5F5; color: #1A1A1A; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 8px;">
              🔧 Installation Guide
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0 0; font-size: 13px; color: #666666;">
        Or email us at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `Your ${regionName} eSIM is waiting - Install it now!`,
      html: createEmailTemplate({
        title: 'Install Your eSIM',
        subtitle: 'Get ready for your trip',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send install reminder email:', error);
    throw error;
  }
}

export interface SendActivationReminderParams {
  to: string;
  planName: string;
  regionName: string;
  dataGb: number;
  validityDays: number;
}

/**
 * Send reminder to users who have installed but haven't started using their eSIM
 * (installed but data_usage_bytes = 0 after a few days)
 */
export async function sendActivationReminderEmail(params: SendActivationReminderParams) {
  const { to, planName, regionName, dataGb, validityDays } = params;

  const content = `
    <!-- Hero Section - ORANGE/WARNING THEME for Activation Reminder -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #FFB347 0%, #FF8E53 100%); border-radius: 50%; padding: 20px; box-sizing: border-box;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1A1A1A"/>
        </svg>
      </div>
    </div>

    <h2 class="text-dark" style="margin: 0 0 16px; font-size: 28px; font-weight: 800; color: #1A1A1A; text-align: center; line-height: 1.2;">
      One More Step - Enable Data Roaming!
    </h2>

    <p class="text-muted" style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Great job installing your <strong>${planName}</strong> eSIM! To start using it when you arrive in ${regionName}, make sure these settings are enabled:
    </p>

    <!-- Critical Settings Alert -->
    <div style="margin: 0 0 24px; padding: 24px; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-transform: uppercase; letter-spacing: 2px;">⚠️ CRITICAL STEP</p>
      <p style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">Turn ON Data Roaming</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #FFFFFF; opacity: 0.9;">Without this, your eSIM won't work abroad!</p>
    </div>

    <!-- iPhone Settings -->
    <div class="card-muted" style="margin: 0 0 16px; padding: 24px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #1A1A1A;">
        <span style="display: inline-block; width: 24px; height: 24px; background-color: #1A1A1A; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; vertical-align: middle;">
          <span style="color: #FFFFFF; font-size: 14px;"></span>
        </span>
        iPhone Settings
      </h3>

      <p class="text-muted" style="margin: 0 0 16px; font-size: 14px; color: #666666;">
        Go to <strong>Settings → Cellular</strong> and select your Lumbus eSIM:
      </p>

      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p class="text-dark" style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">Turn On This Line</p></td>
                <td align="right"><span style="display: inline-block; padding: 4px 12px; background-color: #FFB347; border-radius: 12px; font-size: 12px; font-weight: 700; color: #1A1A1A;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p class="text-dark" style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">Data Roaming</p></td>
                <td align="right"><span style="display: inline-block; padding: 4px 12px; background-color: #FF8E53; border-radius: 12px; font-size: 12px; font-weight: 700; color: #FFFFFF;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p class="text-muted" style="margin: 12px 0 0; font-size: 12px; color: #666666; font-style: italic;">
        Note: Your eSIM may appear as "Travel" or "Secondary" in Settings.
      </p>
    </div>

    <!-- Android Settings -->
    <div class="card-muted" style="margin: 0 0 24px; padding: 24px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #1A1A1A;">
        <span style="display: inline-block; width: 24px; height: 24px; background-color: #3DDC84; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; vertical-align: middle;">
          <span style="color: #FFFFFF; font-size: 14px;"></span>
        </span>
        Android Settings
      </h3>

      <p class="text-muted" style="margin: 0 0 16px; font-size: 14px; color: #666666;">
        Go to <strong>Settings → Network & Internet → SIMs</strong> and select your Lumbus eSIM:
      </p>

      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p class="text-dark" style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">Use SIM</p></td>
                <td align="right"><span style="display: inline-block; padding: 4px 12px; background-color: #FFB347; border-radius: 12px; font-size: 12px; font-weight: 700; color: #1A1A1A;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E5E5;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p class="text-dark" style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">Mobile Data</p></td>
                <td align="right"><span style="display: inline-block; padding: 4px 12px; background-color: #FFB347; border-radius: 12px; font-size: 12px; font-weight: 700; color: #1A1A1A;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px;">
            <table border="0" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td><p class="text-dark" style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">Data Roaming</p></td>
                <td align="right"><span style="display: inline-block; padding: 4px 12px; background-color: #FF8E53; border-radius: 12px; font-size: 12px; font-weight: 700; color: #FFFFFF;">ON ✓</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p class="text-muted" style="margin: 12px 0 0; font-size: 12px; color: #666666; font-style: italic;">
        Note: Menu names may vary by device (Samsung, Pixel, etc.)
      </p>
    </div>

    <!-- Plan Reminder - ORANGE -->
    <div class="card-orange" style="margin: 0 0 24px; padding: 20px; background-color: #FFF3E6; border-radius: 12px; border: 2px solid #FFB347; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Your Plan</p>
      <p style="margin: 0; font-size: 24px; font-weight: 900; color: #1A1A1A;">${dataGb} GB for ${validityDays} Days</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #666666;">Activates automatically when you connect abroad</p>
    </div>

    <!-- Country Note - ORANGE themed -->
    <div style="margin: 0 0 24px; padding: 16px 20px; background-color: #FFF3E6; border-radius: 12px; border: 2px solid #FFB347;">
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; line-height: 1.5;">
        <strong>📍 Note:</strong> Your eSIM will only connect to the network when you arrive in <strong>${regionName}</strong>. It won't use data while you're still at home.
      </p>
    </div>

    <!-- App CTA -->
    <div style="margin: 0 0 24px; padding: 24px 20px; background-color: #1A1A1A; border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #FFFFFF;">Track Your Data in the App</p>
      <p style="margin: 0 0 20px; font-size: 13px; color: #999999;">Monitor usage, get alerts, and top up anytime</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <a href="${APP_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 6px;">
              <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" alt="Download on the App Store" style="height: 36px; width: auto; display: block;" border="0" />
            </a>
            <a href="${PLAY_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 6px;">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 48px; width: auto; display: block; margin-top: -6px;" border="0" />
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Help & Support Links -->
    <div style="margin: 0 0 24px; text-align: center;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1A1A1A;">Need Help?</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <a href="https://getlumbus.com/support" style="display: inline-block; padding: 10px 20px; margin: 4px; background-color: #F5F5F5; color: #1A1A1A; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 8px;">
              📚 Support Center
            </a>
            <a href="https://getlumbus.com/support#activation" style="display: inline-block; padding: 10px 20px; margin: 4px; background-color: #F5F5F5; color: #1A1A1A; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 8px;">
              🔧 Activation Guide
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0 0; font-size: 13px; color: #666666;">
        Or email us at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `Almost there! Enable Data Roaming for your ${regionName} eSIM`,
      html: createEmailTemplate({
        title: 'Activate Your eSIM',
        subtitle: 'One more step to get connected',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send activation reminder email:', error);
    throw error;
  }
}
