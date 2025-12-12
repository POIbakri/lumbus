import { config } from 'dotenv';
import { Resend } from 'resend';

// Load .env.local
config({ path: '.env.local' });

console.log('API Key found:', !!process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const testEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email - Lumbus</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <!-- Header with logo -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px; background-color: #FFFFFF; border-bottom: 3px solid #2EFECC;">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="160" style="display: block; width: 160px; height: auto; max-width: 100%;" />
                            </a>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 800; color: #1A1A1A; text-align: center;">Email Template Test</h2>
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                                This is a test email to verify the flat design and Lumbus color updates are working correctly.
                            </p>

                            <!-- Info Box with teal border -->
                            <div style="margin: 0 0 30px; padding: 25px; background-color: #F5F5F5; border-radius: 12px; border-left: 4px solid #2EFECC;">
                                <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 700; color: #1A1A1A;">Design Updates:</h3>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr><td style="padding: 8px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900; margin-right: 8px;">✓</span> Flat design with no gradients</p></td></tr>
                                    <tr><td style="padding: 8px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900; margin-right: 8px;">✓</span> Teal (#2EFECC) accent borders</p></td></tr>
                                    <tr><td style="padding: 8px 0;"><p style="margin: 0; font-size: 14px; color: #666666;"><span style="color: #2EFECC; font-weight: 900; margin-right: 8px;">✓</span> Clean, minimal styling</p></td></tr>
                                </table>
                            </div>

                            <!-- Highlight Box with teal background -->
                            <div style="margin: 0 0 30px; padding: 20px; background-color: #E0FEF7; border-radius: 12px; border: 2px solid #2EFECC;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #1A1A1A; font-weight: 700;">Lumbus Color Palette:</p>
                                <p style="margin: 0; font-size: 14px; color: #666666;">Primary: #2EFECC (Teal) • Background: #F5F5F5 • Text: #1A1A1A</p>
                            </div>

                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="https://getlumbus.com" style="display: inline-block; padding: 14px 32px; background-color: #2EFECC; color: #1A1A1A; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px;">
                                            Visit Lumbus
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5;">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                                            Questions? <a href="mailto:support@getlumbus.com" style="color: #1A1A1A; font-weight: 600; text-decoration: none;">support@getlumbus.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #999999;">
                                            © 2025 Lumbus. All rights reserved.
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

async function sendTestEmail() {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
    to: ['bakri@getlumbus.com'],
    subject: 'Lumbus Email Template Test - Flat Design Update',
    html: testEmailHtml,
  });

  if (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }

  console.log('Test email sent successfully!');
  console.log('Email ID:', data?.id);
}

sendTestEmail();
