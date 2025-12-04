'use client';

import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plan } from '@/lib/db';
import { getCountryInfo } from '@/lib/countries';
import { useRegion } from '@/contexts/regions-context';
import { FlagIcon } from '@/components/flag-icon';

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

// Format data amounts to clean values
function formatDataAmount(dataGB: number): string {
  if (dataGB >= 1) {
    return `${dataGB} GB`;
  }

  const dataMB = dataGB * 1024;

  // Round to nearest sensible value
  if (dataMB <= 110) return '100 MB';
  if (dataMB <= 250) return '200 MB';
  if (dataMB <= 550) return '500 MB';

  // For other values, round to nearest 50MB
  return `${Math.round(dataMB / 50) * 50} MB`;
}

export function PlanCard({ plan, displayPrice, displaySymbol }: PlanCardProps) {
  const colorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
  const countryInfo = getCountryInfo(plan.region_code);

  const price = displayPrice !== undefined ? displayPrice : plan.retail_price;
  const symbol = displaySymbol || '$';

  const displayData = formatDataAmount(plan.data_gb);

  // Use the regions context to get region info without making individual API calls
  const { regionInfo } = useRegion(plan.region_code);
  const [showCountries, setShowCountries] = useState(false);

  return (
    <Card className={`group ${colorClass} border-4 border-foreground/10 shadow-xl    overflow-hidden relative`}>
      <CardHeader className="pb-3 sm:pb-4 relative z-10">
        {/* Top row with flag and region badge */}
        <div className="flex items-center gap-2 mb-3">
          <FlagIcon countryCode={plan.region_code} className="w-10 h-7 sm:w-12 sm:h-8" />
          <Badge className="bg-foreground text-white font-black uppercase text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
            {plan.region_code}
          </Badge>
        </div>

        {/* Country name */}
        <div className="text-xs sm:text-sm font-bold text-foreground/70 line-clamp-2 mb-2">
          {countryInfo.name}
        </div>

        {/* Price - always on its own line */}
        <div className="mb-2">
          <div className="text-2xl sm:text-3xl font-black text-foreground leading-none break-all">
            {symbol}{price.toFixed(2)}
          </div>
        </div>

        {/* Plan name */}
        <h3 className="text-base sm:text-lg font-black uppercase leading-tight tracking-tight line-clamp-2">
          {plan.name.replace(/^["']|["']$/g, '')}
        </h3>

        {/* Coverage Information for Regional Plans */}
        {regionInfo && regionInfo.isMultiCountry && regionInfo.subLocationList && regionInfo.subLocationList.length > 0 && (
          <div className="mt-3 border border-dashed border-foreground/20 rounded-lg overflow-hidden" onClick={(e) => e.preventDefault()}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCountries(!showCountries);
              }}
              className="w-full px-2 py-2 bg-white/50 hover:bg-white/70 transition-colors font-black uppercase text-[10px] sm:text-xs flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span>Countries ({regionInfo.subLocationList.length})</span>
              </span>
              <span className="text-xs">{showCountries ? '−' : '+'}</span>
            </button>

            {showCountries && (
              <div className="p-2 bg-white max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1">
                  {regionInfo.subLocationList.map((country) => (
                    <div
                      key={country.code}
                      className="flex items-center gap-1.5 p-1.5 rounded bg-mint/20 border border-mint/40"
                    >
                      <FlagIcon countryCode={country.code} className="w-4 h-3 sm:w-5 sm:h-4" />
                      <span className="font-bold text-[10px] sm:text-xs">{country.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4 sm:pb-6 relative z-10">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center p-2.5 sm:p-3 bg-white/50 rounded-lg sm:rounded-xl border-2 border-foreground/5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <span className="font-black uppercase text-xs tracking-wider">Data:</span>
            </div>
            <span className="font-black text-xl sm:text-2xl">{displayData}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 sm:p-3 bg-white/50 rounded-lg sm:rounded-xl border-2 border-foreground/5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-black uppercase text-xs tracking-wider">Valid for:</span>
            </div>
            <span className="font-black text-xl sm:text-2xl">{plan.validity_days} days</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 pt-0">
        <Link
          href={`/plans/${plan.region_code.toLowerCase()}/${plan.id}`}
          className="w-full block"
          onClick={() => track('Plan Click', { region: plan.region_code, planId: plan.id, price: price, dataGB: plan.data_gb })}
        >
          <Button className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-sm sm:text-base md:text-lg py-5 sm:py-6 md:py-7 shadow-xl  ">
            BUY NOW →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
