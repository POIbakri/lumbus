'use client';

import { Nav } from '@/components/nav';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-4">
              Privacy Policy
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
                At Lumbus, we are committed to protecting your privacy and personal data. This Privacy Policy explains
                how we collect, use, store, and protect your information when you use our eSIM services.
              </p>
              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary mb-4">
                <p className="font-bold text-sm sm:text-base">Data Controller:</p>
                <p className="text-sm">LUMBUS TELECOM LIMITED</p>
                <p className="text-sm">Company Number: 16793515</p>
                <p className="text-sm">Registered in England and Wales</p>
                <p className="text-sm">Location: London, United Kingdom</p>
                <p className="text-sm mt-2">Email: privacy@lumbus.com</p>
              </div>
              <p className="text-sm sm:text-base leading-relaxed">
                This policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
              </p>
            </section>

            {/* 1. Information We Collect */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">1. Information We Collect</h2>

              <h3 className="text-lg sm:text-xl font-bold mb-2">1.1 Information You Provide</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Payment Information:</strong> Billing address, payment card details (processed securely by Stripe)</li>
                <li><strong>Communication Data:</strong> Support inquiries, feedback, referral information</li>
                <li><strong>Affiliate Applications:</strong> Business details if you apply for our affiliate program</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">1.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Device Information:</strong> Device type, operating system, browser type, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on site, click patterns</li>
                <li><strong>Location Data:</strong> IP address, general location (country/city level)</li>
                <li><strong>eSIM Usage Data:</strong> Data consumption, connection times, network usage statistics</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">1.3 Information from Third Parties</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li><strong>Payment Providers:</strong> Transaction confirmation from Stripe</li>
                <li><strong>Network Operators:</strong> eSIM activation status, data usage from our eSIM provider</li>
                <li><strong>Analytics Services:</strong> Aggregated usage statistics from Google Analytics</li>
              </ul>
            </section>

            {/* 2. How We Use Your Information */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">2. How We Use Your Information</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We use your personal data for the following purposes:
              </p>

              <h3 className="text-lg sm:text-xl font-bold mb-2">2.1 Service Delivery</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Processing and fulfilling your eSIM orders</li>
                <li>Activating and provisioning eSIMs</li>
                <li>Monitoring data usage and validity periods</li>
                <li>Providing customer support</li>
                <li>Sending service-related notifications (order confirmations, activation instructions)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">2.2 Account Management</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Creating and maintaining your account</li>
                <li>Authenticating your identity</li>
                <li>Managing your referral rewards and data wallet</li>
                <li>Processing password resets and security updates</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">2.3 Payment Processing</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Processing payments securely via Stripe</li>
                <li>Detecting and preventing fraud</li>
                <li>Issuing refunds when applicable</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">2.4 Marketing and Communications</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Sending promotional emails about new plans and offers (with your consent)</li>
                <li>Managing referral programs and affiliate partnerships</li>
                <li>Conducting customer surveys and feedback requests</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">2.5 Analytics and Improvement</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Analyzing website and app usage to improve user experience</li>
                <li>Identifying technical issues and bugs</li>
                <li>Developing new features and services</li>
                <li>Understanding customer preferences and behavior</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">2.6 Legal and Security</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Complying with legal obligations and regulations</li>
                <li>Preventing fraud, abuse, and illegal activities</li>
                <li>Protecting our rights and property</li>
                <li>Enforcing our Terms and Conditions</li>
              </ul>
            </section>

            {/* 3. Legal Basis for Processing */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">3. Legal Basis for Processing</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Under UK GDPR, we process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li><strong>Contractual Necessity:</strong> To fulfill our contract with you (providing eSIM services)</li>
                <li><strong>Legitimate Interests:</strong> To improve our services, prevent fraud, and conduct analytics</li>
                <li><strong>Legal Obligation:</strong> To comply with tax, accounting, and regulatory requirements</li>
                <li><strong>Consent:</strong> For marketing communications (you can withdraw consent at any time)</li>
              </ul>
            </section>

            {/* 4. Data Sharing and Disclosure */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We may share your personal data with the following third parties:
              </p>

              <h3 className="text-lg sm:text-xl font-bold mb-2">4.1 Service Providers</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                <li><strong>eSIM Access / Network Providers:</strong> eSIM provisioning and network connectivity</li>
                <li><strong>Supabase:</strong> Database hosting and authentication services</li>
                <li><strong>Vercel:</strong> Website and application hosting</li>
                <li><strong>Resend:</strong> Transactional email delivery</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">4.2 Analytics and Marketing</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Google Analytics:</strong> Website usage analytics (anonymized data)</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">4.3 Legal Requirements</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We may disclose your information if required by law, court order, or government request, or to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Comply with legal processes and law enforcement requests</li>
                <li>Protect the rights, property, and safety of Lumbus, our users, or the public</li>
                <li>Detect, prevent, or investigate fraud, security issues, or illegal activities</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">4.4 Business Transfers</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity.
                We will notify you of any such change and your rights regarding your data.
              </p>
            </section>

            {/* 5. International Data Transfers */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">5. International Data Transfers</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                Some of our service providers are located outside the UK and European Economic Area (EEA). When we
                transfer your data internationally, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Standard Contractual Clauses (SCCs) approved by the UK Information Commissioner's Office (ICO)</li>
                <li>Adequacy decisions recognizing equivalent data protection standards</li>
                <li>Service providers certified under recognized data protection frameworks</li>
              </ul>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">6. Data Retention</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li><strong>Account Data:</strong> Retained while your account is active, plus 3 years after closure</li>
                <li><strong>Transaction Records:</strong> Retained for 7 years for tax and accounting purposes (UK law requirement)</li>
                <li><strong>Support Communications:</strong> Retained for 2 years after resolution</li>
                <li><strong>Marketing Data:</strong> Retained until you withdraw consent or unsubscribe</li>
                <li><strong>Analytics Data:</strong> Anonymized and retained indefinitely for statistical purposes</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-3">
                After the retention period, we securely delete or anonymize your data.
              </p>
            </section>

            {/* 7. Your Rights */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">7. Your Rights Under UK GDPR</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                You have the following rights regarding your personal data:
              </p>

              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal obligations)</li>
                <li><strong>Right to Restriction:</strong> Limit how we use your data in certain circumstances</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for marketing purposes</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
                <li><strong>Right to Complain:</strong> Lodge a complaint with the Information Commissioner's Office (ICO)</li>
              </ul>

              <p className="text-sm sm:text-base leading-relaxed">
                To exercise any of these rights, contact us at <strong>privacy@lumbus.com</strong>. We will respond
                within 30 days.
              </p>
            </section>

            {/* 8. Cookies and Tracking */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We use cookies and similar technologies to enhance your experience:
              </p>

              <h3 className="text-lg sm:text-xl font-bold mb-2">8.1 Essential Cookies</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Session management and authentication</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and performance</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">8.2 Analytics Cookies</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Google Analytics: Track website usage and performance</li>
                <li>User behavior analysis for service improvement</li>
              </ul>

              <h3 className="text-lg sm:text-xl font-bold mb-2">8.3 Marketing Cookies</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base mb-4">
                <li>Referral tracking (affiliate and user referral programs)</li>
                <li>Campaign performance measurement</li>
              </ul>

              <p className="text-sm sm:text-base leading-relaxed">
                You can control cookies through your browser settings. Note that disabling essential cookies may affect
                website functionality.
              </p>
            </section>

            {/* 9. Security */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">9. Data Security</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
                <li>Encryption in transit (HTTPS/TLS) and at rest</li>
                <li>Secure authentication with password hashing (bcrypt)</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and role-based permissions</li>
                <li>Secure payment processing via PCI-DSS compliant Stripe</li>
                <li>Database backups and disaster recovery procedures</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-3">
                While we take all reasonable precautions, no system is completely secure. You are responsible for
                maintaining the confidentiality of your account credentials.
              </p>
            </section>

            {/* 10. Children's Privacy */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">10. Children's Privacy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Our Services are not intended for children under 18. We do not knowingly collect personal data from
                children. If you believe we have inadvertently collected data from a child, please contact us immediately
                at privacy@lumbus.com, and we will delete it promptly.
              </p>
            </section>

            {/* 11. Changes to Privacy Policy */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
                or legal requirements. We will notify you of significant changes via email or a prominent notice on
                our website. Your continued use of our Services after changes are posted constitutes acceptance of
                the updated policy.
              </p>
            </section>

            {/* 12. Contact Us */}
            <section>
              <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">12. Contact Information</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-3">
                For questions about this Privacy Policy or to exercise your data rights, contact us:
              </p>
              <div className="bg-mint p-4 sm:p-6 rounded-xl border-2 border-primary mb-4">
                <p className="font-bold text-sm sm:text-base mb-2">Data Protection Officer</p>
                <p className="text-sm mb-1">LUMBUS TELECOM LIMITED</p>
                <p className="text-sm mb-1">Email: privacy@lumbus.com</p>
                <p className="text-sm mb-1">Support: support@lumbus.com</p>
                <p className="text-sm">Company Number: 16793515</p>
              </div>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Supervisory Authority</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-2">
                You have the right to lodge a complaint with the UK Information Commissioner's Office (ICO):
              </p>
              <div className="bg-yellow p-4 sm:p-6 rounded-xl border-2 border-secondary">
                <p className="font-bold text-sm sm:text-base mb-2">Information Commissioner's Office (ICO)</p>
                <p className="text-sm mb-1">Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ico.org.uk</a></p>
                <p className="text-sm mb-1">Helpline: 0303 123 1113</p>
                <p className="text-sm">Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF, UK</p>
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
