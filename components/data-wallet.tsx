'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Sparkles, Plus, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { authenticatedGet, authenticatedPost } from '@/lib/api-client';

interface WalletData {
  balance_mb: number;
  balance_gb: string;
  pending_rewards: Array<{
    id: string;
    reward_value: number;
    created_at: string;
    order_id: string;
    referrer_user_id: string;
    referred_user_id: string;
  }>;
  active_esims: Array<{
    id: string;
    plan_name: string;
    data_remaining_bytes: number;
    free_data_added_mb: number;
    created_at: string;
    expires_at: string | null;
  }>;
}

export function DataWallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [applyingData, setApplyingData] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<Record<string, number>>({});

  const fetchWalletData = async () => {
    try {
      const data = await authenticatedGet<WalletData>('/api/rewards/wallet');
      setWalletData(data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const redeemReward = async (rewardId: string) => {
    setRedeeming(rewardId);
    try {
      const result = await authenticatedPost<{
        success: boolean;
        message?: string;
        error?: string
      }>('/api/rewards/redeem', { rewardId });

      if (result.success) {
        // Show celebration animation
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);

        // Show success toast
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="font-black">1GB added to your data balance!</span>
          </div>
        );

        // Refresh wallet data
        await fetchWalletData();
      }
    } catch (error) {
      console.error('Redeem error:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setRedeeming(null);
    }
  };

  const applyDataToEsim = async (orderId: string) => {
    const amountMB = selectedAmount[orderId] || 1024; // Default 1GB

    if (!walletData || walletData.balance_mb < amountMB) {
      toast.error('Insufficient free data balance');
      return;
    }

    setApplyingData(orderId);
    try {
      const result = await authenticatedPost<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/api/rewards/apply-data', {
        orderId,
        amountMB,
      });

      if (result.success) {
        // Show success toast
        toast.success(
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-green-500" />
            <span className="font-black">{result.message}</span>
          </div>
        );

        // Refresh wallet data
        await fetchWalletData();

        // Reset selected amount
        setSelectedAmount(prev => ({ ...prev, [orderId]: 0 }));
      }
    } catch (error) {
      console.error('Apply data error:', error);
      const message = error instanceof Error ? error.message : 'Failed to apply data. Please try again.';
      toast.error(message);
    } finally {
      setApplyingData(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-2 sm:border-4 border-foreground shadow-xl rounded-2xl sm:rounded-3xl animate-pulse">
        <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!walletData) {
    return null;
  }

  const totalPendingMB = walletData.pending_rewards.reduce(
    (sum, reward) => sum + reward.reward_value,
    0
  );
  const totalPendingGB = (totalPendingMB / 1024).toFixed(1);
  const hasBalance = walletData.balance_mb > 0;
  const hasPendingRewards = walletData.pending_rewards.length > 0;
  const hasActiveEsims = walletData.active_esims?.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl sm:text-8xl animate-bounce">🎉</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl sm:text-7xl animate-ping">✨</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-2 sm:mb-3">
          📦 FREE DATA BALANCE
        </h2>
        <p className="text-xs sm:text-sm font-bold text-muted-foreground">
          First-time buyers get 1GB when using a referral code • Earn 1GB when someone uses yours!
        </p>
      </div>

      {/* Main Wallet Card */}
      <Card className="bg-white border-2 sm:border-4 border-foreground shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {/* Balance Section */}
          <div className="bg-gradient-to-r from-primary to-cyan p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Available Data */}
              <div className="text-center sm:text-left">
                <div className="font-black uppercase text-xs sm:text-sm text-foreground/70 mb-1 sm:mb-2">
                  Your Free Data
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">
                  {walletData.balance_gb} GB
                </div>
              </div>

              {/* Pending Rewards */}
              {hasPendingRewards && (
                <div className="text-center sm:text-left">
                  <div className="font-black uppercase text-xs sm:text-sm text-foreground/70 mb-1 sm:mb-2">
                    Unclaimed Rewards
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground">
                    {totalPendingGB} GB
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Pending Rewards */}
            {hasPendingRewards && (
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-2xl">🎁</span>
                  <h3 className="text-lg sm:text-xl font-black uppercase">
                    Claim Your Rewards
                  </h3>
                  <Badge className="bg-secondary text-foreground font-black uppercase text-xs px-2 sm:px-3 py-1">
                    {walletData.pending_rewards.length}
                  </Badge>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {walletData.pending_rewards.map((reward) => {
                    // Check if this is a reward for using a code (self-referral) or for referring someone
                    const isFromUsingCode = reward.referrer_user_id === reward.referred_user_id;

                    return (
                      <div
                        key={reward.id}
                        className="bg-mint border-2 sm:border-3 border-primary rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:scale-[1.01] transition-transform"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 sm:p-3 bg-yellow rounded-full flex-shrink-0">
                              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="font-black text-base sm:text-lg">
                                1GB Free Data
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-muted-foreground">
                                {isFromUsingCode ? 'Bonus for using referral code' : 'Earned from referral'}
                                {' • '}
                                {formatDistanceToNow(new Date(reward.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => redeemReward(reward.id)}
                            disabled={redeeming === reward.id}
                            className="w-full sm:w-auto bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg hover:scale-105 transition-transform"
                          >
                            {redeeming === reward.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                CLAIMING...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                CLAIM 1GB
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apply Data to Active eSIMs */}
            {hasBalance && hasActiveEsims && (
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-lg sm:text-xl font-black uppercase">
                    Add Free Data to Your eSIMs
                  </h3>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {walletData.active_esims.map((esim) => {
                    const dataRemainingGB = (esim.data_remaining_bytes / (1024 * 1024 * 1024)).toFixed(1);
                    const maxAvailableGB = Math.floor(walletData.balance_mb / 1024);
                    const freeDataAddedGB = esim.free_data_added_mb ? (esim.free_data_added_mb / 1024).toFixed(1) : '0';

                    return (
                      <div
                        key={esim.id}
                        className="bg-white border-2 sm:border-3 border-foreground/20 rounded-xl sm:rounded-2xl p-3 sm:p-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/20 rounded-full flex-shrink-0">
                                <Wifi className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                              </div>
                              <div>
                                <div className="font-black text-base sm:text-lg">{esim.plan_name}</div>
                                <div className="text-xs sm:text-sm font-bold text-muted-foreground">
                                  {dataRemainingGB}GB remaining
                                  {parseFloat(freeDataAddedGB) > 0 && ` • ${freeDataAddedGB}GB free data already added`}
                                </div>
                              </div>
                            </div>
                          </div>

                          {maxAvailableGB > 0 && (
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              <Select
                                value={selectedAmount[esim.id]?.toString() || '1024'}
                                onValueChange={(value) =>
                                  setSelectedAmount(prev => ({ ...prev, [esim.id]: parseInt(value) }))
                                }
                                disabled={applyingData === esim.id}
                              >
                                <SelectTrigger className="w-full sm:w-32 font-black">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[...Array(Math.min(maxAvailableGB, 10))].map((_, i) => {
                                    const gb = i + 1;
                                    const mb = gb * 1024;
                                    return (
                                      <SelectItem key={mb} value={mb.toString()}>
                                        {gb} GB
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>

                              <Button
                                onClick={() => applyDataToEsim(esim.id)}
                                disabled={applyingData === esim.id || maxAvailableGB === 0}
                                className="flex-1 sm:flex-initial bg-primary text-foreground hover:bg-primary/90 font-black text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
                              >
                                {applyingData === esim.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                                    ADDING...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    ADD DATA
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasPendingRewards && !hasBalance && !hasActiveEsims && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-5xl sm:text-6xl mb-4">📦</div>
                <h3 className="font-black text-xl sm:text-2xl mb-2 uppercase">No Free Data Yet</h3>
                <p className="text-sm sm:text-base font-bold text-muted-foreground">
                  Share your referral code to earn 1GB for each friend who purchases!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}