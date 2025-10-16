'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plan } from '@/lib/db';
import { getCountryInfo } from '@/lib/countries';

interface PlanCardProps {
  plan: Plan;
  displayPrice?: number;
  displaySymbol?: string;
}

const colorClasses = [
  'bg-mint border-primary',
  'bg-yellow border-secondary',
  'bg-purple border-accent',
  'bg-cyan border-primary',
];

export function PlanCard({ plan, displayPrice, displaySymbol }: PlanCardProps) {
  const colorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
  const countryInfo = getCountryInfo(plan.region_code);

  const price = displayPrice !== undefined ? displayPrice : plan.retail_price;
  const symbol = displaySymbol || '$';

  const displayData = plan.data_gb < 1
    ? `${Math.round(plan.data_gb * 1024)} MB`
    : `${plan.data_gb} GB`;

  return (
    <Card className={`group ${colorClass} border-4 border-foreground/10 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden relative`}>
      {/* Country Flag */}
      <div className="absolute top-2 right-2 text-4xl pointer-events-none">
        {countryInfo.flag}
      </div>

      <CardHeader className="pb-4 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Badge className="bg-foreground text-white font-black uppercase text-xs px-4 py-2 rounded-full shadow-lg">
              {plan.region_code}
            </Badge>
            <div className="mt-2 text-xs font-bold text-foreground/70">
              {countryInfo.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl md:text-5xl font-black text-foreground">
              {symbol}{price.toFixed(2)}
            </div>
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-black uppercase leading-tight tracking-tight">
          {plan.name}
        </h3>
      </CardHeader>

      <CardContent className="pb-6 relative z-10">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border-2 border-foreground/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="font-black uppercase text-xs tracking-wider">Data:</span>
            </div>
            <span className="font-black text-2xl">{displayData}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border-2 border-foreground/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <span className="font-black uppercase text-xs tracking-wider">Valid for:</span>
            </div>
            <span className="font-black text-2xl">{plan.validity_days} days</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-10">
        <Link href={`/plans/${plan.region_code.toLowerCase()}/${plan.id}`} className="w-full block">
          <Button className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base md:text-lg py-6 md:py-7 shadow-xl">
            BUY NOW →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
