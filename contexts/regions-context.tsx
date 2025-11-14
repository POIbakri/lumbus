'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface RegionInfo {
  code: string;
  name: string;
  type: number;
  isMultiCountry: boolean;
  subLocationList: Array<{ code: string; name: string }>;
}

interface RegionsContextValue {
  regions: Map<string, RegionInfo>;
  getRegion: (code: string) => RegionInfo | undefined;
  isLoading: boolean;
  error: string | null;
  prefetchRegions: (codes: string[]) => Promise<void>;
}

const RegionsContext = createContext<RegionsContextValue | undefined>(undefined);

export function RegionsProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<Map<string, RegionInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFetch, setPendingFetch] = useState<Promise<void> | null>(null);

  /**
   * Fetch all regions at once and cache them
   */
  const fetchAllRegions = useCallback(async () => {
    // If there's already a fetch in progress, return the existing promise
    if (pendingFetch) {
      return pendingFetch;
    }

    const fetchPromise = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/regions');
        if (!response.ok) {
          throw new Error('Failed to fetch regions');
        }

        const data = await response.json();
        const regionsMap = new Map<string, RegionInfo>();

        data.regions.forEach((region: RegionInfo) => {
          regionsMap.set(region.code, region);
        });

        setRegions(regionsMap);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch regions');
      } finally {
        setIsLoading(false);
        setPendingFetch(null);
      }
    })();

    setPendingFetch(fetchPromise);
    return fetchPromise;
  }, [pendingFetch]);

  /**
   * Get a specific region from the cache
   */
  const getRegion = useCallback((code: string): RegionInfo | undefined => {
    return regions.get(code.toUpperCase());
  }, [regions]);

  /**
   * Prefetch regions if not already loaded
   * This can be called by parent components when they know they'll need region data
   */
  const prefetchRegions = useCallback(async (codes: string[]) => {
    // Check if we already have all the requested regions
    const missingRegions = codes.filter(code => !regions.has(code.toUpperCase()));

    if (missingRegions.length === 0) {
      return; // All regions already cached
    }

    // If we don't have regions yet, fetch all of them
    if (regions.size === 0) {
      await fetchAllRegions();
    }
  }, [regions, fetchAllRegions]);

  // Optionally fetch all regions on mount (you can remove this if you want lazy loading)
  useEffect(() => {
    if (regions.size === 0 && !isLoading && !pendingFetch) {
      fetchAllRegions();
    }
  }, []);

  const value: RegionsContextValue = {
    regions,
    getRegion,
    isLoading,
    error,
    prefetchRegions,
  };

  return (
    <RegionsContext.Provider value={value}>
      {children}
    </RegionsContext.Provider>
  );
}

export function useRegions() {
  const context = useContext(RegionsContext);
  if (!context) {
    throw new Error('useRegions must be used within a RegionsProvider');
  }
  return context;
}

/**
 * Hook to get a specific region with automatic fetching
 */
export function useRegion(code: string) {
  const { getRegion, prefetchRegions, isLoading, error } = useRegions();
  const [regionInfo, setRegionInfo] = useState<RegionInfo | undefined>();

  useEffect(() => {
    const loadRegion = async () => {
      // Try to get from cache first
      const cached = getRegion(code);
      if (cached) {
        setRegionInfo(cached);
        return;
      }

      // If not in cache, trigger a fetch
      await prefetchRegions([code]);
      const fetched = getRegion(code);
      setRegionInfo(fetched);
    };

    loadRegion();
  }, [code, getRegion, prefetchRegions]);

  return { regionInfo, isLoading, error };
}