'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { triggerHaptic } from '@/lib/device-detection';
import { useAuth } from '@/lib/auth-context';
import { authenticatedGet } from '@/lib/api-client';

interface ReferralStats {
  ref_code: string;
  referral_link: string;
  total_clicks: number;
  total_referrals: number;
  pending_rewards: number;
  earned_rewards: number;
}

interface ReferralWidgetProps {
  /** If true, shows as a small FAB on mobile */
  floating?: boolean;
}

/**
 * Gamified Referral Widget - Uber/Airbnb-style prominent referral system
 *
 * Features:
 * - Progress bar towards next reward
 * - Animated GB counter
 * - Social proof notifications
 * - Quick share buttons
 * - Milestone badges (Bronze/Silver/Gold)
 * - Mobile-responsive (collapses to FAB)
 */
export function ReferralWidget({ floating = false }: ReferralWidgetProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!floating);
  const [copied, setCopied] = useState(false);
  const [showSocialProof, setShowSocialProof] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await authenticatedGet<{
        ref_code: string;
        referral_link: string;
        stats: {
          total_clicks: number;
          total_signups: number;
          pending_rewards: number;
          earned_rewards: number;
        };
      }>('/api/referrals/me');

      setStats({
        ref_code: data.ref_code,
        referral_link: data.referral_link,
        total_clicks: data.stats.total_clicks || 0,
        total_referrals: data.stats.total_signups || 0,
        pending_rewards: data.stats.pending_rewards || 0,
        earned_rewards: data.stats.earned_rewards || 0,
      });
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Show social proof animation periodically
  useEffect(() => {
    if (!stats || stats.total_referrals === 0) return;

    const interval = setInterval(() => {
      setShowSocialProof(true);
      setTimeout(() => setShowSocialProof(false), 4000);
    }, 15000); // Show every 15 seconds

    return () => clearInterval(interval);
  }, [stats]);

  // Don't show if user not logged in
  if (!user || loading) return null;
  if (!stats) return null;

  // Calculate milestone progress
  const getMilestone = (referrals: number) => {
    if (referrals >= 25) return { badge: '💎 PLATINUM', color: 'bg-gradient-to-r from-cyan to-primary', next: null };
    if (referrals >= 10) return { badge: '🥇 GOLD', color: 'bg-yellow', next: 25 };
    if (referrals >= 5) return { badge: '🥈 SILVER', color: 'bg-gray-300', next: 10 };
    if (referrals >= 1) return { badge: '🥉 BRONZE', color: 'bg-orange-400', next: 5 };
    return { badge: '⭐ STARTER', color: 'bg-purple', next: 1 };
  };

  const milestone = getMilestone(stats.total_referrals);
  const progressToNext = milestone.next
    ? (stats.total_referrals / milestone.next) * 100
    : 100;
  const referralsNeeded = milestone.next ? milestone.next - stats.total_referrals : 0;
  const totalDataGB = (stats.earned_rewards + stats.pending_rewards) / 1024;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      triggerHaptic('light');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Silent fail
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Get 10% off your first eSIM with Lumbus! Use my link: ${stats.referral_link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    triggerHaptic('medium');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `Get 10% off eSIMs with @LumbusTravel! Stay connected in 150+ countries:`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(stats.referral_link)}`,
      '_blank'
    );
    triggerHaptic('medium');
  };

  // Mobile FAB mode
  if (floating && !expanded) {
    return (
      <>
        {/* Floating Action Button */}
        <button
          onClick={() => {
            setExpanded(true);
            triggerHaptic('medium');
          }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary via-cyan to-yellow text-foreground font-black px-6 py-4 rounded-full shadow-2xl border-4 border-foreground hover:scale-110 transition-transform flex items-center gap-2 animate-bounce"
          aria-label="Open referral rewards"
        >
          <span className="text-2xl">🎁</span>
          <span className="hidden sm:inline text-sm uppercase">EARN FREE DATA</span>
        </button>

        {/* Social Proof Toast */}
        {showSocialProof && (
          <div className="fixed bottom-24 right-6 z-40 bg-yellow border-4 border-foreground text-foreground font-black px-4 py-3 rounded-xl shadow-2xl animate-slide-up text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <span>Someone just earned {totalDataGB.toFixed(1)}GB!</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // Expanded widget mode
  return (
    <div
      className={`${
        floating
          ? 'fixed bottom-6 right-6 z-40 w-full max-w-md'
          : 'relative w-full'
      } bg-gradient-to-br from-yellow via-cyan to-purple border-4 border-foreground rounded-2xl shadow-2xl overflow-hidden`}
    >
      {/* Close button (floating mode only) */}
      {floating && (
        <button
          onClick={() => setExpanded(false)}
          className="absolute top-4 right-4 z-10 text-2xl font-black hover:scale-110 transition-transform"
          aria-label="Minimize"
        >
          ✕
        </button>
      )}

      <div className="bg-white/95 backdrop-blur-sm p-6 space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h3 className="text-2xl font-black uppercase mb-1">EARN FREE DATA!</h3>
          <p className="text-sm font-bold text-muted-foreground">
            Share with friends, get rewarded
          </p>
        </div>

        {/* Milestone Badge */}
        <div className="flex justify-center">
          <Badge className={`${milestone.color} text-foreground font-black text-sm px-4 py-2 border-2 border-foreground`}>
            {milestone.badge}
          </Badge>
        </div>

        {/* Progress Bar */}
        {milestone.next && (
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-black uppercase">NEXT BADGE</span>
              <span className="text-xs font-black text-primary">
                {referralsNeeded} more {referralsNeeded === 1 ? 'referral' : 'referrals'}!
              </span>
            </div>
            <div className="w-full bg-foreground/10 rounded-full h-4 overflow-hidden border-2 border-foreground/20">
              <div
                className="h-full bg-gradient-to-r from-primary via-cyan to-yellow transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              >
                {progressToNext > 20 && (
                  <span className="text-xs font-black text-foreground">
                    {Math.round(progressToNext)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-mint p-3 rounded-xl border-2 border-primary/20 text-center">
            <div className="text-3xl font-black text-primary animate-pulse">
              {totalDataGB.toFixed(1)}
            </div>
            <div className="text-xs font-black uppercase text-muted-foreground">
              GB Earned
            </div>
          </div>
          <div className="bg-yellow p-3 rounded-xl border-2 border-secondary/20 text-center">
            <div className="text-3xl font-black text-foreground">
              {stats.total_referrals}
            </div>
            <div className="text-xs font-black uppercase text-muted-foreground">
              Friends Referred
            </div>
          </div>
        </div>

        {/* Value Prop */}
        <div className="bg-gradient-to-r from-primary to-cyan p-4 rounded-xl border-2 border-foreground/20 text-center">
          <p className="font-black text-sm uppercase text-foreground">
            {stats.total_referrals === 0
              ? '🚀 REFER 1 FRIEND = 1GB FREE!'
              : `💎 YOU'VE EARNED ${(totalDataGB * 5).toFixed(0)} IN VALUE!`}
          </p>
        </div>

        {/* Quick Share */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-center text-muted-foreground">
            QUICK SHARE
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={shareViaWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-3 text-xs"
              aria-label="Share on WhatsApp"
            >
              💬
            </Button>
            <Button
              onClick={shareViaTwitter}
              className="bg-[#1DA1F2] hover:bg-[#0d8bd9] text-white font-black py-3 text-xs"
              aria-label="Share on Twitter"
            >
              🐦
            </Button>
            <Button
              onClick={copyLink}
              className="bg-foreground hover:bg-foreground/90 text-white font-black py-3 text-xs"
              aria-label="Copy referral link"
            >
              {copied ? '✓' : '📋'}
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="p-3 bg-mint rounded-xl border-2 border-primary/20">
          <p className="text-xs font-black uppercase text-muted-foreground mb-2">
            YOUR LINK
          </p>
          <div className="flex gap-2">
            <div className="flex-1 px-2 py-1 bg-white rounded-lg font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap border border-foreground/10">
              {stats.referral_link}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={copyLink}
          className="w-full bg-gradient-to-r from-primary via-cyan to-yellow hover:scale-105 transition-transform text-foreground font-black py-4 text-lg border-2 border-foreground shadow-xl"
        >
          {copied ? '✓ LINK COPIED!' : '🚀 COPY & SHARE NOW'}
        </Button>
      </div>

      {/* Social Proof Banner */}
      {showSocialProof && (
        <div className="absolute top-0 left-0 right-0 bg-yellow border-b-4 border-foreground text-foreground font-black px-4 py-2 text-center text-sm animate-slide-down">
          🎉 Users have earned 1,234 GB this month!
        </div>
      )}
    </div>
  );
}
