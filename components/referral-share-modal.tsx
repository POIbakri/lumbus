'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { triggerHaptic } from '@/lib/device-detection';

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

  useEffect(() => {
    loadReferralInfo();
  }, [userId]);

  const loadReferralInfo = async () => {
    try {
      const response = await fetch(`/api/referrals/me?user_id=${userId}`);
      if (!response.ok) {
        setError('Failed to load referral information. Please try again.');
        return;
      }
      const data = await response.json();
      setReferralLink(data.referral_link);
      setRefCode(data.ref_code);
    } catch (error) {
      console.error('Failed to load referral info:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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
      `Just got my eSIM from @LumbusTravel! Stay connected in 190+ countries. Get 10% off:`
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
      `Hey!\n\nI just got my eSIM from Lumbus and it's been great for travel connectivity. Thought you might like it too!\n\nUse my referral link to get 10% off your first eSIM:\n${referralLink}\n\nStay connected in 190+ countries without roaming fees!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    triggerHaptic('medium');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="font-bold">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="heading-sm mb-3">Oops!</h3>
            <p className="text-destructive mb-6 font-bold">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setError('');
                  setLoading(true);
                  loadReferralInfo();
                }}
                className="flex-1 btn-lumbus bg-primary text-white font-black"
              >
                TRY AGAIN
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 btn-lumbus bg-foreground/20 text-foreground font-black"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="max-w-lg w-full bg-purple border-4 border-accent shadow-2xl animate-scale-in">
        <CardContent className="pt-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-2xl font-black hover:scale-110 transition-transform"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce-slow">🎁</div>
            <h2 className="heading-md mb-3">SHARE & EARN!</h2>
            <p className="text-lg font-bold text-foreground/80">
              Your friends get 10% off. You get 1GB of free data when they make their first purchase!
            </p>
          </div>

          {/* Referral Code Display */}
          <div className="bg-white rounded-xl p-4 mb-6">
            <div className="text-center mb-3">
              <p className="font-black uppercase text-xs text-muted-foreground mb-2">
                Your Referral Code
              </p>
              <p className="text-4xl font-black text-primary tracking-wider">
                {refCode}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-mint rounded-lg font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                {referralLink}
              </div>
              <Button
                onClick={copyLink}
                className="btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black touch-ripple"
              >
                {copied ? '✓' : 'COPY'}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={shareViaWhatsApp}
              className="w-full btn-lumbus bg-[#25D366] text-white hover:bg-[#128C7E] font-black py-4 touch-ripple flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span> SHARE ON WHATSAPP
            </Button>
            <Button
              onClick={shareViaTwitter}
              className="w-full btn-lumbus bg-[#1DA1F2] text-white hover:bg-[#0d8bd9] font-black py-4 touch-ripple flex items-center justify-center gap-2"
            >
              <span className="text-xl">🐦</span> SHARE ON TWITTER
            </Button>
            <Button
              onClick={shareViaEmail}
              className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black py-4 touch-ripple flex items-center justify-center gap-2"
            >
              <span className="text-xl">✉️</span> SHARE VIA EMAIL
            </Button>
          </div>

          {/* Skip Button */}
          <Button
            onClick={onClose}
            className="w-full bg-transparent border-2 border-foreground/20 hover:bg-foreground/5 font-black text-foreground/60 py-3 touch-ripple"
          >
            MAYBE LATER
          </Button>

          {/* Info */}
          <div className="mt-6 p-4 bg-yellow rounded-xl">
            <p className="text-xs font-bold text-center">
              You can always find your referral link in your dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
