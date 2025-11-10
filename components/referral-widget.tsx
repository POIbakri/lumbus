'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/device-detection';
import { useAuth } from '@/lib/auth-context';
import { authenticatedGet } from '@/lib/api-client';
import Image from 'next/image';

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
 * Simple Referral Widget - Matches homepage design
 *
 * Features:
 * - Clean stats display
 * - Quick share buttons
 * - Mobile-responsive (collapses to FAB)
 * - Lumbus color palette
 */
export function ReferralWidget({ floating = false }: ReferralWidgetProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!floating);
  const [copied, setCopied] = useState(false);

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

  // Don't show if user not logged in
  if (!user || loading) return null;
  if (!stats) return null;

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
      <button
        onClick={() => {
          setExpanded(true);
          triggerHaptic('medium');
        }}
        className="fixed bottom-6 right-6 z-40 bg-primary text-foreground font-black px-6 py-4 rounded-full shadow-2xl border-4 border-foreground hover:scale-110 transition-transform flex items-center gap-2 animate-bounce"
        aria-label="Open referral rewards"
      >
        <span className="text-2xl">🎁</span>
        <span className="hidden sm:inline text-sm uppercase">EARN FREE DATA</span>
      </button>
    );
  }

  // Expanded widget mode
  return (
    <div
      className={`${
        floating
          ? 'fixed bottom-6 right-6 z-40 w-full max-w-md'
          : 'relative w-full'
      } bg-white border-4 border-foreground rounded-3xl shadow-2xl overflow-hidden`}
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

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block mb-3">
            <span className="px-4 py-2 rounded-full bg-yellow border-2 border-foreground font-black uppercase text-xs tracking-widest">
              🎁 REFER & EARN
            </span>
          </div>
          <h3 className="text-2xl font-black uppercase mb-2 text-foreground">GIVE 10% OFF<br/>GET 1GB FREE</h3>
          <p className="text-sm font-bold text-foreground/70">
            Share with friends, get rewarded
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-mint p-3 rounded-xl border-2 border-primary/20 text-center">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">
              Clicks
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats.total_clicks}
            </div>
          </div>
          <div className="bg-cyan p-3 rounded-xl border-2 border-primary/20 text-center">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">
              Referred
            </div>
            <div className="text-2xl font-black text-foreground">
              {stats.total_referrals}
            </div>
          </div>
          <div className="bg-yellow p-3 rounded-xl border-2 border-secondary/20 text-center">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">
              GB Earned
            </div>
            <div className="text-2xl font-black text-primary">
              {totalDataGB.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Pending Rewards */}
        {stats.pending_rewards > 0 && (
          <div className="bg-purple p-4 rounded-xl border-2 border-accent/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">⏳</span>
              <span className="font-black uppercase text-sm">Pending</span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {(stats.pending_rewards / 1024).toFixed(1)} GB
            </div>
            <p className="text-xs font-bold text-foreground/70 mt-1">
              Will be credited once orders complete
            </p>
          </div>
        )}

        {/* How It Works Steps */}
        <div className="grid grid-cols-3 gap-2 text-left">
          <div className="bg-mint p-3 rounded-xl border-2 border-primary/20">
            <div className="text-2xl mb-1">1️⃣</div>
            <div className="text-xs font-black uppercase">SHARE LINK</div>
          </div>
          <div className="bg-cyan p-3 rounded-xl border-2 border-primary/20">
            <div className="text-2xl mb-1">2️⃣</div>
            <div className="text-xs font-black uppercase">FRIEND BUYS</div>
          </div>
          <div className="bg-yellow p-3 rounded-xl border-2 border-secondary/20">
            <div className="text-2xl mb-1">3️⃣</div>
            <div className="text-xs font-black uppercase">GET 1GB</div>
          </div>
        </div>

        {/* Quick Share */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-center text-muted-foreground">
            QUICK SHARE
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={shareViaWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-3 text-xs rounded-xl border-2 border-foreground"
              aria-label="Share on WhatsApp"
            >
              <Image src="/whatsapp-logo.svg" alt="WhatsApp" width={16} height={16} className="w-4 h-4" />
            </Button>
            <Button
              onClick={shareViaTwitter}
              className="bg-[#1DA1F2] hover:bg-[#0d8bd9] text-white font-black py-3 text-xs rounded-xl border-2 border-foreground"
              aria-label="Share on Twitter"
            >
              <Image src="/twitter-logo.svg" alt="Twitter" width={16} height={16} className="w-4 h-4" />
            </Button>
            <Button
              onClick={copyLink}
              className="bg-foreground hover:bg-foreground/90 text-white font-black py-3 text-xs rounded-xl border-2 border-foreground"
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
          <div className="px-2 py-1 bg-white rounded-lg font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap border-2 border-foreground/10">
            {stats.referral_link}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={copyLink}
          className="w-full bg-primary text-foreground hover:bg-primary/90 hover:scale-105 transition-all font-black py-4 text-lg rounded-xl border-4 border-foreground shadow-xl"
        >
          {copied ? '✓ LINK COPIED!' : '🚀 COPY & SHARE NOW'}
        </Button>

        {/* Bottom Info */}
        {stats.total_referrals === 0 && (
          <div className="text-center pt-2">
            <p className="text-xs font-bold text-foreground/70">
              🚀 Share your link and earn your first GB today!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
