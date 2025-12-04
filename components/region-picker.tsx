'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FlagIcon } from '@/components/flag-icon';

interface Region {
  code: string;
  name: string;
}

const REGIONS: Region[] = [
  { code: 'JP', name: 'Japan' },
  { code: 'EU', name: 'Europe' },
  { code: 'US', name: 'United States' },
  { code: 'GLOBAL', name: 'Global' },
];

interface RegionPickerProps {
  selectedRegion?: string;
  onSelectRegion?: (code: string) => void;
}

const colorClasses = [
  'bg-mint border-primary',
  'bg-yellow border-secondary',
  'bg-purple border-accent',
  'bg-cyan border-primary',
];

export function RegionPicker({ selectedRegion, onSelectRegion }: RegionPickerProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {REGIONS.map((region, index) => {
        const colorClass = colorClasses[index % colorClasses.length];
        const isSelected = selectedRegion === region.code;
        return (
          <Card
            key={region.code}
            className={`group cursor-pointer   border-4 ${colorClass} relative overflow-hidden ${
              isSelected
                ? 'ring-4 ring-foreground shadow-2xl scale-105'
                : ' '
            }`}
            onClick={() => onSelectRegion?.(region.code)}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100   pointer-events-none"></div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-foreground rounded-full flex items-center justify-center ">
                <span className="text-white text-xs">✓</span>
              </div>
            )}

            <CardContent className="p-8 text-center relative z-10">
              <div className={`mb-4 flex justify-center transform ${isSelected ? '' : ''}`}>
                <FlagIcon countryCode={region.code} className="w-12 h-9 sm:w-14 sm:h-10 md:w-16 md:h-12" />
              </div>
              <div className="font-black uppercase text-lg tracking-tight">{region.name}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
