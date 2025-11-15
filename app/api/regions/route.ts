import { NextRequest, NextResponse } from 'next/server';
import { listSupportedRegions } from '@/lib/esimaccess';
import { regionsCache } from '@/lib/cache/regions-cache';

/**
 * GET /api/regions - Get all supported regions
 * This endpoint returns all regions at once, utilizing cache
 */
export async function GET(req: NextRequest) {
  try {
    // Capture cache status BEFORE the request
    const cacheStatusBefore = regionsCache.getCacheStatus();
    const wasAlreadyCached = cacheStatusBefore.cached;

    // Use cached regions with request deduplication
    const regions = await regionsCache.getRegions(listSupportedRegions);

    // Add cache status to response headers
    const headers = new Headers();
    headers.set('X-Cache', wasAlreadyCached ? 'HIT' : 'MISS');

    // Get current cache status for TTL
    const currentCacheStatus = regionsCache.getCacheStatus();
    if (currentCacheStatus.ttl !== null && currentCacheStatus.ttl !== undefined) {
      headers.set('X-Cache-TTL', currentCacheStatus.ttl.toString());
    }
    headers.set('X-Total-Regions', regions.length.toString());

    // Transform regions to include additional metadata
    const transformedRegions = regions.map(region => ({
      code: region.code,
      name: region.name,
      type: region.type,
      isMultiCountry: region.type === 2,
      subLocationList: region.subLocationList || [],
      subLocationCount: region.subLocationList?.length || 0
    }));

    return NextResponse.json(
      {
        regions: transformedRegions,
        total: regions.length,
        cacheStatus: {
          cached: wasAlreadyCached,
          age: currentCacheStatus.age,
          ttl: currentCacheStatus.ttl
        }
      },
      { headers }
    );
  } catch (error: any) {
    console.error('Error fetching regions:', error);

    // Check if it's a rate limit error
    if (error.message?.includes('101013') || error.message?.includes('system is busy')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable due to high traffic. Please try again in a few moments.',
          code: 'RATE_LIMITED'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/regions - Clear the regions cache (admin endpoint)
 */
export async function DELETE(req: NextRequest) {
  try {
    // You might want to add authentication here
    // const authHeader = req.headers.get('authorization');
    // if (!isAdminAuthenticated(authHeader)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    regionsCache.clearCache();

    return NextResponse.json({
      message: 'Regions cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}