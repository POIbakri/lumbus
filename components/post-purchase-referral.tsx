'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { triggerHaptic } from '@/lib/device-detection';
import Image from 'next/image';

interface PostPurchaseReferralProps {
  /** User's referral link (if they have an account) */
  referralLink?: string;
  /** User's referral code */
  referralCode?: string;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Show modal */
  show: boolean;
}

/**
 * Post-Purchase Referral Modal
 *
 * Triggers IMMEDIATELY after successful purchase showing:
 * - Celebration message
 * - "Want to earn FREE data?" CTA
 * - Pre-populated share messages for WhatsApp/Twitter/Email
 * - User's referral link
 * - Big, bold CTAs with skip option
 */
export function PostPurchaseReferral({
  referralLink,
  referralCode,
  onClose,
  show,
}: PostPurchaseReferralProps) {
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    if (show) {
      // Trigger haptic feedback on show
      triggerHaptic('heavy');

      // Hide confetti after animation
      const timer = setTimeout(() => setConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  const copyLink = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      triggerHaptic('light');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Silent fail
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      referralLink
        ? `I just got my eSIM from Lumbus - it's amazing! Get 10% off your first order with my link: ${referralLink}`
        : `I just got my eSIM from Lumbus - it's amazing! Get connected in 150+ countries. Check it out: https://getlumbus.com`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    triggerHaptic('medium');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      referralLink
        ? `Just purchased my @LumbusTravel eSIM! Get 10% off and stay connected in 150+ countries:`
        : `Just purchased my @LumbusTravel eSIM! Stay connected in 150+ countries without roaming fees!`
    );
    const url = referralLink || 'https://getlumbus.com';
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
    triggerHaptic('medium');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Check out Lumbus eSIM!');
    const body = encodeURIComponent(
      referralLink
        ? `Hey!\n\nI just purchased an eSIM from Lumbus and thought you might like it too!\n\nUse my referral link to get 10% off your first order:\n${referralLink}\n\nStay connected in 150+ countries without expensive roaming fees!\n\nCheers!`
        : `Hey!\n\nI just purchased an eSIM from Lumbus and thought you might like it too!\n\nCheck it out at: https://getlumbus.com\n\nStay connected in 150+ countries without expensive roaming fees!\n\nCheers!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    triggerHaptic('medium');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Confetti Effect */}
      {confetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <svg className={`w-6 h-6 ${['text-primary', 'text-yellow', 'text-cyan', 'text-purple'][Math.floor(Math.random() * 4)]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
            </div>
          ))}
        </div>
      )}

      <Card className="max-w-2xl w-full bg-gradient-to-br from-yellow via-cyan to-purple border-4 border-foreground shadow-2xl animate-scale-in">
        <CardContent className="pt-6 px-6 pb-6">
          {/* Header - Celebration */}
          <div className="text-center mb-8 animate-bounce">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-3 text-foreground leading-tight">
              PURCHASE COMPLETE!
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-foreground/80">
              Check your email for activation details
            </p>
          </div>

          {/* Main CTA */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-6 border-4 border-foreground/20">
            <div className="text-center mb-6">
              <div className="mb-3 flex justify-center">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase mb-2 text-foreground">
                WANT TO EARN FREE DATA?
              </h3>
              <p className="text-lg font-bold text-foreground/70 mb-1">
                Share Lumbus with friends and family!
              </p>
              <div className="inline-block bg-gradient-to-r from-primary to-cyan px-6 py-3 rounded-xl mt-4 border-2 border-foreground/20">
                <p className="text-xl font-black uppercase text-foreground flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  REFER 3 FRIENDS = 3GB FREE!
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-mint p-4 rounded-xl border-2 border-primary/20">
                <div className="mb-2">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                </div>
                <p className="font-black text-sm uppercase mb-1">THEY GET</p>
                <p className="font-bold text-foreground/70 text-sm">
                  10% off their first eSIM
                </p>
              </div>
              <div className="bg-yellow p-4 rounded-xl border-2 border-secondary/20">
                <div className="mb-2">
                  <svg className="w-8 h-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                </div>
                <p className="font-black text-sm uppercase mb-1">YOU GET</p>
                <p className="font-bold text-foreground/70 text-sm">
                  1GB free data per referral
                </p>
              </div>
            </div>

            {/* Referral Link (if available) */}
            {referralLink && referralCode && (
              <div className="bg-gradient-to-r from-primary/10 to-cyan/10 p-4 rounded-xl border-2 border-primary/30 mb-6">
                <p className="text-xs font-black uppercase text-muted-foreground mb-3 text-center">
                  YOUR REFERRAL CODE
                </p>
                <div className="text-center mb-3">
                  <div className="text-4xl font-black text-primary tracking-wider">
                    {referralCode}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-white rounded-lg font-mono text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap border-2 border-foreground/10">
                    {referralLink}
                  </div>
                  <Button
                    onClick={copyLink}
                    className="bg-foreground text-white hover:bg-foreground/90 font-black px-4 flex items-center gap-1"
                  >
                    {copied ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> COPIED</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> COPY</>}
                  </Button>
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-black uppercase text-center text-muted-foreground">
                SHARE NOW & START EARNING
              </p>
              <Button
                onClick={shareViaWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-5 text-base sm:text-lg flex items-center justify-center gap-3 border-2 border-foreground/20 shadow-xl"
              >
                <Image src="/whatsapp-logo.svg" alt="WhatsApp" width={24} height={24} className="w-6 h-6" />
                SHARE ON WHATSAPP
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareViaTwitter}
                  className="w-full bg-[#1DA1F2] hover:bg-[#0d8bd9] text-white font-black py-4 text-sm sm:text-base flex items-center justify-center gap-2 border-2 border-foreground/20 shadow-xl"
                >
                  <Image src="/twitter-logo.svg" alt="Twitter" width={20} height={20} className="w-5 h-5" />
                  TWITTER
                </Button>
                <Button
                  onClick={shareViaEmail}
                  className="w-full bg-foreground hover:bg-foreground/90 text-white font-black py-4 text-sm sm:text-base flex items-center justify-center gap-2 border-2 border-foreground/20 shadow-xl"
                >
                  <Image src="/email-logo.svg" alt="Email" width={20} height={20} className="w-5 h-5" />
                  EMAIL
                </Button>
              </div>
            </div>
          </div>

          {/* Skip Button */}
          <div className="space-y-3">
            <Button
              onClick={onClose}
              className="w-full bg-transparent border-2 border-foreground/30 hover:bg-foreground/10 font-bold text-foreground/60 py-4 text-sm"
            >
              Skip for now
            </Button>
            <p className="text-xs text-center font-bold text-foreground/60">
              You can always find your referral link in your dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
          font-size: 2rem;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
