/**
 * Regions Cache Manager
 * Implements in-memory caching and request deduplication for regions data
 */

interface CachedRegions {
  data: Array<{
    code: string;
    name: string;
    type: number;
    subLocationList: Array<{ code: string; name: string }> | null;
  }>;
  timestamp: number;
}

class RegionsCache {
  private cache: CachedRegions | null = null;
  private pendingRequest: Promise<CachedRegions['data']> | null = null;
  private readonly TTL = 30 * 60 * 1000; // 30 minutes cache TTL

  /**
   * Get regions with caching and request deduplication
   * This ensures only one API call is made even if multiple requests come in simultaneously
   */
  async getRegions(
    fetchFn: () => Promise<CachedRegions['data']>
  ): Promise<CachedRegions['data']> {
    // Check if cache is valid
    if (this.cache && Date.now() - this.cache.timestamp < this.TTL) {
      return this.cache.data;
    }

    // If there's already a pending request, wait for it (request deduplication)
    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    // Create new request and store promise for deduplication
    this.pendingRequest = fetchFn()
      .then((data) => {
        // Update cache
        this.cache = {
          data,
          timestamp: Date.now(),
        };
        return data;
      })
      .finally(() => {
        // Clear pending request
        this.pendingRequest = null;
      });

    return this.pendingRequest;
  }

  /**
   * Find a specific region from cached data
   */
  async findRegion(
    regionCode: string,
    fetchFn: () => Promise<CachedRegions['data']>
  ) {
    const regions = await this.getRegions(fetchFn);
    return regions.find(r => r.code === regionCode.toUpperCase());
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache = null;
    this.pendingRequest = null;
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    if (!this.cache) {
      return { cached: false, age: null };
    }

    const age = Date.now() - this.cache.timestamp;
    return {
      cached: true,
      age: Math.floor(age / 1000), // age in seconds
      ttl: Math.floor((this.TTL - age) / 1000), // remaining TTL in seconds
      size: this.cache.data.length,
    };
  }
}

// Export singleton instance
export const regionsCache = new RegionsCache();