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
        #outlook a { padding: 0; }
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
            body, .body-bg { background-color: #1A1A1A !important; }
            .email-container { background-color: #2D2D2D !important; }
            .header-section { border-bottom-color: #2EFECC !important; }
            .content-section { background-color: #2D2D2D !important; }
            .footer-section { background-color: #1A1A1A !important; border-top-color: #404040 !important; }

            /* Text colors */
            .text-dark { color: #FFFFFF !important; }
            .text-muted { color: #B0B0B0 !important; }
            .text-light-muted { color: #888888 !important; }

            /* Component backgrounds */
            .card-mint { background-color: #1A3D35 !important; border-color: #2EFECC !important; }
            .card-yellow { background-color: #3D3D1A !important; border-color: #FDFD74 !important; }
            .card-cyan { background-color: #1A3D3D !important; }
            .card-muted { background-color: #333333 !important; }
            .card-white { background-color: #404040 !important; }

            /* Icon backgrounds */
            .icon-bg { background-color: #404040 !important; }
            .icon-circle-mint { background-color: #1A3D35 !important; }

            /* Preserve brand colors */
            .brand-mint { color: #2EFECC !important; }
            .brand-yellow { background-color: #FDFD74 !important; }

            /* Links */
            a.link-dark { color: #2EFECC !important; }
        }

        /* Apple Mail dark mode */
        [data-ogsc] .body-bg { background-color: #1A1A1A !important; }
        [data-ogsc] .email-container { background-color: #2D2D2D !important; }
        [data-ogsc] .text-dark { color: #FFFFFF !important; }
        [data-ogsc] .text-muted { color: #B0B0B0 !important; }

        @media screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 0 !important; }
            .mobile-padding { padding: 20px 16px !important; }
            .inner-padding { padding: 24px 16px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 16px !important; }
            p { font-size: 14px !important; }
            .mobile-button { display: block !important; width: 100% !important; text-align: center !important; }
            .feature-icon { width: 40px !important; height: 40px !important; }
            .reward-box { padding: 20px 16px !important; }
        }
    </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!--[if mso]>
    <center>
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
    <tr>
    <td align="center" valign="top" width="600">
    <![endif]-->
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

export interface SendReferralPromoEmailParams {
  to: string;
  firstName?: string;
  referralCode: string;
  referralLink: string;
}

/**
 * Send referral program promotion email to existing users
 */
export async function sendReferralPromoEmail(params: SendReferralPromoEmailParams) {
  const { to, firstName, referralCode, referralLink } = params;

  const greeting = firstName ? `Hey ${firstName}` : 'Hey there';

  const content = `
    <!-- Hero Section with Gift Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div class="icon-circle-mint" style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #2EFECC 0%, #87EFFF 100%); border-radius: 50%; padding: 20px; box-sizing: border-box;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="#1A1A1A"/>
        </svg>
      </div>
    </div>

    <h2 class="text-dark" style="margin: 0 0 16px; font-size: 28px; font-weight: 800; color: #1A1A1A; text-align: center; line-height: 1.2;">
      ${greeting}, Want Free Data?
    </h2>

    <p class="text-muted" style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      You've got a secret weapon for unlimited travel data, and it's already in your account. Your personal referral code is ready to work for you!
    </p>

    <!-- Main Reward Highlight - With mint border for dark mode visibility -->
    <div class="reward-box" style="margin: 0 0 24px; padding: 30px 24px; background: linear-gradient(135deg, #1A1A1A 0%, #333333 100%); border-radius: 16px; text-align: center; border: 3px solid #2EFECC;">
      <p class="brand-mint" style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #2EFECC; text-transform: uppercase; letter-spacing: 2px;">Every Time Someone Uses Your Code</p>
      <p style="margin: 0 0 4px; font-size: 48px; font-weight: 900; color: #FFFFFF; line-height: 1;">1 GB</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">FREE data for you</p>
    </div>

    <!-- Your Code Box - Yellow stays vibrant -->
    <div class="brand-yellow" style="margin: 0 0 24px; padding: 20px; background-color: #FDFD74; border-radius: 12px; border: 3px solid #1A1A1A; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: 1px;">Your Referral Code</p>
      <p style="margin: 0; font-size: 32px; font-weight: 900; color: #1A1A1A; letter-spacing: 4px; font-family: monospace;">${referralCode}</p>
    </div>

    <!-- What They Get Section -->
    <div class="card-mint" style="margin: 0 0 24px; padding: 24px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
      <h3 class="text-dark" style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #1A1A1A; text-align: center;">What Your Friends & Family Get</h3>

      <!-- Benefit 1 -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td width="40" style="vertical-align: middle; padding-right: 12px;">
            <div class="card-white" style="width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 50%; text-align: center; line-height: 40px;">
              <span style="font-size: 20px;">🎁</span>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p class="text-dark" style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A;"><span class="brand-mint" style="color: #2EFECC;">1 GB FREE</span> bonus data</p>
          </td>
        </tr>
      </table>

      <!-- Benefit 2 -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td width="40" style="vertical-align: middle; padding-right: 12px;">
            <div class="card-white" style="width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 50%; text-align: center; line-height: 40px;">
              <span style="font-size: 20px;">💰</span>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p class="text-dark" style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A;"><span class="brand-mint" style="color: #2EFECC;">10% OFF</span> their first purchase</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- How It Works -->
    <div class="card-muted" style="margin: 0 0 24px; padding: 24px; background-color: #F5F5F5; border-radius: 12px;">
      <h3 class="text-dark" style="margin: 0 0 20px; font-size: 18px; font-weight: 800; color: #1A1A1A; text-align: center;">How It Works</h3>

      <!-- Step 1 -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td width="36" style="vertical-align: top; padding-right: 12px;">
            <div style="width: 32px; height: 32px; background-color: #2EFECC; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 900; color: #1A1A1A; font-size: 16px;">1</div>
          </td>
          <td style="vertical-align: middle;">
            <p class="text-dark" style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1A1A1A;">Share your code or link</p>
            <p class="text-muted" style="margin: 0; font-size: 13px; color: #666666;">Send it to friends, family, coworkers - anyone who travels!</p>
          </td>
        </tr>
      </table>

      <!-- Step 2 -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td width="36" style="vertical-align: top; padding-right: 12px;">
            <div style="width: 32px; height: 32px; background-color: #2EFECC; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 900; color: #1A1A1A; font-size: 16px;">2</div>
          </td>
          <td style="vertical-align: middle;">
            <p class="text-dark" style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1A1A1A;">They buy their first eSIM</p>
            <p class="text-muted" style="margin: 0; font-size: 13px; color: #666666;">They enter your code at checkout and save 10% instantly</p>
          </td>
        </tr>
      </table>

      <!-- Step 3 -->
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td width="36" style="vertical-align: top; padding-right: 12px;">
            <div style="width: 32px; height: 32px; background-color: #2EFECC; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 900; color: #1A1A1A; font-size: 16px;">3</div>
          </td>
          <td style="vertical-align: middle;">
            <p class="text-dark" style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1A1A1A;">You both get 1 GB FREE!</p>
            <p class="text-muted" style="margin: 0; font-size: 13px; color: #666666;">Bonus data is added automatically. No limits on referrals!</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Share CTA - Brand color stays vibrant -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${referralLink}" class="mobile-button" style="display: inline-block; padding: 18px 48px; background: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 16px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px -5px rgba(46, 254, 204, 0.4);">
            SHARE YOUR LINK NOW
          </a>
        </td>
      </tr>
    </table>

    <!-- Quick Share Ideas -->
    <div class="card-cyan" style="margin: 0 0 24px; padding: 20px; background-color: #87EFFF; border-radius: 12px; text-align: center;">
      <p class="text-dark" style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1A1A1A;">Quick Share Ideas:</p>
      <p class="text-dark" style="margin: 0; font-size: 13px; color: #1A1A1A; line-height: 1.8;">
        📱 Text your travel buddy<br>
        👨‍👩‍👧‍👦 Share in family group chat<br>
        ✈️ Post before a group trip<br>
        💼 Tell coworkers who travel for work
      </p>
    </div>

    <!-- Pro Tip - Yellow stays vibrant -->
    <div class="brand-yellow" style="margin: 0 0 30px; padding: 16px 20px; background-color: #FDFD74; border-radius: 8px; border-left: 4px solid #1A1A1A;">
      <p style="margin: 0; font-size: 14px; color: #1A1A1A; line-height: 1.5;">
        <strong>Pro tip:</strong> The more friends you refer, the more free data you stack up. Some users have earned 10+ GB just from referrals! 🚀
      </p>
    </div>

    <!-- App Download Section - Dark section stays dark -->
    <div style="margin: 0 0 30px; padding: 24px 20px; background-color: #1A1A1A; border-radius: 16px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #FFFFFF;">Track Your Referrals in the App</p>
      <p style="margin: 0 0 20px; font-size: 13px; color: #999999;">See your rewards, share your code, and manage your eSIMs</p>
      <table border="0" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td align="center">
            <!--[if mso]>
            <table align="center" border="0" cellspacing="0" cellpadding="0">
            <tr>
            <td align="center" valign="top" width="140">
            <![endif]-->
            <a href="${APP_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 6px;">
              <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" alt="Download on the App Store" style="height: 36px; width: auto; display: block;" border="0" />
            </a>
            <!--[if mso]>
            </td>
            <td align="center" valign="top" width="140">
            <![endif]-->
            <a href="${PLAY_STORE_URL}" style="display: inline-block; text-decoration: none; margin: 6px;">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 48px; width: auto; display: block; margin-top: -6px;" border="0" />
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

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      Questions? We're here at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
    </p>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: 'You Have FREE Data Waiting - Share Your Code!',
      html: createEmailTemplate({
        title: 'Share & Earn Free Data',
        subtitle: 'Your referral code is ready',
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send referral promo email:', error);
    throw error;
  }
}

/**
 * Send referral promo emails to multiple users (batch)
 */
export async function sendReferralPromoEmailBatch(
  users: Array<{ email: string; firstName?: string; referralCode: string; referralLink: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const user of users) {
    try {
      await sendReferralPromoEmail({
        to: user.email,
        firstName: user.firstName,
        referralCode: user.referralCode,
        referralLink: user.referralLink,
      });
      results.success++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}

export interface SendIssueResolvedEmailParams {
  to: string;
  firstName?: string;
  // Issue details
  issueDescription?: string;
  // Compensation details
  bonusDataGb?: number; // For bonus data (free gift)
  dataFixed?: string; // For data that was fixed/applied (e.g., "5 GB") - their purchase
  refundAmount?: number;
  refundCurrency?: 'USD' | 'GBP' | 'EUR'; // Default USD
  refundDays?: string; // e.g., "5-10"
  // Discount code
  discountCode?: string;
  discountPercent?: number;
  // Referral info
  referralCode: string;
  referralLink?: string; // Optional - not currently used in template
  // Trustpilot
  trustpilotUrl?: string;
}

/**
 * Send issue resolved / thank you for patience email
 * Reusable template for support follow-ups
 */
export async function sendIssueResolvedEmail(params: SendIssueResolvedEmailParams) {
  const {
    to,
    firstName,
    issueDescription = 'the issue you reported',
    bonusDataGb,
    dataFixed,
    refundAmount,
    refundCurrency = 'USD',
    refundDays = '5-10',
    discountCode,
    discountPercent,
    referralCode,
    referralLink,
    trustpilotUrl = 'https://www.trustpilot.com/review/getlumbus.com',
  } = params;

  // Currency symbols
  const currencySymbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  const currencySymbol = currencySymbols[refundCurrency] || '$';

  const greeting = firstName ? `Hey ${firstName}` : 'Hey there';

  // Build dynamic sections based on what's provided
  let compensationSection = '';

  if (bonusDataGb || dataFixed || refundAmount) {
    let compensationItems = '';

    // Data fixed (their purchase was applied correctly)
    if (dataFixed) {
      compensationItems += `
        <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 12px;">
          <tr>
            <td width="40" style="vertical-align: middle; padding-right: 12px;">
              <div class="card-white" style="width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 50%; text-align: center; line-height: 40px;">
                <span style="font-size: 20px;">✅</span>
              </div>
            </td>
            <td style="vertical-align: middle;">
              <p class="text-dark" style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A;"><span class="brand-mint" style="color: #2EFECC;">${dataFixed}</span> data has been applied to your account</p>
            </td>
          </tr>
        </table>
      `;
    }

    // Bonus data (free gift)
    if (bonusDataGb) {
      compensationItems += `
        <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 12px;">
          <tr>
            <td width="40" style="vertical-align: middle; padding-right: 12px;">
              <div class="card-white" style="width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 50%; text-align: center; line-height: 40px;">
                <span style="font-size: 20px;">🎁</span>
              </div>
            </td>
            <td style="vertical-align: middle;">
              <p class="text-dark" style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A;"><span class="brand-mint" style="color: #2EFECC;">${bonusDataGb} GB</span> bonus data added to your account</p>
            </td>
          </tr>
        </table>
      `;
    }

    if (refundAmount) {
      compensationItems += `
        <table border="0" cellspacing="0" cellpadding="0" width="100%">
          <tr>
            <td width="40" style="vertical-align: middle; padding-right: 12px;">
              <div class="card-white" style="width: 40px; height: 40px; background-color: #FFFFFF; border-radius: 50%; text-align: center; line-height: 40px;">
                <span style="font-size: 20px;">💳</span>
              </div>
            </td>
            <td style="vertical-align: middle;">
              <p class="text-dark" style="margin: 0; font-size: 16px; font-weight: 700; color: #1A1A1A;"><span class="brand-mint" style="color: #2EFECC;">${currencySymbol}${refundAmount.toFixed(2)} refund</span> issued - will arrive in ${refundDays} days depending on your bank</p>
            </td>
          </tr>
        </table>
      `;
    }

    compensationSection = `
      <div class="card-mint" style="margin: 0 0 24px; padding: 24px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
        <h3 class="text-dark" style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: #1A1A1A; text-align: center;">What We've Done For You</h3>
        ${compensationItems}
      </div>
    `;
  }

  // Discount code section
  let discountSection = '';
  if (discountCode && discountPercent) {
    discountSection = `
      <div class="brand-yellow" style="margin: 0 0 24px; padding: 20px; background-color: #FDFD74; border-radius: 12px; border: 3px solid #1A1A1A; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Discount Code</p>
        <p style="margin: 0 0 8px; font-size: 32px; font-weight: 900; color: #1A1A1A; letter-spacing: 4px; font-family: monospace;">${discountCode}</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1A1A1A;">${discountPercent}% OFF your next purchase</p>
        <p class="text-muted" style="margin: 8px 0 0; font-size: 13px; color: #666666;">Use anytime - no expiry</p>
      </div>
    `;
  }

  const content = `
    <!-- Hero Section with Heart Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div class="icon-circle-mint" style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #2EFECC 0%, #87EFFF 100%); border-radius: 50%; padding: 20px; box-sizing: border-box;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#1A1A1A"/>
        </svg>
      </div>
    </div>

    <h2 class="text-dark" style="margin: 0 0 16px; font-size: 28px; font-weight: 800; color: #1A1A1A; text-align: center; line-height: 1.2;">
      ${greeting}, Thank You!
    </h2>

    <p class="text-muted" style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
      We really appreciate your patience while we resolved ${issueDescription}. Your support means the world to us, and we wanted to make sure you're taken care of.
    </p>

    ${compensationSection}

    ${discountSection}

    <!-- Referral Section -->
    <div style="margin: 0 0 24px; padding: 30px 24px; background: linear-gradient(135deg, #1A1A1A 0%, #333333 100%); border-radius: 16px; text-align: center; border: 3px solid #2EFECC;">
      <p class="brand-mint" style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #2EFECC; text-transform: uppercase; letter-spacing: 2px;">Share With Friends & Family</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #CCCCCC; line-height: 1.5;">Give them <span style="color: #2EFECC; font-weight: 700;">1 GB FREE</span> + <span style="color: #2EFECC; font-weight: 700;">10% OFF</span> their first purchase.<br>You get <span style="color: #FDFD74; font-weight: 700;">1 GB FREE</span> for every friend who buys!</p>

      <div style="margin: 16px 0; padding: 16px; background-color: rgba(253, 253, 116, 0.2); border-radius: 8px; border: 2px solid #FDFD74;">
        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #CCCCCC; text-transform: uppercase; letter-spacing: 1px;">Your Referral Code</p>
        <p style="margin: 0; font-size: 24px; font-weight: 900; color: #FDFD74; letter-spacing: 3px; font-family: monospace;">${referralCode}</p>
      </div>
    </div>

    <!-- Trustpilot Review Section -->
    <div class="card-muted" style="margin: 0 0 24px; padding: 24px; background-color: #F5F5F5; border-radius: 12px; text-align: center;">
      <div style="margin-bottom: 12px;">
        <img src="https://cdn.trustpilot.net/brand-assets/4.3.0/logo-black.svg" alt="Trustpilot" style="height: 24px; width: auto;" />
      </div>
      <p class="text-dark" style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #1A1A1A;">Enjoying Lumbus?</p>
      <p class="text-muted" style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">We'd love to hear about your experience! Check your inbox for the <strong>Trustpilot email</strong> we sent - leaving a review through that link marks you as a <span style="color: #00B67A; font-weight: 700;">verified customer</span>.</p>
    </div>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
      Questions? We're always here at <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 700; text-decoration: none;">support@getlumbus.com</a>
    </p>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject: `Thank You For Your Patience${discountCode && discountPercent ? ` - Here's ${discountPercent}% Off!` : ''}`,
      html: createEmailTemplate({
        title: 'Thank You!',
        subtitle: "We've resolved your issue",
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send issue resolved email:', error);
    throw error;
  }
}

export interface SendCustomEmailParams {
  to: string;
  subject: string;
  title: string;
  subtitle?: string;
  content: string; // HTML content for the email body
}

/**
 * Send a custom email with full control over subject and body content
 * Uses the standard Lumbus email template wrapper
 */
export async function sendCustomEmail(params: SendCustomEmailParams) {
  const { to, subject, title, subtitle, content } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: [to],
      subject,
      html: createEmailTemplate({
        title,
        subtitle,
        content,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send custom email:', error);
    throw error;
  }
}
