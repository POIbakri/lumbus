'use client';

import { useState, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { PlanCard } from '@/components/plan-card';
import { RegionPicker } from '@/components/region-picker';
import { Plan } from '@/lib/db';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const mockPlans: Plan[] = [
        {
          id: '1',
          name: 'Japan 5GB - 30 Days',
          region_code: 'JP',
          data_gb: 5,
          validity_days: 30,
          supplier_sku: '1GLOBAL_JP_5GB_30D',
          retail_price: 19.99,
          currency: 'USD',
          is_active: true,
        },
        {
          id: '2',
          name: 'Europe 10GB - 30 Days',
          region_code: 'EU',
          data_gb: 10,
          validity_days: 30,
          supplier_sku: '1GLOBAL_EU_10GB_30D',
          retail_price: 29.99,
          currency: 'USD',
          is_active: true,
        },
        {
          id: '3',
          name: 'USA 5GB - 30 Days',
          region_code: 'US',
          data_gb: 5,
          validity_days: 30,
          supplier_sku: '1GLOBAL_US_5GB_30D',
          retail_price: 24.99,
          currency: 'USD',
          is_active: true,
        },
        {
          id: '4',
          name: 'Global 3GB - 7 Days',
          region_code: 'GLOBAL',
          data_gb: 3,
          validity_days: 7,
          supplier_sku: '1GLOBAL_GLOBAL_3GB_7D',
          retail_price: 14.99,
          currency: 'USD',
          is_active: true,
        },
      ];
      setPlans(mockPlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = selectedRegion
    ? plans.filter((p) => p.region_code === selectedRegion)
    : plans;

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="relative pt-40 pb-32 px-4 bg-mint overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-block mb-6">
              <span className="px-6 py-2 rounded-full bg-primary/10 border-2 border-primary font-black uppercase text-xs tracking-widest text-primary">
                💎 Premium eSIM Plans
              </span>
            </div>
            <h1 className="heading-xl mb-6">
              CHOOSE YOUR PLAN
            </h1>
            <p className="text-2xl font-bold max-w-3xl mx-auto opacity-70">
              Get instant connectivity in 190+ countries. No contracts, no hassle.
            </p>
          </div>

          <div className="mb-20 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="text-center mb-10">
              <h2 className="heading-md mb-3">FILTER BY REGION</h2>
              <p className="text-lg font-bold opacity-60">Find the perfect plan for your destination</p>
            </div>
            <RegionPicker
              selectedRegion={selectedRegion}
              onSelectRegion={(code) =>
                setSelectedRegion(code === selectedRegion ? undefined : code)
              }
            />
            {selectedRegion && (
              <div className="text-center mt-8 animate-scale-in">
                <button
                  onClick={() => setSelectedRegion(undefined)}
                  className="px-6 py-3 rounded-xl bg-foreground/5 border-2 border-foreground/10 font-black uppercase text-sm hover:bg-foreground hover:text-white transition-all duration-300 hover:scale-105"
                >
                  ✕ Clear Filter
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-32">
              <div className="relative inline-block">
                <div className="w-24 h-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl animate-pulse-slow">⚡</div>
                </div>
              </div>
              <p className="mt-8 font-black uppercase text-2xl tracking-tight">Loading plans...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-32 animate-scale-in">
              <div className="max-w-md mx-auto p-12 bg-white rounded-3xl border-4 border-primary shadow-2xl">
                <div className="text-6xl mb-6">🌍</div>
                <p className="text-3xl font-black uppercase mb-4">No Plans Available</p>
                <p className="text-lg font-bold opacity-70">Try selecting a different region</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredPlans.map((plan, index) => (
                <div key={plan.id} className="animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
