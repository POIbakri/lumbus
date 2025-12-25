/**
 * eSIM Access Issue Alerts
 * Sends alerts to support@getlumbus.com for eSIM-related issues
 */

import { Resend } from 'resend';

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

/**
 * eSIM Access Issue Alert Types
 */
export type EsimIssueType =
  | 'SMDP_DISABLED'
  | 'PROVISIONING_FAILED'
  | 'ACTIVATION_FAILED'
  | 'USAGE_NOT_TRACKING'
  | 'STATUS_MISMATCH'
  | 'API_ERROR'
  | 'REWARD_TOPUP_FAILED'
  | 'PAID_TOPUP_FAILED'
  | 'WALLET_DEDUCTION_FAILED'
  | 'OTHER';

/**
 * Send eSIM Access issue alert to support team
 */
export interface SendEsimIssueAlertParams {
  issueType: EsimIssueType;
  userEmail: string;
  userId: string;
  orderId?: string;
  iccid?: string;
  esimTranNo?: string;
  esimStatus?: string;
  smdpStatus?: string;
  errorMessage?: string;
  additionalDetails?: string;
  amountMB?: number;
  packageName?: string;
}

export async function sendEsimIssueAlert(params: SendEsimIssueAlertParams) {
  const {
    issueType,
    userEmail,
    userId,
    orderId,
    iccid,
    esimTranNo,
    esimStatus,
    smdpStatus,
    errorMessage,
    additionalDetails,
    amountMB,
    packageName,
  } = params;

  const issueLabels: Record<EsimIssueType, { label: string; severity: string; color: string }> = {
    SMDP_DISABLED: { label: 'SMDP Disabled', severity: 'High', color: '#E53E3E' },
    PROVISIONING_FAILED: { label: 'Provisioning Failed', severity: 'Critical', color: '#C53030' },
    ACTIVATION_FAILED: { label: 'Activation Failed', severity: 'High', color: '#E53E3E' },
    USAGE_NOT_TRACKING: { label: 'Usage Not Tracking', severity: 'Medium', color: '#DD6B20' },
    STATUS_MISMATCH: { label: 'Status Mismatch', severity: 'Medium', color: '#DD6B20' },
    API_ERROR: { label: 'API Error', severity: 'High', color: '#E53E3E' },
    REWARD_TOPUP_FAILED: { label: 'Reward Top-up Failed', severity: 'High', color: '#E53E3E' },
    PAID_TOPUP_FAILED: { label: 'Paid Top-up Failed', severity: 'Critical', color: '#C53030' },
    WALLET_DEDUCTION_FAILED: { label: 'Wallet Deduction Failed', severity: 'Critical', color: '#C53030' },
    OTHER: { label: 'Other Issue', severity: 'Low', color: '#718096' },
  };

  const issue = issueLabels[issueType];
  const timestamp = new Date().toISOString();

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@updates.getlumbus.com',
      to: ['support@getlumbus.com'],
      subject: `[${issue.severity}] eSIM Issue: ${issue.label} - ${userEmail}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eSIM Issue Alert - Lumbus Support</title>
    <style>
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
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                    <!-- Header with severity color -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px; background-color: #FFFFFF; border-bottom: 4px solid ${issue.color};">
                            <a href="https://getlumbus.com" style="text-decoration: none;">
                                <img src="https://getlumbus.com/logotrans.png" alt="Lumbus" width="140" style="display: block; width: 140px; height: auto;" />
                            </a>
                            <p style="margin: 12px 0 0; font-size: 12px; font-weight: 700; color: ${issue.color}; text-transform: uppercase; letter-spacing: 1px;">
                                eSIM Access Issue Alert
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding" style="padding: 30px;">
                            <!-- Severity Badge -->
                            <div style="margin: 0 0 20px; text-align: center;">
                                <span style="display: inline-block; padding: 8px 16px; background-color: ${issue.color}; color: #FFFFFF; font-size: 14px; font-weight: 700; border-radius: 20px;">
                                    ${issue.severity} Priority - ${issue.label}
                                </span>
                            </div>

                            <h2 style="margin: 0 0 25px; font-size: 22px; font-weight: 700; color: #1A1A1A; text-align: center;">
                                Issue Detected
                            </h2>

                            <!-- User Details -->
                            <div style="margin: 0 0 20px; padding: 20px; background-color: #F5F5F5; border-radius: 12px;">
                                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1A1A1A;">User Information</p>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Email:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #1A1A1A; text-align: right; font-weight: 600;">${userEmail}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">User ID:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #1A1A1A; text-align: right; font-family: monospace; font-size: 11px;">${userId}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- eSIM Details -->
                            <div style="margin: 0 0 20px; padding: 20px; background-color: #FFF5F5; border-radius: 12px; border: 1px solid ${issue.color}20;">
                                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1A1A1A;">eSIM Details</p>
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    ${orderId ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Order ID:</td>
                                        <td style="padding: 6px 0; font-size: 11px; color: #1A1A1A; text-align: right; font-family: monospace;">${orderId}</td>
                                    </tr>` : ''}
                                    ${iccid ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">ICCID:</td>
                                        <td style="padding: 6px 0; font-size: 11px; color: #1A1A1A; text-align: right; font-family: monospace;">${iccid}</td>
                                    </tr>` : ''}
                                    ${esimTranNo ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">eSIM Tran No:</td>
                                        <td style="padding: 6px 0; font-size: 11px; color: #1A1A1A; text-align: right; font-family: monospace;">${esimTranNo}</td>
                                    </tr>` : ''}
                                    ${esimStatus ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">eSIM Status:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #1A1A1A; text-align: right; font-weight: 600;">${esimStatus}</td>
                                    </tr>` : ''}
                                    ${smdpStatus ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">SMDP Status:</td>
                                        <td style="padding: 6px 0; font-size: 13px; text-align: right; font-weight: 600; color: ${smdpStatus === 'ENABLED' ? '#38A169' : '#E53E3E'};">${smdpStatus}</td>
                                    </tr>` : ''}
                                    ${packageName ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Package:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #1A1A1A; text-align: right;">${packageName}</td>
                                    </tr>` : ''}
                                    ${amountMB ? `<tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Amount:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #1A1A1A; text-align: right; font-weight: 600;">${(amountMB / 1024).toFixed(1)} GB</td>
                                    </tr>` : ''}
                                </table>
                            </div>

                            ${errorMessage ? `
                            <!-- Error Message -->
                            <div style="margin: 0 0 20px; padding: 15px; background-color: #FED7D7; border-radius: 8px;">
                                <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; color: #C53030;">Error Message:</p>
                                <p style="margin: 0; font-size: 13px; color: #742A2A; font-family: monospace; word-break: break-all;">${errorMessage}</p>
                            </div>
                            ` : ''}

                            ${additionalDetails ? `
                            <!-- Additional Details -->
                            <div style="margin: 0 0 20px; padding: 15px; background-color: #EDF2F7; border-radius: 8px;">
                                <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; color: #4A5568;">Additional Details:</p>
                                <p style="margin: 0; font-size: 13px; color: #2D3748; line-height: 1.5;">${additionalDetails}</p>
                            </div>
                            ` : ''}

                            <!-- Timestamp -->
                            <p style="margin: 20px 0 0; font-size: 12px; color: #999; text-align: center;">
                                Detected at: ${timestamp}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px; background-color: #F5F5F5; border-top: 1px solid #E5E5E5; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #666666;">
                                This is an automated alert from Lumbus eSIM monitoring.
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

    console.log(`[eSIM Alert] Sent ${issueType} alert for user ${userEmail}`);
    return data;
  } catch (error) {
    console.error('Failed to send eSIM issue alert:', error);
    // Don't throw - we don't want alert failures to break the main flow
    return null;
  }
}
