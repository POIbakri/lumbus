import { NextRequest, NextResponse } from 'next/server';
import { listSupportedRegions } from '@/lib/esimaccess';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ regionCode: string }> }
) {
  try {
    const { regionCode: rawRegionCode } = await params;
    const regionCode = rawRegionCode.toUpperCase();

    // Fetch all regions from eSIM API
    const regions = await listSupportedRegions();

    // Find the specific region
    const region = regions.find(r => r.code === regionCode);

    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    // Return region info including subLocationList
    return NextResponse.json({
      code: region.code,
      name: region.name,
      type: region.type,
      subLocationList: region.subLocationList || [],
      isMultiCountry: region.type === 2
    });
  } catch (error) {
    console.error('Error fetching region info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch region information' },
      { status: 500 }
    );
  }
}
