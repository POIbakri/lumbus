'use client';

import { Nav } from '@/components/nav';
import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-4">
              Refund Policy
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 sm:space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">Introduction</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                At Lumbus, we strive to provide excellent service and customer satisfaction. This Refund Policy
                outlines the circumstances under which refunds may be requested and granted for our eSIM services.
              </p>
              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary mb-4">
                <p className="font-bold text-sm sm:text-base">LUMBUS TELECOM LIMITED</p>
                <p className="text-sm">Company Number: 16793515</p>
                <p className="text-sm">Registered in England and Wales</p>
                <p className="text-sm mt-2">Email: support@lumbus.com</p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed">
                <strong>Important:</strong> eSIM services are digital products. Once activated or used, refunds may not be available
                except in specific circumstances outlined below.
              </p>
            </section>

            {/* UK Consumer Rights */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">UK Consumer Rights</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Under the UK Consumer Contracts Regulations 2013, you have the right to cancel your purchase within
                14 days of purchase. However, for digital content (including eSIMs):
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>
                  <strong>If the eSIM has been activated or used</strong>, you waive your right to cancellation as the service
                  has been fully performed with your consent.
                </li>
                <li>
                  <strong>If the eSIM has not been activated</strong>, you retain your 14-day cancellation right.
                </li>
              </ul>
              <div className="bg-yellow p-4 sm:p-6 rounded-xl border-2 border-secondary">
                <p className="text-sm sm:text-base font-bold">
                  💡 By proceeding to activate your eSIM, you expressly consent to immediate performance and
                  acknowledge that you will lose your right to cancel once the digital content is delivered and activated.
                </p>
              </div>
            </section>

            {/* 1. Change of Mind Refund */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">1. Change of Mind / Cooling-Off Period</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Eligibility</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                You may request a full refund for a change of mind if <strong>ALL</strong> of the following conditions are met:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>The eSIM has <strong>not been installed</strong> on any device</li>
                <li>The eSIM has <strong>not been activated</strong> or used in any way</li>
                <li>The QR code has <strong>not been scanned</strong></li>
                <li>No data has been consumed from the plan</li>
                <li>The purchase was made <strong>within the last 14 days</strong></li>
                <li>The purchase was made directly from Lumbus (not through a third-party reseller)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Process</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Contact our support team at <strong>support@lumbus.com</strong> within 14 days of purchase</li>
                <li>Include your order ID and reason for refund</li>
                <li>Our team will verify the eSIM has not been activated</li>
                <li>If eligible, refund will be processed within 7-14 business days to your original payment method</li>
              </ol>

              <div className="bg-red-50 p-4 sm:p-6 rounded-xl border-2 border-red-500">
                <p className="text-sm sm:text-base font-bold text-red-700 mb-2">❌ No Refund Available If:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                  <li>The eSIM has been installed or activated</li>
                  <li>Any data has been used from the plan</li>
                  <li>More than 14 days have passed since purchase</li>
                  <li>The purchase was made through a third-party</li>
                </ul>
              </div>
            </section>

            {/* 2. Device Incompatibility Refund */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">2. Device Incompatibility or Carrier Lock</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Eligibility</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                You may request a refund if your device is incompatible or carrier-locked, provided:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>You have <strong>not scanned the QR code</strong> or used the installation details</li>
                <li>No data has been consumed from the eSIM plan</li>
                <li>The purchase was made within the last <strong>14 days</strong></li>
                <li>You can provide <strong>proof of incompatibility or carrier lock</strong> (e.g., screenshot showing error message, carrier confirmation)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Required Documentation</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Screenshot of the error message when attempting to install eSIM</li>
                <li>Device model and operating system version</li>
                <li>Proof from your carrier that your device is locked (if applicable)</li>
              </ul>

              <div className="bg-cyan/20 p-4 sm:p-6 rounded-xl border-2 border-cyan">
                <p className="text-sm sm:text-base font-bold mb-2">💡 Before Purchasing:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Check if your device supports eSIM at <Link href="/device" className="text-primary hover:underline font-bold">/device</Link></li>
                  <li>Ensure your device is carrier-unlocked</li>
                  <li>Verify eSIM compatibility with your carrier</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground">
                  <strong>Note:</strong> You are responsible for verifying device compatibility before purchase. Refunds for incompatibility
                  are granted as a courtesy but may not be available if the eSIM has been activated.
                </p>
              </div>
            </section>

            {/* 3. Technical Issues / Service Failure */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">3. Technical Issues or Service Failure</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">When We Will Refund</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                You are eligible for a full refund if:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>eSIM fails to activate</strong> due to an error on our part or our eSIM provider</li>
                <li><strong>No network connectivity</strong> despite following activation instructions correctly</li>
                <li><strong>Persistent technical issues</strong> that prevent normal use of the service</li>
                <li><strong>Incorrect eSIM delivered</strong> (wrong region or data amount)</li>
                <li><strong>Service significantly different</strong> from what was advertised</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Process</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Contact our 24/7 support team <strong>immediately</strong> at support@lumbus.com</li>
                <li>Provide your order ID and detailed description of the issue</li>
                <li>Our team will troubleshoot the problem and attempt to resolve it</li>
                <li>If the issue cannot be resolved, we will offer:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Full refund, or</li>
                    <li>Replacement eSIM at no cost, or</li>
                    <li>Store credit for future purchases</li>
                  </ul>
                </li>
              </ol>

              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary">
                <p className="text-sm sm:text-base font-bold mb-2">✅ Examples of Refundable Technical Issues:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>eSIM activation code doesn't work despite correct entry</li>
                  <li>No network signal in a covered area (confirmed by our provider)</li>
                  <li>eSIM expires immediately after activation (system error)</li>
                  <li>Received wrong region eSIM (e.g., ordered Japan, received UK)</li>
                </ul>
              </div>
            </section>

            {/* 4. Network Coverage Issues */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">4. Network Coverage Issues</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Not Eligible for Refund</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                <strong>Refunds are NOT available for:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Poor or weak signal in specific locations (network coverage varies)</li>
                <li>Slower speeds than expected (speeds vary by location and network congestion)</li>
                <li>Temporary network outages by the local carrier</li>
                <li>Rural or remote areas with limited coverage</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">When We May Offer Compensation</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                If you experience <strong>complete lack of service</strong> in an area advertised as covered, contact us immediately.
                We will:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Verify with our network provider</li>
                <li>Check if there's a known outage or issue</li>
                <li>Offer store credit or full refund if the issue is on our provider's end</li>
              </ul>

              <div className="bg-yellow p-4 sm:p-6 rounded-xl border-2 border-secondary">
                <p className="text-sm sm:text-base font-bold">
                  ⚠️ Important: We rely on third-party network operators for coverage. While we do our best to ensure
                  reliable service, we cannot guarantee consistent coverage in all locations at all times.
                </p>
              </div>
            </section>

            {/* 5. Partial Refunds */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">5. Partial Refunds</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                In certain circumstances, we may offer a <strong>partial refund</strong> based on:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Data used:</strong> If you've consumed some data before the issue occurred</li>
                <li><strong>Time elapsed:</strong> If the plan was active for several days before the problem</li>
                <li><strong>Service quality:</strong> If service was intermittent rather than completely unavailable</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Calculation Example</h3>
              <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-foreground/20">
                <p className="text-sm mb-2">
                  <strong>Scenario:</strong> You purchased a 30-day, 10GB plan for £30. After 10 days and using 3GB,
                  you experience persistent connectivity issues we cannot resolve.
                </p>
                <p className="text-sm font-bold mt-3">
                  Partial Refund Calculation:
                </p>
                <ul className="list-none space-y-1 text-sm mt-2">
                  <li>• Remaining days: 20 of 30 = 66.7%</li>
                  <li>• Remaining data: 7 of 10GB = 70%</li>
                  <li>• Average: (66.7% + 70%) / 2 = 68.35%</li>
                  <li className="font-bold text-primary mt-2">• Refund: £30 × 68.35% = £20.51</li>
                </ul>
              </div>
            </section>

            {/* 6. Refund Processing */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">6. Refund Processing</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Timeline</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Approval:</strong> Refund requests are reviewed within 2-3 business days</li>
                <li><strong>Processing:</strong> Approved refunds are processed within 7-14 business days</li>
                <li><strong>Bank processing:</strong> Your bank may take an additional 3-5 business days to credit your account</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Refund Method</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Refunds are issued to the <strong>original payment method</strong> used for purchase:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Credit/debit card: Refunded to the same card</li>
                <li>Apple Pay/Google Pay: Refunded to the linked card</li>
                <li>Alternative methods may be available in specific cases (e.g., store credit)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Confirmation</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                You will receive an email confirmation once your refund has been processed, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Refund amount</li>
                <li>Transaction ID</li>
                <li>Expected timeline for funds to appear in your account</li>
              </ul>
            </section>

            {/* 7. Non-Refundable Situations */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">7. Non-Refundable Situations</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                <strong>Refunds will NOT be granted in the following circumstances:</strong>
              </p>
              <div className="bg-red-50 p-4 sm:p-6 rounded-xl border-2 border-red-500">
                <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-red-700">
                  <li>Change of mind after eSIM activation or data usage</li>
                  <li>Device incompatibility that could have been checked before purchase</li>
                  <li>Carrier-locked device (your responsibility to unlock)</li>
                  <li>Unused data or validity period (plans are prepaid and non-refundable once activated)</li>
                  <li>Poor signal in specific locations (coverage varies naturally)</li>
                  <li>Slower speeds than expected (speeds vary by location and network)</li>
                  <li>User error in activation or configuration</li>
                  <li>Change of travel plans after purchase and activation</li>
                  <li>Purchases made from third-party resellers (must contact the reseller)</li>
                  <li>Violation of our Terms of Service or Fair Usage Policy</li>
                </ul>
              </div>
            </section>

            {/* 8. How to Request a Refund */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">8. How to Request a Refund</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Contact Support:</strong> Email us at <strong>support@lumbus.com</strong></li>
                <li><strong>Subject Line:</strong> Include "Refund Request - [Order ID]"</li>
                <li><strong>Provide Details:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Order ID (found in your confirmation email)</li>
                    <li>Email address used for purchase</li>
                    <li>Reason for refund request</li>
                    <li>Supporting evidence (screenshots, error messages, etc.)</li>
                  </ul>
                </li>
                <li><strong>Wait for Response:</strong> Our team will review and respond within 2-3 business days</li>
                <li><strong>Follow Instructions:</strong> We may need additional information to process your refund</li>
              </ol>

              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary">
                <p className="font-bold text-sm sm:text-base mb-2">📧 Contact Information:</p>
                <p className="text-sm mb-1">Email: support@lumbus.com</p>
                <p className="text-sm mb-1">Support Hours: 24/7</p>
                <p className="text-sm">Response Time: Within 24-48 hours</p>
              </div>
            </section>

            {/* 9. Disputes and Complaints */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">9. Disputes and Complaints</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                If you are not satisfied with the outcome of your refund request:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Request escalation to a senior manager via support@lumbus.com</li>
                <li>Allow 5-7 business days for a thorough review</li>
                <li>If still unresolved, you may contact alternative dispute resolution services</li>
              </ol>

              <h3 className="text-lg sm:text-xl font-bold mb-2">UK Consumer Rights</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                If you believe your consumer rights have been violated, you can contact:
              </p>
              <div className="bg-yellow p-4 sm:p-6 rounded-xl border-2 border-secondary">
                <p className="font-bold text-sm sm:text-base mb-2">Citizens Advice Consumer Service</p>
                <p className="text-sm mb-1">Website: <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.citizensadvice.org.uk</a></p>
                <p className="text-sm">Phone: 0808 223 1133</p>
              </div>
            </section>

            {/* 10. Changes to Policy */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">10. Changes to This Policy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to update this Refund Policy at any time. Changes will be posted on this page
                with an updated "Last Modified" date. Your continued use of our services after changes are posted
                constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">Contact Us</h2>
              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary">
                <p className="font-bold text-sm sm:text-base mb-2">LUMBUS TELECOM LIMITED</p>
                <p className="text-sm mb-1">Company Number: 16793515</p>
                <p className="text-sm mb-1">Registered in England and Wales</p>
                <p className="text-sm mb-1">Location: London, United Kingdom</p>
                <p className="text-sm mb-3 mt-3">Email: support@lumbus.com</p>
                <p className="text-sm">For questions about this Refund Policy or to request a refund, please contact us using the information above.</p>
              </div>
            </section>

          </div>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link href="/">
              <button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-8 py-4 rounded-xl">
                BACK TO HOME
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
