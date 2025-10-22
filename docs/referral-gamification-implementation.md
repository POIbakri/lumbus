# Referral Gamification Implementation Guide

**Status:** Not Implemented (UI commented out in `app/page.tsx:437-516`)

## Overview

This document outlines the implementation requirements for the referral program gamification features that are currently displayed as static data on the homepage.

## Current State

### What's Commented Out
- 🌟 Community Stats (Total GB earned by all users)
- 🏆 Leaderboard (Top referrers)
- 💎 Badges System (Bronze/Silver/Gold/Platinum)
- 🎯 Milestones Tracking (1/5/10/25 friends)

### What Already Works
- ✅ Basic referral system (user gets referral code)
- ✅ Referral tracking (`referral_rewards` table)
- ✅ Data wallet system (`user_data_wallet`)
- ✅ Individual referral stats API (`/api/referrals/me`)

## Implementation Requirements

### 1. Database Schema Changes

#### A. Create `user_badges` table
```sql
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  referrals_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_type ON public.user_badges(badge_type);
```

#### B. Create `referral_milestones` table
```sql
CREATE TABLE IF NOT EXISTS public.referral_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('FIRST_REFERRAL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  milestone_value INTEGER NOT NULL, -- Number of referrals to unlock
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_type)
);

CREATE INDEX idx_milestones_user_achieved ON public.referral_milestones(user_id, achieved);
```

#### C. Create `referral_leaderboard` materialized view
```sql
CREATE MATERIALIZED VIEW public.referral_leaderboard AS
SELECT
  up.user_id,
  up.ref_code,
  COUNT(DISTINCT rr.referred_user_id) as total_referrals,
  SUM(rr.reward_value) as total_rewards_mb,
  MAX(rr.created_at) as last_referral_at,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT rr.referred_user_id) DESC) as rank
FROM public.user_profiles up
LEFT JOIN public.referral_rewards rr ON rr.referrer_user_id = up.user_id
WHERE rr.status = 'APPLIED'
GROUP BY up.user_id, up.ref_code
ORDER BY total_referrals DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_leaderboard_user ON public.referral_leaderboard(user_id);
CREATE INDEX idx_leaderboard_rank ON public.referral_leaderboard(rank);

-- Refresh function (call via cron)
CREATE OR REPLACE FUNCTION refresh_referral_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.referral_leaderboard;
END;
$$ LANGUAGE plpgsql;
```

### 2. Backend API Endpoints

#### A. Community Stats API
**Endpoint:** `GET /api/referrals/stats/community`

Returns aggregate statistics for all users.

```typescript
// app/api/referrals/stats/community/route.ts
export async function GET(req: NextRequest) {
  // Query total GB earned by community
  const { data: stats } = await supabase
    .rpc('get_community_stats');

  return NextResponse.json({
    totalGBEarned: stats.total_gb,
    totalReferrals: stats.total_referrals,
    activeUsers: stats.active_users,
  });
}
```

**SQL Function:**
```sql
CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS TABLE (
  total_gb NUMERIC,
  total_referrals BIGINT,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(SUM(reward_value)::NUMERIC / 1024, 1) as total_gb,
    COUNT(DISTINCT referrer_user_id) as total_referrals,
    COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN referrer_user_id END) as active_users
  FROM public.referral_rewards
  WHERE status = 'APPLIED';
END;
$$ LANGUAGE plpgsql;
```

#### B. Leaderboard API
**Endpoint:** `GET /api/referrals/leaderboard?limit=10`

Returns top referrers.

```typescript
// app/api/referrals/leaderboard/route.ts
export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

  const { data: leaderboard } = await supabase
    .from('referral_leaderboard')
    .select('*')
    .order('rank', { ascending: true })
    .limit(limit);

  return NextResponse.json({ leaderboard });
}
```

#### C. User Badges API
**Endpoint:** `GET /api/referrals/badges/:userId`

Returns user's earned badges and progress.

```typescript
// app/api/referrals/badges/[userId]/route.ts
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;

  // Get user's badges
  const { data: badges } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  // Get milestone progress
  const { data: milestones } = await supabase
    .from('referral_milestones')
    .select('*')
    .eq('user_id', userId);

  // Get current referral count
  const { count } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', userId)
    .eq('status', 'APPLIED');

  return NextResponse.json({
    badges,
    milestones,
    currentReferrals: count,
    nextMilestone: calculateNextMilestone(count),
  });
}
```

### 3. Backend Logic - Badge/Milestone Triggers

Add to referral reward processing (in `/api/stripe/webhook/route.ts` or commission processor):

```typescript
async function checkAndAwardBadges(userId: string, totalReferrals: number) {
  // Badge thresholds
  const badges = [
    { type: 'BRONZE', threshold: 1 },
    { type: 'SILVER', threshold: 5 },
    { type: 'GOLD', threshold: 10 },
    { type: 'PLATINUM', threshold: 25 },
  ];

  for (const badge of badges) {
    if (totalReferrals >= badge.threshold) {
      // Check if already awarded
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', badge.type)
        .single();

      if (!existing) {
        // Award badge
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_type: badge.type,
          referrals_count: totalReferrals,
        });

        // Send congratulations email
        await sendBadgeAwardEmail(userId, badge.type);
      }
    }
  }

  // Update milestones
  await updateMilestones(userId, totalReferrals);
}
```

### 4. Frontend Components

#### A. Community Stats Component
```typescript
// components/referral-community-stats.tsx
'use client';

export function ReferralCommunityStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/referrals/stats/community')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="bg-gradient-to-br from-mint to-cyan p-6 rounded-2xl">
      <div className="text-5xl mb-2">🌟</div>
      <div className="text-4xl font-black text-primary mb-2">
        {stats.totalGBEarned}
      </div>
      <div className="text-sm font-black uppercase">
        GB Earned By Community
      </div>
    </div>
  );
}
```

#### B. Leaderboard Component
```typescript
// components/referral-leaderboard.tsx
'use client';

export function ReferralLeaderboard({ limit = 3 }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch(`/api/referrals/leaderboard?limit=${limit}`)
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard));
  }, [limit]);

  return (
    <div className="bg-gradient-to-br from-yellow to-orange-300 p-6 rounded-2xl">
      <div className="text-5xl mb-2">🏆</div>
      <div className="text-2xl font-black mb-2">TOP REFERRER</div>
      {leaderboard[0] && (
        <div className="text-sm font-bold">
          {leaderboard[0].ref_code} - {leaderboard[0].total_referrals} Referrals
        </div>
      )}
    </div>
  );
}
```

#### C. User Badges Component
```typescript
// components/user-badges.tsx
'use client';

export function UserBadges({ userId }: { userId: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/referrals/badges/${userId}`)
      .then(res => res.json())
      .then(setData);
  }, [userId]);

  if (!data) return <div>Loading...</div>;

  const badgeIcons = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((badge) => {
        const earned = data.badges.find(b => b.badge_type === badge);
        return (
          <div
            key={badge}
            className={`p-4 rounded-xl text-center ${earned ? 'bg-primary' : 'bg-gray-200 opacity-50'}`}
          >
            <div className="text-3xl">{badgeIcons[badge]}</div>
            <div className="text-xs font-black mt-2">{badge}</div>
            {earned && <div className="text-xs">Earned!</div>}
          </div>
        );
      })}
    </div>
  );
}
```

### 5. Dashboard Integration

Add to `/app/dashboard/page.tsx`:

```typescript
import { ReferralCommunityStats } from '@/components/referral-community-stats';
import { ReferralLeaderboard } from '@/components/referral-leaderboard';
import { UserBadges } from '@/components/user-badges';

// In dashboard render:
<section>
  <h2>Your Referral Progress</h2>
  <UserBadges userId={user.id} />

  <h3>Community Impact</h3>
  <ReferralCommunityStats />

  <h3>Top Referrers</h3>
  <ReferralLeaderboard limit={5} />
</section>
```

### 6. Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-usage",
      "schedule": "0 */3 * * *"
    },
    {
      "path": "/api/cron/expire-orders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/refresh-leaderboard",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Create leaderboard refresh endpoint:

```typescript
// app/api/cron/refresh-leaderboard/route.ts
export async function GET(req: NextRequest) {
  await supabase.rpc('refresh_referral_leaderboard');
  return NextResponse.json({ success: true });
}
```

## Implementation Order

1. **Phase 1: Database** (30 min)
   - Create tables and views
   - Add SQL functions
   - Test with sample data

2. **Phase 2: Backend APIs** (1 hour)
   - Implement community stats API
   - Implement leaderboard API
   - Implement badges API
   - Add badge/milestone triggers to referral processing

3. **Phase 3: Frontend Components** (1 hour)
   - Build community stats component
   - Build leaderboard component
   - Build badges component
   - Add loading states and error handling

4. **Phase 4: Dashboard Integration** (30 min)
   - Add components to dashboard
   - Test user flows
   - Verify real-time updates

5. **Phase 5: Homepage** (15 min)
   - Uncomment gamification section in `app/page.tsx`
   - Replace static data with components
   - Test on production

## Testing Checklist

- [ ] Community stats show real data
- [ ] Leaderboard updates correctly
- [ ] Badges are awarded automatically
- [ ] Milestones trigger at correct thresholds
- [ ] Dashboard shows user's badges
- [ ] Email notifications sent on badge unlock
- [ ] Cron job refreshes leaderboard every 6 hours
- [ ] Mobile responsive design works

## Estimated Time

**Total: ~3 hours**

## Priority

**Medium** - This is a nice-to-have feature that improves engagement but is not critical for core functionality.

## Notes

- Keep badge thresholds flexible (store in `system_config` table)
- Consider rate limiting leaderboard API (public endpoint)
- Add privacy option for users to hide from leaderboard
- Track badge unlock events for analytics
- Send push notifications on mobile for milestone achievements
