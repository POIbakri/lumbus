'use client';

import { useState } from 'react';
import { Nav } from '@/components/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { triggerHaptic } from '@/lib/device-detection';

export default function DeleteDataPage() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [specificData, setSpecificData] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      triggerHaptic('medium');
      return;
    }

    setIsSubmitting(true);
    setError('');
    triggerHaptic('light');

    try {
      const response = await fetch('/api/user/request-data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          specificData,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(true);
      triggerHaptic('light');

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowForm(false);
        setEmail('');
        setSpecificData('');
        setReason('');
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Data deletion request error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit request. Please try again or contact support@getlumbus.com'
      );
      triggerHaptic('medium');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🔒</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-3 sm:mb-4 leading-tight">
              DATA DELETION REQUEST
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground">
              Your privacy matters to us
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="bg-white border-2 sm:border-4 border-foreground shadow-xl rounded-2xl sm:rounded-3xl mb-6">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
              {/* Introduction */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">
                  YOUR DATA RIGHTS
                </h2>
                <p className="text-sm sm:text-base font-bold text-foreground/80 mb-3">
                  Under GDPR and other data protection regulations, you have the right to request
                  deletion of your personal data. You can choose to delete specific data without
                  closing your Lumbus account.
                </p>
              </div>

              {/* How to Request Section */}
              <div className="bg-primary/10 rounded-xl p-4 sm:p-6 border-2 border-primary/20 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl">📧</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase mb-2">
                      HOW TO REQUEST DATA DELETION
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-3">
                      You can request deletion of your personal data in two ways:
                    </p>
                  </div>
                </div>

                {!showForm && !success && (
                  <>
                    <div className="space-y-3 mb-4">
                      <Button
                        onClick={() => {
                          setShowForm(true);
                          triggerHaptic('light');
                        }}
                        className="w-full btn-lumbus bg-primary text-foreground hover:bg-primary/90 font-black py-4 text-sm sm:text-base border-2 border-foreground"
                      >
                        📝 SUBMIT REQUEST FORM
                      </Button>

                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground/60 mb-2">OR</p>
                      </div>

                      <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-foreground/10">
                        <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-2">Email us at:</p>
                        <a
                          href="mailto:support@getlumbus.com?subject=Data Deletion Request"
                          className="text-base sm:text-lg font-black text-primary hover:text-primary/80 break-all"
                        >
                          support@getlumbus.com
                        </a>
                      </div>
                    </div>

                    <div className="bg-mint rounded-lg p-3 sm:p-4 border-2 border-primary/20">
                      <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-2">
                        <strong>Include in your request:</strong>
                      </p>
                      <ul className="text-xs sm:text-sm font-bold text-foreground/80 space-y-1 ml-4">
                        <li>• Your registered email address</li>
                        <li>• Specific data you want deleted</li>
                        <li>• Reason for request (optional)</li>
                      </ul>
                    </div>
                  </>
                )}

                {showForm && !success && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-black text-foreground mb-2">
                        YOUR EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="email@example.com"
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 sm:px-4 py-3 rounded-xl border-2 border-foreground/20 font-mono text-sm sm:text-base focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-black text-foreground mb-2">
                        SPECIFIC DATA TO DELETE
                      </label>
                      <textarea
                        value={specificData}
                        onChange={(e) => setSpecificData(e.target.value)}
                        placeholder="Please specify what data you want deleted (e.g., contact information, usage data, etc.)"
                        rows={4}
                        disabled={isSubmitting}
                        className="w-full px-3 sm:px-4 py-3 rounded-xl border-2 border-foreground/20 text-sm sm:text-base focus:outline-none focus:border-primary resize-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-black text-foreground mb-2">
                        REASON (OPTIONAL)
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why are you requesting this deletion? (optional)"
                        rows={3}
                        disabled={isSubmitting}
                        className="w-full px-3 sm:px-4 py-3 rounded-xl border-2 border-foreground/20 text-sm sm:text-base focus:outline-none focus:border-primary resize-none disabled:opacity-50"
                      />
                    </div>

                    {error && (
                      <div className="bg-destructive/10 rounded-lg p-3 border-2 border-destructive/30">
                        <p className="text-xs sm:text-sm font-bold text-destructive text-center">
                          {error}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEmail('');
                          setSpecificData('');
                          setReason('');
                          setError('');
                          triggerHaptic('light');
                        }}
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 btn-lumbus bg-foreground/10 text-foreground hover:bg-foreground/20 font-black py-4 text-sm sm:text-base border-2 border-foreground/20 disabled:opacity-50"
                      >
                        ← CANCEL
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="w-full sm:flex-1 btn-lumbus bg-primary text-foreground hover:bg-primary/90 font-black py-4 text-sm sm:text-base border-2 border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? '⏳ SUBMITTING...' : '📧 SUBMIT REQUEST'}
                      </Button>
                    </div>
                  </form>
                )}

                {success && (
                  <div className="bg-primary/20 rounded-xl p-6 border-2 border-primary text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="text-lg sm:text-xl font-black uppercase mb-2">REQUEST SUBMITTED!</h3>
                    <p className="text-xs sm:text-sm font-bold text-foreground/80">
                      You will receive a confirmation email shortly. We'll process your request within 30 days.
                    </p>
                  </div>
                )}
              </div>

              {/* What Can Be Deleted */}
              <div className="bg-cyan/20 rounded-xl p-4 sm:p-6 border-2 border-primary/20 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl">✅</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase mb-2">
                      DATA WE CAN DELETE
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-3">
                      You can request deletion of the following personal data:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1">📧 Contact Information</div>
                    <p className="text-xs text-foreground/70">
                      Email address, phone number
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1">⚙️ Account Preferences</div>
                    <p className="text-xs text-foreground/70">
                      Settings, notifications, cookies
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1">📊 Usage Data</div>
                    <p className="text-xs text-foreground/70">
                      Activity logs, analytics data
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1">💬 Communications</div>
                    <p className="text-xs text-foreground/70">
                      Support tickets, chat history
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1">🎁 Referral Data</div>
                    <p className="text-xs text-foreground/70">
                      Referral codes, rewards history
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1">📱 Device Data</div>
                    <p className="text-xs text-foreground/70">
                      Push tokens, device identifiers
                    </p>
                  </div>
                </div>
              </div>

              {/* What Must Be Retained */}
              <div className="bg-yellow/30 rounded-xl p-4 sm:p-6 border-2 border-secondary/30 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl">⚠️</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase mb-2">
                      DATA WE MUST RETAIN
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-foreground/80 mb-3">
                      Some data must be kept for legal and operational reasons:
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-foreground/10">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🧾</span>
                      <div>
                        <div className="font-black text-sm mb-1">Transaction Records</div>
                        <p className="text-xs text-foreground/70">
                          Purchase history, invoices, and payment records are required by tax
                          and financial regulations. Retained for 7 years as per legal
                          requirements.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-foreground/10">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📲</span>
                      <div>
                        <div className="font-black text-sm mb-1">Active eSIM Orders</div>
                        <p className="text-xs text-foreground/70">
                          Technical data for active eSIMs must be retained until expiry to
                          ensure service continuity and support.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-foreground/10">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🛡️</span>
                      <div>
                        <div className="font-black text-sm mb-1">Fraud Prevention Data</div>
                        <p className="text-xs text-foreground/70">
                          Data used for security, fraud detection, and account protection may
                          be retained as required by law.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-foreground/10">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">⚖️</span>
                      <div>
                        <div className="font-black text-sm mb-1">Legal Obligations</div>
                        <p className="text-xs text-foreground/70">
                          Data required for ongoing legal proceedings, disputes, or regulatory
                          compliance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Process Timeline */}
              <div className="bg-purple/20 rounded-xl p-4 sm:p-6 border-2 border-accent/20 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl">⏰</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase mb-2">
                      DELETION TIMELINE
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-black text-sm sm:text-base mb-1">
                        Request Received (Day 0)
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/70">
                        We acknowledge your request within 24-48 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-cyan text-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
                      2
                    </div>
                    <div>
                      <div className="font-black text-sm sm:text-base mb-1">
                        Identity Verification (1-2 days)
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/70">
                        We verify your identity to protect your data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-yellow text-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
                      3
                    </div>
                    <div>
                      <div className="font-black text-sm sm:text-base mb-1">
                        Data Deletion (Up to 30 days)
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/70">
                        We delete the requested data from our systems
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
                      4
                    </div>
                    <div>
                      <div className="font-black text-sm sm:text-base mb-1">
                        Confirmation Sent
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/70">
                        You receive confirmation once deletion is complete
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                <a href="mailto:support@getlumbus.com?subject=Data Deletion Request">
                  <Button className="btn-lumbus bg-primary text-foreground hover:bg-primary/90 hover:scale-105 transition-all font-black py-4 sm:py-5 px-6 sm:px-8 text-base sm:text-lg border-4 border-foreground shadow-xl">
                    📧 EMAIL DATA DELETION REQUEST
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Additional Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <Card className="bg-mint border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-4 pb-4 px-3 sm:px-4">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">🗑️</div>
                  <h3 className="text-sm sm:text-base font-black uppercase mb-2">
                    Delete Entire Account
                  </h3>
                  <p className="text-xs font-bold text-foreground/70 mb-3">
                    Want to close your account completely?
                  </p>
                  <a href="/delete-account">
                    <Button className="btn-lumbus bg-destructive text-white hover:bg-destructive/90 font-black text-xs sm:text-sm py-2 px-4 border-2 border-foreground">
                      DELETE ACCOUNT
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan/30 border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-4 pb-4 px-3 sm:px-4">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">📄</div>
                  <h3 className="text-sm sm:text-base font-black uppercase mb-2">
                    Privacy Policy
                  </h3>
                  <p className="text-xs font-bold text-foreground/70 mb-3">
                    Learn how we handle your data
                  </p>
                  <a href="/privacy">
                    <Button className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-xs sm:text-sm py-2 px-4 border-2 border-foreground">
                      READ POLICY
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">
              Questions about data deletion?{' '}
              <a
                href="mailto:support@getlumbus.com"
                className="text-primary hover:text-primary/80 font-black underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
