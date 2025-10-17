import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Admin auth helper
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH?.replace(/\s+/g, '');

  if (!expectedPasswordHash) {
    console.warn('[Admin Auth] ADMIN_PASSWORD_HASH not configured');
    return false;
  }

  const usernameMatch = username === expectedUsername;
  const passwordMatch = await bcrypt.compare(password, expectedPasswordHash);

  return usernameMatch && passwordMatch;
}

const createDiscountCodeSchema = z.object({
  code: z.string().min(1).max(50).transform(val => val.toUpperCase().trim()),
  description: z.string().optional(),
  discountPercent: z.number().int().refine(val => [10, 20, 30, 40, 50, 100].includes(val), {
    message: 'Discount percent must be one of: 10, 20, 30, 40, 50, 100',
  }),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().default(1),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/discount-codes
 * List all discount codes with usage stats
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
        }
      );
    }

    // Fetch all discount codes
    const { data: codes, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discount codes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discount codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Error in GET /api/admin/discount-codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/discount-codes
 * Create a new discount code
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
        }
      );
    }

    const body = await request.json();
    const validatedData = createDiscountCodeSchema.parse(body);

    // Check if code already exists
    const { data: existing } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('code', validatedData.code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A discount code with this code already exists' },
        { status: 400 }
      );
    }

    // Create the discount code
    const { data: newCode, error } = await supabase
      .from('discount_codes')
      .insert({
        code: validatedData.code,
        description: validatedData.description || null,
        discount_percent: validatedData.discountPercent,
        max_uses: validatedData.maxUses || null,
        max_uses_per_user: validatedData.maxUsesPerUser,
        valid_from: validatedData.validFrom || new Date().toISOString(),
        valid_until: validatedData.validUntil || null,
        is_active: validatedData.isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating discount code:', error);
      return NextResponse.json(
        { error: 'Failed to create discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: newCode,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/discount-codes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
