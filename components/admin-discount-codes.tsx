'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function AdminDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountPercent: 10,
    maxUses: '',
    maxUsesPerUser: '1',
    validUntil: '',
    isActive: true,
  });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      const response = await fetch('/api/admin/discount-codes');
      if (!response.ok) throw new Error('Failed to load codes');
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error('Error loading discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || undefined,
          discountPercent: formData.discountPercent,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: parseInt(formData.maxUsesPerUser),
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create code');
      }

      // Reset form
      setFormData({
        code: '',
        description: '',
        discountPercent: 10,
        maxUses: '',
        maxUsesPerUser: '1',
        validUntil: '',
        isActive: true,
      });
      setShowCreateForm(false);

      // Reload codes
      await loadCodes();
      alert('Discount code created successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create discount code');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update code');
      await loadCodes();
    } catch (error) {
      alert('Failed to update discount code');
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete code');
      await loadCodes();
    } catch (error) {
      alert('Failed to delete discount code');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 glass rounded-2xl float-shadow">
        <div className="inline-block rounded-full h-8 w-8 border-b-2 border-primary animate-spin mb-3"></div>
        <p className="font-black">Loading discount codes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-cyan border border-primary/30 float-shadow rounded-2xl sm:rounded-3xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl sm:text-2xl font-black uppercase flex items-center gap-3">
              Discount Codes
              <Badge className="glass-mint border border-primary/30 font-black text-sm px-3 py-1">
                {codes.length}
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`font-black uppercase text-xs sm:text-sm rounded-xl px-6 py-2 transition-all ${
                showCreateForm
                  ? 'glass border border-foreground/20 text-foreground hover:glass-dark hover:text-white'
                  : 'glass-dark text-white hover:scale-[1.02]'
              }`}
            >
              {showCreateForm ? '✕ Cancel' : '+ Create Code'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="glass-yellow border border-secondary/30 float-shadow rounded-2xl sm:rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">Create New Discount Code</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                    placeholder="SUMMER20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                    Discount % *
                  </label>
                  <select
                    required
                    className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                  >
                    <option value={10}>10%</option>
                    <option value={20}>20%</option>
                    <option value={30}>30%</option>
                    <option value={40}>40%</option>
                    <option value={50}>50%</option>
                    <option value={100}>100% (Free)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Summer sale 2025"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                    Max Total Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Unlimited"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                    Max Per User *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-black uppercase text-xs text-muted-foreground mb-2 block">
                    Expires On
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full glass rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full glass-mint text-foreground hover:scale-[1.01] font-black uppercase rounded-xl py-3 transition-all"
              >
                Create Discount Code
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Codes List */}
      <div className="space-y-4">
        {codes.length === 0 ? (
          <Card className="glass border border-foreground/20 float-shadow rounded-2xl sm:rounded-3xl">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 glass-purple rounded-full glass-inner-glow">
                  <svg className="w-12 h-12 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                  </svg>
                </div>
              </div>
              <p className="font-black text-xl mb-2">No discount codes yet</p>
              <p className="text-sm font-bold text-muted-foreground">Create your first discount code above</p>
            </CardContent>
          </Card>
        ) : (
          codes.map((code) => {
            const usagePercent = code.max_uses ? (code.current_uses / code.max_uses) * 100 : 0;
            const isExpired = code.valid_until && new Date(code.valid_until) < new Date();

            return (
              <Card
                key={code.id}
                className={`glass border float-shadow hover-lift rounded-2xl transition-all ${
                  code.is_active && !isExpired
                    ? 'border-primary/30'
                    : 'border-foreground/10 opacity-75'
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Code Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-2xl sm:text-3xl font-black font-mono">{code.code}</h3>
                        <Badge className="glass-yellow border border-secondary/30 font-black text-xs">
                          {code.discount_percent}% OFF
                        </Badge>
                        <Badge className={`font-black text-xs border ${
                          isExpired
                            ? 'bg-destructive/20 border-destructive/30 text-destructive'
                            : code.is_active
                              ? 'glass-mint border-primary/30'
                              : 'glass border-foreground/20'
                        }`}>
                          {isExpired ? 'EXPIRED' : code.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>

                      {code.description && (
                        <p className="text-sm font-bold text-muted-foreground mb-4">{code.description}</p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 glass rounded-xl p-4 glass-inner-glow">
                        <div>
                          <p className="font-black uppercase text-xs text-muted-foreground mb-1">Uses</p>
                          <p className="font-bold text-sm">
                            {code.current_uses} {code.max_uses ? `/ ${code.max_uses}` : ''}
                            {code.max_uses && (
                              <span className="text-xs text-muted-foreground ml-1">({usagePercent.toFixed(0)}%)</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-black uppercase text-xs text-muted-foreground mb-1">Per User</p>
                          <p className="font-bold text-sm">{code.max_uses_per_user}</p>
                        </div>
                        <div>
                          <p className="font-black uppercase text-xs text-muted-foreground mb-1">Expires</p>
                          <p className="font-bold text-sm">
                            {code.valid_until
                              ? new Date(code.valid_until).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="font-black uppercase text-xs text-muted-foreground mb-1">Created</p>
                          <p className="font-bold text-sm">{new Date(code.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 sm:justify-center">
                      <Button
                        onClick={() => toggleActive(code.id, code.is_active)}
                        className={`flex-1 sm:flex-none font-black uppercase text-xs rounded-xl px-4 py-2 transition-all ${
                          code.is_active
                            ? 'glass border border-foreground/20 text-foreground hover:glass-dark hover:text-white'
                            : 'glass-mint text-foreground hover:scale-[1.02]'
                        }`}
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => deleteCode(code.id)}
                        className="flex-1 sm:flex-none bg-destructive/90 text-white font-black uppercase text-xs rounded-xl px-4 py-2 hover:bg-destructive transition-all"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
