'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserOrder {
  id: string;
  iccid: string;
  status: string;
  createdAt: string;
  dataRemainingBytes: number | null;
  totalBytes: number | null;
  expiresAt: string | null;
  isTopup: boolean;
  plan: {
    id: string;
    name: string;
    data_gb: number;
    region_code: string;
  } | null;
}

interface UserData {
  userId: string;
  email: string;
  walletBalanceMB: number;
  orders: UserOrder[];
}

interface Plan {
  id: string;
  name: string;
  data_gb: number;
  validity_days: number;
  region_code: string;
  retail_price: number;
  is_reloadable: boolean;
}

interface AllPlans {
  all: Plan[];
  reloadable: Plan[];
}

export function AdminManageData() {
  const [searchEmail, setSearchEmail] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [plans, setPlans] = useState<AllPlans>({ all: [], reloadable: [] });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Gift type state
  const [giftType, setGiftType] = useState<'wallet' | 'topup' | 'new_esim'>('wallet');
  const [walletDataGB, setWalletDataGB] = useState('1');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [reason, setReason] = useState('');

  const searchUser = async () => {
    if (!searchEmail.trim()) return;

    setLoading(true);
    setUserData(null);
    setResult(null);
    setSelectedOrderId('');

    try {
      const response = await fetch(`/api/admin/manage-data?userEmail=${encodeURIComponent(searchEmail.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setResult({ success: false, message: data.error || 'User not found' });
        return;
      }

      setUserData(data);

      // Load plans for new eSIM / top-up selection
      const plansResponse = await fetch('/api/plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        const plansList = plansData.plans || plansData; // Handle both {plans: [...]} and [...] formats
        setPlans({
          all: plansList,
          reloadable: plansList.filter((p: Plan) => p.is_reloadable),
        });
      }
    } catch (err) {
      setResult({ success: false, message: 'Failed to search for user' });
    } finally {
      setLoading(false);
    }
  };

  const handleGift = async () => {
    if (!userData) return;
    if (!reason.trim()) {
      setResult({ success: false, message: 'Please provide a reason for this action' });
      return;
    }

    setActionLoading(true);
    setResult(null);

    try {
      const body: any = {
        type: giftType,
        userEmail: userData.email,
        reason: reason.trim(),
      };

      if (giftType === 'wallet') {
        const dataMB = parseFloat(walletDataGB) * 1024;
        if (isNaN(dataMB) || dataMB <= 0) {
          setResult({ success: false, message: 'Please enter a valid data amount' });
          setActionLoading(false);
          return;
        }
        body.dataMB = dataMB;
      } else if (giftType === 'topup') {
        if (!selectedOrderId) {
          setResult({ success: false, message: 'Please select an eSIM to top up' });
          setActionLoading(false);
          return;
        }
        if (!selectedPlanId) {
          setResult({ success: false, message: 'Please select a plan for the top-up' });
          setActionLoading(false);
          return;
        }
        body.orderId = selectedOrderId;
        body.planId = selectedPlanId;
      } else if (giftType === 'new_esim') {
        if (!selectedPlanId) {
          setResult({ success: false, message: 'Please select a plan for the new eSIM' });
          setActionLoading(false);
          return;
        }
        body.planId = selectedPlanId;
      }

      const response = await fetch('/api/admin/manage-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ success: false, message: data.error || 'Failed to process gift' });
        return;
      }

      setResult({ success: true, message: data.message });

      // Refresh user data
      await searchUser();

      // Reset form
      setReason('');
    } catch (err) {
      setResult({ success: false, message: 'Failed to process gift' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card className="glass-mint border border-primary/30 float-shadow rounded-2xl sm:rounded-3xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl font-black uppercase">Manage User Data</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            <div>
              <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                Search User by Email
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter user email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                  className="flex-1 glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={searchUser}
                  disabled={loading || !searchEmail.trim()}
                  className="glass-dark text-white font-black uppercase text-sm rounded-xl px-6 py-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div className={`rounded-xl p-4 ${result.success ? 'glass-mint border border-primary/30' : 'bg-destructive/20 border border-destructive/30'}`}>
                <p className="font-bold text-sm">{result.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Info & Gift Options */}
      {userData && (
        <>
          {/* User Summary */}
          <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-lg font-black uppercase">
                  {userData.email}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className="glass-yellow border border-secondary/30 font-black text-sm">
                    Wallet: {(userData.walletBalanceMB / 1024).toFixed(2)} GB
                  </Badge>
                  <Badge className="glass-mint border border-primary/30 font-black text-sm">
                    {userData.orders.length} eSIMs
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {/* Action Type Selection */}
              <div className="mb-6">
                <label className="font-black uppercase text-xs text-muted-foreground mb-3 block">
                  Action Type
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setGiftType('wallet')}
                    className={`px-4 py-3 rounded-xl font-black uppercase text-sm transition-all ${
                      giftType === 'wallet'
                        ? 'glass-mint border-2 border-primary'
                        : 'glass border border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    Add to Wallet
                  </button>
                  <button
                    onClick={() => setGiftType('topup')}
                    className={`px-4 py-3 rounded-xl font-black uppercase text-sm transition-all ${
                      giftType === 'topup'
                        ? 'glass-cyan border-2 border-primary'
                        : 'glass border border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    Top Up eSIM
                  </button>
                  <button
                    onClick={() => setGiftType('new_esim')}
                    className={`px-4 py-3 rounded-xl font-black uppercase text-sm transition-all ${
                      giftType === 'new_esim'
                        ? 'glass-purple border-2 border-accent'
                        : 'glass border border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    New eSIM
                  </button>
                </div>
              </div>

              {/* Wallet Gift */}
              {giftType === 'wallet' && (
                <div className="space-y-4 glass rounded-xl p-4 glass-inner-glow">
                  <div>
                    <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                      Data Amount (GB)
                    </label>
                    <div className="flex gap-2">
                      {['0.5', '1', '2', '5', '10'].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setWalletDataGB(amount)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                            walletDataGB === amount
                              ? 'glass-mint border border-primary'
                              : 'glass border border-foreground/10 hover:border-foreground/30'
                          }`}
                        >
                          {amount} GB
                        </button>
                      ))}
                      <input
                        type="number"
                        value={walletDataGB}
                        onChange={(e) => setWalletDataGB(e.target.value)}
                        placeholder="Custom"
                        className="w-20 glass rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data will be added to the user&apos;s wallet balance. They can apply it to any eligible eSIM.
                  </p>
                </div>
              )}

              {/* Top-up eSIM */}
              {giftType === 'topup' && (
                <div className="space-y-4">
                  {/* Select eSIM */}
                  <div className="glass rounded-xl p-4 glass-inner-glow">
                    <label className="font-black uppercase text-xs text-muted-foreground mb-3 block">
                      Select eSIM to Top Up
                    </label>
                    {userData.orders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active eSIMs found for this user</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userData.orders.filter(o => !o.isTopup).map((order) => (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all ${
                              selectedOrderId === order.id
                                ? 'glass-cyan border-2 border-primary'
                                : 'glass border border-foreground/10 hover:border-foreground/30'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-sm">{order.plan?.name || 'Unknown Plan'}</p>
                                <p className="text-xs text-muted-foreground font-mono">{order.iccid}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm text-primary">
                                  {formatBytes(order.dataRemainingBytes)} left
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Expires: {formatDate(order.expiresAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Select Plan */}
                  {selectedOrderId && (
                    <div className="glass rounded-xl p-4 glass-inner-glow">
                      <label className="font-black uppercase text-xs text-muted-foreground mb-3 block">
                        Select Top-up Plan
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a plan...</option>
                        {plans.reloadable.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.data_gb} GB / {plan.validity_days} days (${plan.retail_price})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* New eSIM */}
              {giftType === 'new_esim' && (
                <div className="glass rounded-xl p-4 glass-inner-glow">
                  <label className="font-black uppercase text-xs text-muted-foreground mb-3 block">
                    Select Plan for New eSIM
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a plan...</option>
                    {plans.all.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.data_gb} GB / {plan.validity_days} days (${plan.retail_price})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    A new eSIM will be provisioned and added to the user&apos;s account.
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="mt-4">
                <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                  Reason (Required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Compensation for service issue, Customer loyalty gift, etc."
                  className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <Button
                  onClick={handleGift}
                  disabled={actionLoading || !reason.trim()}
                  className={`w-full font-black uppercase text-sm rounded-xl px-6 py-4 hover:scale-[1.02] transition-all disabled:opacity-50 ${
                    giftType === 'wallet'
                      ? 'glass-mint text-foreground'
                      : giftType === 'topup'
                      ? 'glass-cyan text-foreground'
                      : 'glass-purple text-foreground'
                  }`}
                >
                  {actionLoading ? 'Processing...' : (
                    giftType === 'wallet'
                      ? `Credit ${walletDataGB} GB to Wallet`
                      : giftType === 'topup'
                      ? 'Apply Top-Up'
                      : 'Provision New eSIM'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User's eSIMs */}
          {userData.orders.length > 0 && (
            <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg font-black uppercase">User&apos;s eSIMs</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {userData.orders.map((order) => (
                    <div key={order.id} className="p-4 glass rounded-xl glass-inner-glow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{order.plan?.name || 'Unknown'}</span>
                            {order.isTopup && (
                              <Badge className="glass-cyan border border-primary/30 font-black text-xs">TOP-UP</Badge>
                            )}
                            <Badge className={`font-black uppercase text-xs border ${
                              order.status === 'completed' || order.status === 'active'
                                ? 'glass-mint border-primary/30'
                                : 'glass-yellow border-secondary/30'
                            }`}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground mt-1">{order.iccid}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-primary">
                            {formatBytes(order.dataRemainingBytes)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of {formatBytes(order.totalBytes)} • Exp: {formatDate(order.expiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Instructions */}
      <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg font-black uppercase">Available Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-mint rounded-xl p-4 glass-inner-glow">
              <h4 className="font-black text-sm mb-2">Add to Wallet</h4>
              <p className="text-xs text-muted-foreground">
                Adds free data to the user&apos;s wallet balance. They can apply it to any eligible eSIM or use it for top-ups.
              </p>
            </div>
            <div className="glass-cyan rounded-xl p-4 glass-inner-glow">
              <h4 className="font-black text-sm mb-2">Top Up eSIM</h4>
              <p className="text-xs text-muted-foreground">
                Directly adds data to an existing eSIM. Uses the eSIM Access API to top up the selected eSIM with a specific plan.
              </p>
            </div>
            <div className="glass-purple rounded-xl p-4 glass-inner-glow">
              <h4 className="font-black text-sm mb-2">New eSIM</h4>
              <p className="text-xs text-muted-foreground">
                Provisions a brand new eSIM for the user with the selected plan. The user will see it in their app/account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
