import { NextRequest, NextResponse } from 'next/server';
import { listSupportedRegions } from '@/lib/esimaccess';
import { regionsCache } from '@/lib/cache/regions-cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ regionCode: string }> }
) {
  try {
    const { regionCode: rawRegionCode } = await params;
    const regionCode = rawRegionCode.toUpperCase();

    // Capture cache status BEFORE the request
    const cacheStatusBefore = regionsCache.getCacheStatus();
    const wasAlreadyCached = cacheStatusBefore.cached;

    // Use cached regions with request deduplication
    const region = await regionsCache.findRegion(
      regionCode,
      listSupportedRegions
    );

    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    // Add cache status to response headers for monitoring
    const headers = new Headers();
    headers.set('X-Cache', wasAlreadyCached ? 'HIT' : 'MISS');

    // Get current cache status for TTL
    const currentCacheStatus = regionsCache.getCacheStatus();
    if (currentCacheStatus.ttl !== null && currentCacheStatus.ttl !== undefined) {
      headers.set('X-Cache-TTL', currentCacheStatus.ttl.toString());
    }

    // Return region info including subLocationList
    return NextResponse.json(
      {
        code: region.code,
        name: region.name,
        type: region.type,
        subLocationList: region.subLocationList || [],
        isMultiCountry: region.type === 2
      },
      { headers }
    );
  } catch (error: any) {
    console.error('Error fetching region info:', error);

    // Check if it's a rate limit error
    if (error.message?.includes('101013') || error.message?.includes('system is busy')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable due to high traffic. Please try again in a few moments.',
          code: 'RATE_LIMITED'
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch region information' },
      { status: 500 }
    );
  }
}
