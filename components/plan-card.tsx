'use client';

import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plan } from '@/lib/db';
import { getCountryInfo } from '@/lib/countries';
import { useRegion } from '@/contexts/regions-context';
import { FlagIcon } from '@/components/flag-icon';

interface PlanCardProps {
  plan: Plan;
  displayPrice?: number;
  displaySymbol?: string;
  colorIndex?: number; // For cycling through brand colors
}

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

// Brand color schemes for plan cards
const cardColorSchemes = [
  { bg: 'bg-mint', border: 'border-primary/30', statBg1: 'bg-white/60', statBg2: 'bg-cyan/40' },
  { bg: 'bg-cyan', border: 'border-primary/30', statBg1: 'bg-white/60', statBg2: 'bg-mint/40' },
  { bg: 'bg-yellow', border: 'border-secondary/30', statBg1: 'bg-white/60', statBg2: 'bg-mint/40' },
  { bg: 'bg-purple', border: 'border-accent/30', statBg1: 'bg-white/60', statBg2: 'bg-cyan/40' },
];

export function PlanCard({ plan, displayPrice, displaySymbol, colorIndex }: PlanCardProps) {
  const countryInfo = getCountryInfo(plan.region_code);

  const price = displayPrice !== undefined ? displayPrice : plan.retail_price;
  const symbol = displaySymbol || '$';

  const displayData = formatDataAmount(plan.data_gb);

  // Use the regions context to get region info without making individual API calls
  const { regionInfo } = useRegion(plan.region_code);
  const [showCountries, setShowCountries] = useState(false);

  // Get color scheme based on index or derive from plan id
  const schemeIndex = colorIndex !== undefined ? colorIndex % cardColorSchemes.length :
    (plan.id ? plan.id.charCodeAt(0) % cardColorSchemes.length : 0);
  const colors = cardColorSchemes[schemeIndex];

  return (
    <Card className={`group ${colors.bg} border-2 ${colors.border} hover:border-primary shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
      <CardContent className="p-4 sm:p-5">
        {/* Header: Flag + Region + Price */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <FlagIcon countryCode={plan.region_code} className="w-10 h-7 sm:w-12 sm:h-8" />
            <div>
              <div className="font-black uppercase text-xs sm:text-sm text-foreground">
                {plan.region_code}
              </div>
              <div className="text-xs text-foreground/60 font-medium line-clamp-1">
                {countryInfo.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-foreground leading-none">
              {symbol}{price.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Plan Name */}
        <h3 className="font-bold text-sm sm:text-base text-foreground/80 mb-4 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
          {plan.name.replace(/^["']|["']$/g, '')}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
          <div className={`${colors.statBg1} rounded-lg sm:rounded-xl p-3 sm:p-4 text-center`}>
            <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Data</div>
            <div className="text-lg sm:text-xl font-black text-foreground">{displayData}</div>
          </div>
          <div className={`${colors.statBg2} rounded-lg sm:rounded-xl p-3 sm:p-4 text-center`}>
            <div className="text-xs font-bold text-foreground/60 uppercase mb-1">Valid</div>
            <div className="text-lg sm:text-xl font-black text-foreground">{plan.validity_days} days</div>
          </div>
        </div>

        {/* Coverage Info for Regional Plans */}
        {regionInfo && regionInfo.isMultiCountry && regionInfo.subLocationList && regionInfo.subLocationList.length > 0 && (
          <div className="mb-4" onClick={(e) => e.preventDefault()}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCountries(!showCountries);
              }}
              className="w-full px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors font-bold text-xs flex items-center justify-between"
            >
              <span className="flex items-center gap-2 text-foreground/70">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                {regionInfo.subLocationList.length} countries covered
              </span>
              <svg className={`w-4 h-4 text-foreground/50 transition-transform ${showCountries ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCountries && (
              <div className="mt-2 p-3 bg-foreground/5 rounded-lg max-h-40 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1.5">
                  {regionInfo.subLocationList.map((country) => (
                    <div
                      key={country.code}
                      className="flex items-center gap-2 py-1"
                    >
                      <FlagIcon countryCode={country.code} className="w-4 h-3 sm:w-5 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium text-foreground/80">{country.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Button */}
        <Link
          href={`/plans/${plan.region_code.toLowerCase()}/${plan.id}`}
          className="block"
          onClick={() => track('Plan Click', { region: plan.region_code, planId: plan.id, price: price, dataGB: plan.data_gb })}
        >
          <Button className="w-full bg-foreground hover:bg-foreground/90 text-white font-black text-sm sm:text-base py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all">
            <span className="flex items-center justify-center gap-2">
              SELECT PLAN
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
