'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedGet, authenticatedPost } from '@/lib/api-client';

interface WalletData {
  balance_mb: number;
  balance_gb: string;
  active_esims: Array<{
    id: string;
    plan_name: string;
    data_remaining_bytes: number;
    free_data_added_mb: number;
    created_at: string;
    expires_at: string | null;
    region_code: string | null;
  }>;
}

export function DataWallet() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
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

        // Refresh the entire page to update all eSIM data
        router.refresh();

        // Also refresh wallet data locally
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
      <Card className="bg-white border-2 border-foreground shadow-lg rounded-xl animate-pulse">
        <CardContent className="pt-4 pb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!walletData) {
    return null;
  }

  const hasBalance = walletData.balance_mb > 0;
  const hasActiveEsims = walletData.active_esims?.length > 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-black uppercase mb-1">
          Rewards Balance
        </h2>
        <p className="text-xs font-bold text-muted-foreground">
          First-time buyers get 1GB when using a referral code • Earn 1GB when someone uses yours!
        </p>
      </div>

      {/* Main Wallet Card */}
      <Card className="bg-white border-2 border-foreground shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-4">
          {/* Balance Summary */}
          <div className="mb-4">
            <div className="font-black uppercase text-xs text-muted-foreground mb-1">
              Data Rewards
            </div>
            <div className="text-2xl font-black text-foreground">
              {walletData.balance_gb} GB
            </div>
          </div>

          {/* Apply Data to Active eSIMs */}
          {hasBalance && hasActiveEsims && (
            <div>
              <h3 className="text-sm font-black uppercase mb-2 text-muted-foreground">
                Add Free Data to Your eSIMs
              </h3>

              <div className="space-y-2">
                {walletData.active_esims.map((esim) => {
                  const dataRemainingGB = (esim.data_remaining_bytes / (1024 * 1024 * 1024)).toFixed(1);
                  const maxAvailableGB = Math.floor(walletData.balance_mb / 1024);

                  return (
                    <div
                      key={esim.id}
                      className="bg-white border border-foreground/20 rounded-lg p-3"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm truncate">{esim.plan_name}</div>
                            <div className="text-xs font-bold text-muted-foreground">
                              {dataRemainingGB}GB remaining
                            </div>
                          </div>
                        </div>

                        {maxAvailableGB > 0 && (
                          <div className="flex gap-2 items-center">
                            <Select
                              value={selectedAmount[esim.id]?.toString() || '1024'}
                              onValueChange={(value) =>
                                setSelectedAmount(prev => ({ ...prev, [esim.id]: parseInt(value) }))
                              }
                              disabled={applyingData === esim.id}
                            >
                              <SelectTrigger className="w-24 font-black text-xs bg-yellow border-foreground/20 rounded-lg">
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
                              className="flex-1 bg-primary text-foreground hover:bg-primary/90 font-black text-xs px-3 py-2 rounded-lg border-2 border-foreground"
                            >
                              {applyingData === esim.id ? 'ADDING...' : 'ADD DATA'}
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
            {!hasBalance && !hasActiveEsims && (
              <div className="text-center py-6">
                <h3 className="font-black text-sm mb-1 uppercase">No Free Data Yet</h3>
                <p className="text-xs font-bold text-muted-foreground">
                  Share your referral code to earn 1GB for each friend who purchases!
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}