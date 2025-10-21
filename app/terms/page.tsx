'use client';

import { Nav } from '@/components/nav';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-4">
              Terms and Conditions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 sm:space-y-8">

            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">1. Introduction</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Welcome to Lumbus. These Terms and Conditions ("Terms") govern your use of our eSIM services,
                website, and mobile applications (collectively, the "Services") provided by:
              </p>
              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary mb-4">
                <p className="font-bold text-sm sm:text-base">LUMBUS TECHNOLOGIES LIMITED</p>
                <p className="text-sm">Company Number: 16793515</p>
                <p className="text-sm">Registered in England and Wales</p>
                <p className="text-sm">Location: London, United Kingdom</p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed">
                By accessing or using our Services, you agree to be bound by these Terms. If you do not
                agree with any part of these Terms, you must not use our Services.
              </p>
            </section>

            {/* 2. Service Description */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">2. Service Description</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Lumbus provides prepaid eSIM data packages for mobile devices, enabling connectivity in 150+ countries worldwide.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>eSIM data plans with specified data allowances and validity periods</li>
                <li>Digital activation via QR code or manual entry</li>
                <li>No physical SIM card required</li>
                <li>Services accessible via our website and mobile applications</li>
              </ul>
            </section>

            {/* 3. Device Compatibility */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">3. Device Compatibility</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                <strong>You are solely responsible for ensuring your device is eSIM-compatible before purchasing.</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Your device must support eSIM technology</li>
                <li>Your device must be carrier-unlocked</li>
                <li>You must check compatibility before purchase using our compatibility checker</li>
                <li>Lumbus is not responsible for compatibility issues arising from locked or incompatible devices</li>
              </ul>
            </section>

            {/* 4. Account Registration */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">4. Account Registration</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                To use certain features of our Services, you may need to create an account:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>You must provide accurate and complete information</li>
                <li>You must be at least 18 years old or have parental consent</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>One account per person; multiple accounts may be suspended</li>
              </ul>
            </section>

            {/* 5. Purchase and Payment */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">5. Purchase and Payment</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">5.1 Pricing</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>All prices are displayed in your local currency unless otherwise stated</li>
                <li>Prices include applicable VAT where required</li>
                <li>We reserve the right to change prices at any time without prior notice</li>
                <li>Price changes do not affect orders already placed</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">5.2 Payment Methods</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We accept major credit cards, debit cards, and other payment methods via Stripe.
                Payment is processed securely and we do not store your full card details.
              </p>

              <h3 className="text-lg sm:text-xl font-bold mb-2">5.3 Order Confirmation</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                Once payment is confirmed, you will receive an email with your eSIM activation details.
                This constitutes acceptance of your order and forms a binding contract.
              </p>
            </section>

            {/* 6. eSIM Activation and Usage */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">6. eSIM Activation and Usage</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">6.1 Activation</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Activation instructions are provided via email immediately after purchase</li>
                <li>You must activate your eSIM before the expiry date shown in your plan details</li>
                <li>eSIMs can only be installed once; reinstallation may require a new purchase</li>
                <li>You are responsible for following activation instructions correctly</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">6.2 Validity Period</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Each plan has a specific validity period (e.g., 7 days, 30 days)</li>
                <li>The validity period begins upon first connection to a network</li>
                <li>Unused data and time do not roll over or extend beyond the validity period</li>
                <li>Plans cannot be paused or suspended</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">6.3 Data Usage</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Data usage is measured by our network provider</li>
                <li>Usage statistics may have a delay of up to 24 hours</li>
                <li>Once your data allowance is exhausted, service will stop</li>
                <li>Background app activity may consume data without your knowledge</li>
              </ul>
            </section>

            {/* 7. Fair Usage Policy */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">7. Fair Usage Policy</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Our Services are intended for personal, non-commercial use. Prohibited activities include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Using the Service for commercial purposes without authorization</li>
                <li>Reselling or distributing eSIMs to third parties</li>
                <li>Using the Service for illegal activities</li>
                <li>Excessive or abusive data consumption (e.g., running servers, torrenting large files)</li>
                <li>Sharing your eSIM or tethering to multiple devices excessively</li>
                <li>Circumventing usage limitations or security measures</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-3">
                <strong>We reserve the right to suspend or terminate service without refund if fair usage is violated.</strong>
              </p>
            </section>

            {/* 8. Network Coverage and Service Quality */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">8. Network Coverage and Service Quality</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                <strong>Important Notice:</strong> Lumbus acts as a reseller of eSIM services provided by third-party
                network operators.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Network coverage and quality depend on local network operators</li>
                <li>We do not guarantee continuous, uninterrupted, or error-free service</li>
                <li>Connection speeds may vary based on location, network congestion, and device</li>
                <li>Some services (voice calls, SMS) may not be available on all plans</li>
                <li>We are not liable for service disruptions caused by network operators</li>
              </ul>
            </section>

            {/* 9. Refunds and Cancellations */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">9. Refunds and Cancellations</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">9.1 Digital Goods</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                eSIM services are considered digital goods. Under UK Consumer Rights Act 2015, you have the right
                to cancel within 14 days, <strong>however, this right is waived once the eSIM is activated</strong>
                as the service has been fully performed.
              </p>

              <h3 className="text-lg sm:text-xl font-bold mb-2">9.2 Refund Eligibility</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Refunds may be granted in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Before Activation:</strong> Full refund if requested before eSIM activation</li>
                <li><strong>Technical Issues:</strong> If the eSIM fails to activate due to an error on our part</li>
                <li><strong>Service Failure:</strong> If we cannot deliver the service as described</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">9.3 Non-Refundable Situations</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Refunds will <strong>NOT</strong> be granted for:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Device incompatibility (responsibility to check before purchase)</li>
                <li>Carrier lock issues</li>
                <li>Poor network coverage in specific locations</li>
                <li>Change of mind after activation</li>
                <li>Unused data or validity period</li>
                <li>User error in activation or configuration</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">9.4 Refund Process</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                To request a refund, contact our support team at support@lumbus.com within 14 days of purchase.
                Refunds will be processed to the original payment method within 7-14 business days of approval.
              </p>
            </section>

            {/* 10. Limitation of Liability */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">10. Limitation of Liability</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Lumbus is not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid for the affected service</li>
                <li>We are not responsible for loss of data, profits, or business opportunities</li>
                <li>We do not guarantee specific connection speeds or network performance</li>
                <li>We are not liable for actions of third-party network operators</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-3">
                <strong>Nothing in these Terms excludes liability for death or personal injury caused by negligence,
                fraud, or any other liability that cannot be excluded by UK law.</strong>
              </p>
            </section>

            {/* 11. Intellectual Property */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">11. Intellectual Property</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                All content on our website and apps, including text, graphics, logos, and software, is the property
                of Lumbus Technologies Limited or our licensors and is protected by UK and international copyright laws.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                You may not copy, reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            {/* 12. Privacy and Data Protection */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">12. Privacy and Data Protection</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Your privacy is important to us. Our collection and use of personal data is governed by our{' '}
                <Link href="/privacy" className="text-primary font-bold hover:underline">
                  Privacy Policy
                </Link>, which complies with UK GDPR and Data Protection Act 2018.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                By using our Services, you consent to the collection and use of your data as described in our Privacy Policy.
              </p>
            </section>

            {/* 13. Changes to Terms */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">13. Changes to Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon
                posting to our website. Your continued use of our Services after changes are posted constitutes
                acceptance of the modified Terms. We recommend reviewing this page periodically.
              </p>
            </section>

            {/* 14. Governing Law */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">14. Governing Law and Jurisdiction</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms
                or your use of our Services will be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                If you are a consumer in the EU, you may also have rights under EU consumer protection laws.
              </p>
            </section>

            {/* 15. Severability */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">15. Severability</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
                will continue in full force and effect.
              </p>
            </section>

            {/* 16. Contact Information */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">16. Contact Information</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                For questions about these Terms or our Services, please contact us:
              </p>
              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary">
                <p className="font-bold text-sm sm:text-base mb-2">LUMBUS TECHNOLOGIES LIMITED</p>
                <p className="text-sm mb-1">Email: support@lumbus.com</p>
                <p className="text-sm mb-1">Website: {typeof window !== 'undefined' ? window.location.origin : 'https://lumbus.com'}</p>
                <p className="text-sm">Company Number: 16793515</p>
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
