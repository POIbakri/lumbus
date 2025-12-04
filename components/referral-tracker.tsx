'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { authenticatedGet } from '@/lib/api-client';

interface ReferralStats {
  total_referrals: number;
  earned_rewards: number;
  pending_rewards: number;
}

interface ReferralTrackerProps {
  /** Compact mode (smaller display) */
  compact?: boolean;
  /** Show milestone badge */
  showBadge?: boolean;
}

/**
 * Referral Tracker Component
 *
 * Small widget showing:
 * - Real-time referral count
 * - Data earned
 * - Next milestone
 * - Can be embedded anywhere
 */
export function ReferralTracker({ compact = false, showBadge = true }: ReferralTrackerProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await authenticatedGet<{
        stats: {
          total_signups: number;
          pending_rewards: number;
          earned_rewards: number;
        };
      }>('/api/referrals/me');

      setStats({
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

  // Don't show if user not logged in or loading
  if (!user || loading || !stats) return null;

  // Calculate milestone
  const getMilestone = (referrals: number) => {
    if (referrals >= 25) return { badge: '💎 PLATINUM', next: null, color: 'bg-gradient-to-r from-cyan to-primary' };
    if (referrals >= 10) return { badge: '🥇 GOLD', next: 25, color: 'bg-yellow' };
    if (referrals >= 5) return { badge: '🥈 SILVER', next: 10, color: 'bg-gray-300' };
    if (referrals >= 1) return { badge: '🥉 BRONZE', next: 5, color: 'bg-orange-400' };
    return { badge: '⭐ STARTER', next: 1, color: 'bg-purple' };
  };

  const milestone = getMilestone(stats.total_referrals);
  const totalDataGB = (stats.earned_rewards + stats.pending_rewards) / 1024;
  const referralsToNext = milestone.next ? milestone.next - stats.total_referrals : 0;

  // Compact mode
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-yellow via-cyan to-purple border-2 border-foreground/20 shadow-lg">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black uppercase">
          <span className="text-foreground">{stats.total_referrals} Referrals</span>
          <span className="text-foreground/40">•</span>
          <span className="text-primary">{totalDataGB.toFixed(1)}GB Earned</span>
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-gradient-to-br from-mint to-cyan border-2 sm:border-3 border-primary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground">
          Your Rewards
        </h3>
        {showBadge && (
          <Badge className={`${milestone.color} text-foreground font-black text-xs sm:text-sm px-3 py-1 border-2 border-foreground/20`}>
            {milestone.badge}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-primary/10 text-center">
          <div className="text-2xl sm:text-3xl font-black text-primary mb-1">
            {stats.total_referrals}
          </div>
          <div className="text-xs font-black uppercase text-muted-foreground">
            Referrals
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-primary/10 text-center">
          <div className="text-2xl sm:text-3xl font-black text-primary mb-1">
            {totalDataGB.toFixed(1)}
          </div>
          <div className="text-xs font-black uppercase text-muted-foreground">
            GB Earned
          </div>
        </div>
      </div>

      {/* Next Milestone */}
      {milestone.next && (
        <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-foreground/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-muted-foreground">
              Next Milestone
            </span>
            <span className="text-xs sm:text-sm font-black text-primary">
              {referralsToNext} more!
            </span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden border border-foreground/20">
            <div
              className="h-full bg-gradient-to-r from-primary to-cyan transition-all duration-500"
              style={{
                width: `${Math.min(((stats.total_referrals / milestone.next) * 100), 100)}%`,
              }}
            />
          </div>
          <p className="text-xs font-bold text-foreground/60 mt-2 text-center">
            {referralsToNext === 1
              ? '1 more referral to unlock next badge!'
              : `${referralsToNext} more referrals to unlock next badge!`}
          </p>
        </div>
      )}

      {/* Value Statement */}
      <div className="mt-4 p-3 bg-gradient-to-r from-primary to-cyan rounded-lg border-2 border-foreground/20 text-center">
        <p className="text-xs sm:text-sm font-black uppercase text-foreground">
          {stats.total_referrals === 0
            ? '🚀 START EARNING FREE DATA TODAY!'
            : `💰 YOUR REWARDS = $${(totalDataGB * 5).toFixed(2)} VALUE!`}
        </p>
      </div>
    </div>
  );
}
