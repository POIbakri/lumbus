'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { triggerHaptic } from '@/lib/device-detection';
import { authenticatedGet } from '@/lib/api-client';
import Image from 'next/image';

interface ReferralShareModalProps {
  userId: string;
  onClose: () => void;
}

export function ReferralShareModal({ userId, onClose }: ReferralShareModalProps) {
  const [referralLink, setReferralLink] = useState<string>('');
  const [refCode, setRefCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  const loadReferralInfo = useCallback(async () => {
    try {
      const data = await authenticatedGet<{
        referral_link: string;
        ref_code: string;
      }>('/api/referrals/me');
      setReferralLink(data.referral_link);
      setRefCode(data.ref_code);
    } catch (error) {
      console.error('Failed to load referral info:', error);
      setError(error instanceof Error ? error.message : 'Failed to load referral information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralInfo();
  }, [loadReferralInfo]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      triggerHaptic('light');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `I just got my eSIM from Lumbus! Get 10% off your first order with my link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    triggerHaptic('medium');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `Just got my eSIM from @LumbusTravel! Stay connected in 150+ countries. Get 10% off:`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`,
      '_blank'
    );
    triggerHaptic('medium');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Get 10% off Lumbus eSIM');
    const body = encodeURIComponent(
      `Hey!\n\nI just got my eSIM from Lumbus and it's been great for travel connectivity. Thought you might like it too!\n\nUse my referral link to get 10% off your first eSIM:\n${referralLink}\n\nStay connected in 150+ countries without roaming fees!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    triggerHaptic('medium');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-6">
        <Card className="max-w-[95vw] sm:max-w-md md:max-w-lg w-full">
          <CardContent className="pt-4 sm:pt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mb-3 sm:mb-4"></div>
            <p className="font-bold text-sm sm:text-base">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-6">
        <Card className="max-w-[95vw] sm:max-w-md md:max-w-lg w-full">
          <CardContent className="pt-4 sm:pt-6 text-center">
            <div className="mb-3 sm:mb-4 flex justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase mb-2 sm:mb-3">Oops!</h3>
            <p className="text-destructive mb-4 sm:mb-6 font-bold text-sm sm:text-base">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => {
                  setError('');
                  setLoading(true);
                  loadReferralInfo();
                }}
                className="flex-1 btn-lumbus bg-primary text-white font-black text-sm sm:text-base py-3"
              >
                TRY AGAIN
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 btn-lumbus bg-foreground/20 text-foreground font-black text-sm sm:text-base py-3"
              >
                CLOSE
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-6">
      <Card className="max-w-[95vw] sm:max-w-md md:max-w-lg w-full bg-purple border-2 sm:border-3 md:border-4 border-accent shadow-2xl max-h-[95vh] overflow-y-auto">
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-xl sm:text-2xl font-black hover:opacity-70 transition-opacity z-10"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="mb-3 sm:mb-4 animate-bounce flex justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-2 sm:mb-3 leading-tight">SHARE & EARN!</h2>
            <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/80 leading-relaxed px-2">
              Your friends get 10% off. You get 1GB of free data when they make their first purchase!
            </p>
          </div>

          {/* Referral Code Display */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="text-center mb-3">
              <p className="font-black uppercase text-xs sm:text-sm text-muted-foreground mb-2">
                Your Referral Code
              </p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-wider break-all">
                {refCode}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 px-2 sm:px-3 py-2 bg-mint rounded-lg font-mono text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {referralLink}
              </div>
              <Button
                onClick={copyLink}
                className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base py-2 sm:py-2.5 shrink-0 flex items-center gap-1"
              >
                {copied ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> COPIED</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> COPY LINK</>}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <Button
              onClick={shareViaWhatsApp}
              className="w-full btn-lumbus bg-[#25D366] text-white hover:bg-[#128C7E] font-black text-sm sm:text-base py-3 sm:py-4 flex items-center justify-center gap-2 rounded-lg sm:rounded-xl"
            >
              <Image src="/whatsapp-logo.svg" alt="WhatsApp" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden xs:inline">SHARE ON WHATSAPP</span>
              <span className="xs:hidden">WHATSAPP</span>
            </Button>
            <Button
              onClick={shareViaTwitter}
              className="w-full btn-lumbus bg-[#1DA1F2] text-white hover:bg-[#0d8bd9] font-black text-sm sm:text-base py-3 sm:py-4 flex items-center justify-center gap-2 rounded-lg sm:rounded-xl"
            >
              <Image src="/twitter-logo.svg" alt="Twitter" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden xs:inline">SHARE ON TWITTER</span>
              <span className="xs:hidden">TWITTER</span>
            </Button>
            <Button
              onClick={shareViaEmail}
              className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base py-3 sm:py-4 flex items-center justify-center gap-2 rounded-lg sm:rounded-xl"
            >
              <Image src="/email-logo.svg" alt="Email" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden xs:inline">SHARE VIA EMAIL</span>
              <span className="xs:hidden">EMAIL</span>
            </Button>
          </div>

          {/* Skip Button */}
          <Button
            onClick={onClose}
            className="w-full bg-transparent border-2 border-foreground/20 hover:bg-foreground/5 font-black text-foreground/60 text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl"
          >
            MAYBE LATER
          </Button>

          {/* Info */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow/90 rounded-lg sm:rounded-xl">
            <p className="text-xs sm:text-sm font-bold text-center leading-relaxed">
              You can always find your referral link in your dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
