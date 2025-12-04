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
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
            <span className="px-4 py-2 rounded-full bg-yellow border-2 border-foreground font-black uppercase text-xs tracking-widest flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              REFER & EARN
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
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center font-black text-white text-sm mb-1">1</div>
            <div className="text-xs font-black uppercase">SHARE LINK</div>
          </div>
          <div className="bg-cyan p-3 rounded-xl border-2 border-primary/20">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center font-black text-white text-sm mb-1">2</div>
            <div className="text-xs font-black uppercase">FRIEND BUYS</div>
          </div>
          <div className="bg-yellow p-3 rounded-xl border-2 border-secondary/20">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center font-black text-white text-sm mb-1">3</div>
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
              className="bg-foreground hover:bg-foreground/90 text-white font-black py-3 text-xs rounded-xl border-2 border-foreground flex items-center justify-center gap-1"
              aria-label={copied ? "Link copied" : "Copy referral link"}
            >
              {copied ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> COPIED</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> COPY</>}
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
          className="w-full bg-primary text-foreground hover:bg-primary/90 hover:scale-105 transition-all font-black py-4 text-lg rounded-xl border-4 border-foreground shadow-xl flex items-center justify-center gap-2"
        >
          {copied ? <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> LINK COPIED!</> : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> COPY & SHARE NOW</>}
        </Button>

        {/* Bottom Info */}
        {stats.total_referrals === 0 && (
          <div className="text-center pt-2">
            <p className="text-xs font-bold text-foreground/70 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Share your link and earn your first GB today!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
