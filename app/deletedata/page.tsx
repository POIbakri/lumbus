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
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
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
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
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
                        {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                      </Button>
                    </div>
                  </form>
                )}

                {success && (
                  <div className="bg-primary/20 rounded-xl p-6 border-2 border-primary text-center">
                    <div className="flex justify-center mb-3">
                      <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
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
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
                    <div className="font-black text-sm mb-1 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> Contact Information</div>
                    <p className="text-xs text-foreground/70">
                      Email address, phone number
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Account Preferences</div>
                    <p className="text-xs text-foreground/70">
                      Settings, notifications, cookies
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> Usage Data</div>
                    <p className="text-xs text-foreground/70">
                      Activity logs, analytics data
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> Communications</div>
                    <p className="text-xs text-foreground/70">
                      Support tickets, chat history
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> Referral Data</div>
                    <p className="text-xs text-foreground/70">
                      Referral codes, rewards history
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border-2 border-foreground/10">
                    <div className="font-black text-sm mb-1 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> Device Data</div>
                    <p className="text-xs text-foreground/70">
                      Push tokens, device identifiers
                    </p>
                  </div>
                </div>
              </div>

              {/* What Must Be Retained */}
              <div className="bg-yellow/30 rounded-xl p-4 sm:p-6 border-2 border-secondary/30 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
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
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
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
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
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
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
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
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>
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
                  <Button className="btn-lumbus bg-primary text-foreground hover:bg-primary/90 hover:scale-105 transition-all font-black py-4 sm:py-5 px-6 sm:px-8 text-base sm:text-lg border-4 border-foreground shadow-xl flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    EMAIL DATA DELETION REQUEST
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
                  <div className="flex justify-center mb-2">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </div>
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
