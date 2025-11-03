'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Sparkles, TrendingUp, Clock, CheckCircle2, Info } from 'lucide-react';
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
  }>;
  applied_rewards: Array<{
    id: string;
    reward_value: number;
    applied_at: string;
  }>;
  recent_transactions: Array<{
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount_mb: number;
    description: string;
    created_at: string;
  }>;
}

export function DataWallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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
            <span>{result.message || '1GB added to your wallet!'}</span>
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

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded"></div>
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

  return (
    <div className="space-y-6">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">
            🎉
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl animate-ping">✨</div>
          </div>
        </div>
      )}

      {/* Main Wallet Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-cyan/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Your Data Wallet
          </CardTitle>
          <CardDescription>
            Free data earned from referrals that you can use for future purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Available Balance */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
              <div className="text-4xl font-bold text-primary">
                {walletData.balance_gb} GB
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {walletData.balance_mb} MB total
              </div>
            </div>

            {/* Pending Rewards */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Pending Rewards</div>
              <div className="text-4xl font-bold text-orange-500">
                {totalPendingGB} GB
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {walletData.pending_rewards.length} reward{walletData.pending_rewards.length !== 1 ? 's' : ''} to claim
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {walletData.balance_mb > 0 && (
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Your data credits will be automatically applied as a discount on your next purchase!
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Rewards */}
      {walletData.pending_rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Rewards
              <Badge variant="secondary" className="ml-2">
                {walletData.pending_rewards.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Claim your rewards from successful referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {walletData.pending_rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                      <Gift className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {(reward.reward_value / 1024).toFixed(1)} GB Free Data
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Earned {formatDistanceToNow(new Date(reward.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => redeemReward(reward.id)}
                    disabled={redeeming === reward.id}
                    className="bg-gradient-to-r from-primary to-cyan hover:opacity-90"
                  >
                    {redeeming === reward.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Claim Reward
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Your recent wallet activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="debits">Debits</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-4">
              {walletData.recent_transactions.length > 0 ? (
                walletData.recent_transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))
              ) : (
                <EmptyState message="No transactions yet" />
              )}
            </TabsContent>

            <TabsContent value="credits" className="space-y-2 mt-4">
              {walletData.recent_transactions.filter(tx => tx.type === 'CREDIT').length > 0 ? (
                walletData.recent_transactions
                  .filter(tx => tx.type === 'CREDIT')
                  .map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
              ) : (
                <EmptyState message="No credits yet" />
              )}
            </TabsContent>

            <TabsContent value="debits" className="space-y-2 mt-4">
              {walletData.recent_transactions.filter(tx => tx.type === 'DEBIT').length > 0 ? (
                walletData.recent_transactions
                  .filter(tx => tx.type === 'DEBIT')
                  .map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
              ) : (
                <EmptyState message="No debits yet" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const isCredit = transaction.type === 'CREDIT';

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isCredit ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
        }`}>
          {isCredit ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
          )}
        </div>
        <div>
          <div className="font-medium">{transaction.description}</div>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
      <div className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
        {isCredit ? '+' : '-'}{(transaction.amount_mb / 1024).toFixed(2)} GB
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
      <p>{message}</p>
    </div>
  );
}