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
          validUntil: formData.validUntil || null,
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card className="border-2 sm:border-4 border-primary shadow-xl">
      <CardHeader className="bg-cyan p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl sm:text-2xl font-black uppercase">
            Discount Codes ({codes.length})
          </CardTitle>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-foreground hover:bg-primary/90 font-black uppercase text-xs sm:text-sm"
          >
            {showCreateForm ? 'Cancel' : '+ Create Code'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Create Form */}
        {showCreateForm && (
          <Card className="border-2 border-secondary bg-yellow/10 mb-6">
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
                      className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none uppercase"
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
                      className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none"
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
                    className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none"
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
                      className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none"
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
                      className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none"
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
                      className="w-full border-2 border-foreground/10 rounded-lg p-3 text-sm font-bold focus:border-primary focus:outline-none"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary text-foreground hover:bg-primary/90 font-black uppercase">
                  Create Discount Code
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Codes List */}
        <div className="space-y-3 sm:space-y-4">
          {codes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎟️</div>
              <p className="font-black text-lg sm:text-xl">No discount codes yet</p>
              <p className="text-sm text-muted-foreground">Create your first discount code above</p>
            </div>
          ) : (
            codes.map((code) => {
              const usagePercent = code.max_uses ? (code.current_uses / code.max_uses) * 100 : 0;
              const isExpired = code.valid_until && new Date(code.valid_until) < new Date();

              return (
                <Card key={code.id} className="border-2 border-foreground/10">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Code Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl sm:text-3xl font-black font-mono">{code.code}</h3>
                          <Badge className="bg-primary text-foreground font-black">
                            {code.discount_percent}% OFF
                          </Badge>
                          <Badge className={code.is_active && !isExpired ? 'bg-primary text-foreground' : 'bg-gray-400 text-white'}>
                            {isExpired ? 'EXPIRED' : code.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>

                        {code.description && (
                          <p className="text-sm font-bold text-muted-foreground mb-3">{code.description}</p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="font-black uppercase text-muted-foreground">Uses</p>
                            <p className="font-bold">
                              {code.current_uses} {code.max_uses ? `/ ${code.max_uses}` : ''}
                              {code.max_uses && (
                                <span className="text-muted-foreground ml-1">({usagePercent.toFixed(0)}%)</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="font-black uppercase text-muted-foreground">Per User</p>
                            <p className="font-bold">{code.max_uses_per_user}</p>
                          </div>
                          <div>
                            <p className="font-black uppercase text-muted-foreground">Expires</p>
                            <p className="font-bold">
                              {code.valid_until
                                ? new Date(code.valid_until).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                          <div>
                            <p className="font-black uppercase text-muted-foreground">Created</p>
                            <p className="font-bold">{new Date(code.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          onClick={() => toggleActive(code.id, code.is_active)}
                          variant="outline"
                          className="flex-1 sm:flex-none border-2 font-black uppercase text-xs"
                        >
                          {code.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          onClick={() => deleteCode(code.id)}
                          variant="destructive"
                          className="flex-1 sm:flex-none font-black uppercase text-xs"
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
      </CardContent>
    </Card>
  );
}
