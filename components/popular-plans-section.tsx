'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlanCard } from '@/components/plan-card';
import { Plan } from '@/lib/db';

interface PlanWithConvertedPrice extends Plan {
  convertedPrice?: number;
}

export function PopularPlansSection() {
  const [plans, setPlans] = useState<PlanWithConvertedPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    loadLocationAndPlans();
  }, []);

  const loadLocationAndPlans = async () => {
    try {
      // Detect user location and currency
      const currencyResponse = await fetch('/api/currency/detect');
      if (currencyResponse.ok) {
        const currencyData = await currencyResponse.json();
        setCurrency(currencyData.currency);
        setCurrencySymbol(currencyData.symbol);
        setUserCountry(currencyData.country);

        // Fetch plans for user's location
        const plansResponse = await fetch(`/api/plans?region=${currencyData.country}&limit=3`);
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();

          if (plansData.plans && plansData.plans.length > 0) {
            const plansWithPrices = await convertPlansPrices(plansData.plans.slice(0, 3), currencyData.currency);
            setPlans(plansWithPrices);
          } else {
            // Fallback: get any 3 popular plans
            const fallbackResponse = await fetch('/api/plans?limit=3');
            const fallbackData = await fallbackResponse.json();
            const plansWithPrices = await convertPlansPrices(fallbackData.plans?.slice(0, 3) || [], currencyData.currency);
            setPlans(plansWithPrices);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      // Fallback to default plans
      const fallbackResponse = await fetch('/api/plans?limit=3');
      const fallbackData = await fallbackResponse.json();
      setPlans(fallbackData.plans?.slice(0, 3) || []);
    } finally {
      setLoading(false);
    }
  };

  // Convert prices for all plans in one API call
  const convertPlansPrices = async (plans: Plan[], targetCurrency: string): Promise<PlanWithConvertedPrice[]> => {
    if (targetCurrency === 'USD') {
      return plans.map(plan => ({ ...plan, convertedPrice: plan.retail_price }));
    }

    try {
      const prices = plans.map(p => p.retail_price);
      const response = await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices }),
      });

      if (response.ok) {
        const data = await response.json();
        return plans.map((plan, index) => ({
          ...plan,
          convertedPrice: data.prices[index]?.converted || plan.retail_price,
        }));
      }
    } catch (error) {
      console.error('Price conversion error:', error);
    }

    return plans.map(plan => ({ ...plan, convertedPrice: plan.retail_price }));
  };

  if (loading) {
    return (
      <section className="relative py-32 px-4 bg-mint">
        <div className="container mx-auto">
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 font-black uppercase text-2xl">Loading Plans...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-32 px-4 bg-mint">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <div key={plan.id} className="" style={{animationDelay: `${index * 0.1}s`}}>
              <PlanCard
                plan={plan}
                displayPrice={plan.convertedPrice}
                displaySymbol={currencySymbol}
              />
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/plans">
            <Button className="bg-yellow text-foreground hover:bg-yellow/90 font-black text-lg px-14 py-7 rounded-xl shadow-xl">
              <span className="relative">VIEW ALL PLANS</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
