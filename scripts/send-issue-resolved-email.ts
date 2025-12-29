import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendIssueResolvedEmail } from '../lib/marketing-emails';

async function sendTestEmail() {
  console.log('Sending issue resolved email...');

  try {
    const result = await sendIssueResolvedEmail({
      to: 'joshmooney1@icloud.com',
      firstName: 'Josh',
      issueDescription: 'the top-up issue',
      dataFixed: '5 GB', // His purchase that was fixed
      refundAmount: 9.61, // Duplicate purchase refund
      refundCurrency: 'GBP',
      refundDays: '5-10',
      discountCode: 'JOSH1234',
      discountPercent: 50,
      referralCode: 'NN2MH752',
      referralLink: 'https://getlumbus.com/r/NN2MH752',
    });

    console.log('Test email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

sendTestEmail();
