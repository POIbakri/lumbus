'use client';

import { Card, CardContent } from '@/components/ui/card';

interface Region {
  code: string;
  name: string;
  flag: string;
}

const REGIONS: Region[] = [
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GLOBAL', name: 'Global', flag: '🌍' },
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
            className={`group cursor-pointer transition-all duration-300 border-4 ${colorClass} relative overflow-hidden ${
              isSelected
                ? 'ring-4 ring-foreground shadow-2xl scale-105'
                : 'hover:shadow-xl hover:scale-105'
            }`}
            onClick={() => onSelectRegion?.(region.code)}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-foreground rounded-full flex items-center justify-center animate-scale-in">
                <span className="text-white text-xs">✓</span>
              </div>
            )}

            <CardContent className="p-8 text-center relative z-10">
              <div className={`text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300 ${isSelected ? 'animate-bounce-subtle' : ''}`}>
                {region.flag}
              </div>
              <div className="font-black uppercase text-lg tracking-tight">{region.name}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
