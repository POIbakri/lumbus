'use client';

import { useState, useEffect } from 'react';
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

interface RewardPackage {
  id: string;
  name: string;
  supplier_sku: string;
  data_gb: number;
  validity_days: number;
  region_code: string | null;
  retail_price: number;
  currency: string;
}

export function DataWallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingData, setApplyingData] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<Record<string, number>>({});
  const [packages, setPackages] = useState<RewardPackage[] | null>(null);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Record<string, string>>({});

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

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await authenticatedGet<{ packages: RewardPackage[] }>('/api/rewards/available-packages');
      setPackages(response.packages || []);
    } catch (error) {
      console.error('Failed to fetch reward packages:', error);
      toast.error('Unable to load 1GB packages. Please try again later.');
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const applyDataToEsim = async (orderId: string) => {
    const amountMB = selectedAmount[orderId] || 1024; // Default 1GB

    if (!walletData || walletData.balance_mb < amountMB) {
      toast.error('Insufficient free data balance');
      return;
    }

    const packageSku = selectedPackage[orderId];

    if (!packageSku && (packages?.length || 0) > 0) {
      toast.error('Please select a 1GB package before adding data.');
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
        packageSku,
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
          FREE DATA BALANCE
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
              Your Free Data
            </div>
            <div className="text-2xl font-black text-foreground">
              {walletData.balance_gb} GB
            </div>
          </div>

          {/* Apply Data to Active eSIMs */}
            {hasBalance && hasActiveEsims && (
              <div>
                <h3 className="text-sm font-black uppercase mb-1 text-muted-foreground">
                  Add Data to eSIMs
                </h3>
                {packagesLoading && (
                  <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-2">
                    Loading available 1GB packages...
                  </div>
                )}

                <div className="space-y-2">
                  {walletData.active_esims.map((esim) => {
                    const dataRemainingGB = (esim.data_remaining_bytes / (1024 * 1024 * 1024)).toFixed(1);
                    const maxAvailableGB = Math.floor(walletData.balance_mb / 1024);
                    const eligiblePackages =
                      (packages || []).filter(pkg => !pkg.region_code || pkg.region_code === esim.region_code);

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
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1">
                                <div className="font-black uppercase text-[10px] text-muted-foreground mb-1">
                                  Select 1GB Package
                                </div>
                                <Select
                                  value={selectedPackage[esim.id] || ''}
                                  onValueChange={(value) =>
                                    setSelectedPackage(prev => ({ ...prev, [esim.id]: value }))
                                  }
                                  disabled={applyingData === esim.id || packagesLoading}
                                >
                                  <SelectTrigger className="w-full font-black text-xs bg-mint border-foreground/20 rounded-lg">
                                    <SelectValue placeholder={packagesLoading ? 'Loading...' : 'Choose package'} />
                                  </SelectTrigger>
                                <SelectContent>
                                  {(eligiblePackages.length ? eligiblePackages : (packages || [])).map(pkg => (
                                      <SelectItem key={pkg.supplier_sku} value={pkg.supplier_sku}>
                                        <span className="font-black text-xs">
                                          {pkg.name}
                                        </span>
                                        <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                                          {pkg.region_code || 'Global'} • {pkg.data_gb.toFixed(1)}GB
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

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