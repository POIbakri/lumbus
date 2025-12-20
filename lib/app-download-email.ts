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
            .feature-icon { width: 40px !important; height: 40px !important; }
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

export interface SendAppDownloadEmailParams {
  to: string;
  planName: string;
}

/**
 * Send app download email to guest users who purchased without signing up
 */
export async function sendAppDownloadEmail(params: SendAppDownloadEmailParams) {
  const { to, planName } = params;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #E0FEF7; border-radius: 50%; padding: 16px; box-sizing: border-box;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-4.2-5.78v1.75l3.2-2.99L12.8 9v1.7c-3.11.43-4.35 2.56-4.8 4.7 1.11-1.5 2.58-2.18 4.8-2.18z" fill="#2EFECC"/>
        </svg>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1A1A1A; text-align: center;">Get More from Your eSIM</h2>

    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      Thanks for purchasing <strong>${planName}</strong>! We noticed you checked out as a guest. Download the Lumbus app to unlock the full experience and manage your eSIM with ease.
    </p>

    <!-- App Benefits Section -->
    <div style="margin: 0 0 30px; padding: 25px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
      <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #1A1A1A; text-align: center;">Why Download the App?</h3>

      <!-- Feature 1: Easy Management -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td width="48" style="vertical-align: top; padding-right: 12px;">
            <div class="feature-icon" style="width: 48px; height: 48px; background-color: #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <table border="0" cellspacing="0" cellpadding="0" width="48" height="48">
                <tr>
                  <td align="center" valign="middle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="#1A1A1A"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1A1A1A;">Easy eSIM Management</p>
            <p style="margin: 0; font-size: 14px; color: #666666;">View your eSIM details, track data usage, and manage everything in one place.</p>
          </td>
        </tr>
      </table>

      <!-- Feature 2: Instant Top-ups -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td width="48" style="vertical-align: top; padding-right: 12px;">
            <div class="feature-icon" style="width: 48px; height: 48px; background-color: #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <table border="0" cellspacing="0" cellpadding="0" width="48" height="48">
                <tr>
                  <td align="center" valign="middle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#1A1A1A"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1A1A1A;">Instant Top-ups</p>
            <p style="margin: 0; font-size: 14px; color: #666666;">Running low on data? Add more instantly without buying a new eSIM.</p>
          </td>
        </tr>
      </table>

      <!-- Feature 3: Smart Notifications -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td width="48" style="vertical-align: top; padding-right: 12px;">
            <div class="feature-icon" style="width: 48px; height: 48px; background-color: #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <table border="0" cellspacing="0" cellpadding="0" width="48" height="48">
                <tr>
                  <td align="center" valign="middle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#1A1A1A"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1A1A1A;">Smart Notifications</p>
            <p style="margin: 0; font-size: 14px; color: #666666;">Get alerts before your data runs out or your plan expires. Never be caught offline.</p>
          </td>
        </tr>
      </table>

      <!-- Feature 4: Exclusive Discounts -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td width="48" style="vertical-align: top; padding-right: 12px;">
            <div class="feature-icon" style="width: 48px; height: 48px; background-color: #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <table border="0" cellspacing="0" cellpadding="0" width="48" height="48">
                <tr>
                  <td align="center" valign="middle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" fill="#1A1A1A"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1A1A1A;">Exclusive App Discounts</p>
            <p style="margin: 0; font-size: 14px; color: #666666;">Access special deals and promotions only available to app users.</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Download CTA -->
    <div style="margin: 0 0 30px; padding: 30px 20px; background-color: #1A1A1A; border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">Download the Lumbus App</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #999999; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.5;">
        Your eSIM, your way. Available on iOS and Android.
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

    <!-- Referral Section -->
    <div style="margin: 0 0 30px; padding: 25px; background-color: #FDFD74; border-radius: 12px; border: 3px solid #1A1A1A;">
      <div style="text-align: center; margin-bottom: 15px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="#1A1A1A"/>
        </svg>
      </div>
      <h3 style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #1A1A1A; text-align: center;">Share & Earn Rewards</h3>
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; line-height: 1.6; text-align: center;">
        Create an account in the app to get your personal referral code. Share it with friends and family - you'll both earn rewards on their first purchase!
      </p>
    </div>

    <!-- Create Account CTA -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 0 30px;">
          <a href="https://getlumbus.com/download" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            DOWNLOAD NOW
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      Questions? We're here to help at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
    </p>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: 'Get More from Your Lumbus eSIM - Download the App',
      html: createEmailTemplate({
        title: 'Download the Lumbus App',
        subtitle: 'Unlock the full experience',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send app download email:', error);
    throw error;
  }
}
