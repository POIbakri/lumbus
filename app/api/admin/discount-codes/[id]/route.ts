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
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedPasswordHash) {
    return false;
  }

  return username === expectedUsername && await bcrypt.compare(password, expectedPasswordHash);
}

const updateDiscountCodeSchema = z.object({
  description: z.string().optional(),
  discountPercent: z.number().int().refine(val => [10, 20, 30, 40, 50, 100].includes(val), {
    message: 'Discount percent must be one of: 10, 20, 30, 40, 50, 100',
  }).optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/discount-codes/[id]
 * Update a discount code
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDiscountCodeSchema.parse(body);

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.discountPercent !== undefined) updateData.discount_percent = validatedData.discountPercent;
    if (validatedData.maxUses !== undefined) updateData.max_uses = validatedData.maxUses;
    if (validatedData.maxUsesPerUser !== undefined) updateData.max_uses_per_user = validatedData.maxUsesPerUser;
    if (validatedData.validFrom !== undefined) updateData.valid_from = validatedData.validFrom;
    if (validatedData.validUntil !== undefined) updateData.valid_until = validatedData.validUntil;
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive;

    // Update the discount code
    const { data: updatedCode, error } = await supabase
      .from('discount_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount code:', error);
      return NextResponse.json(
        { error: 'Failed to update discount code' },
        { status: 500 }
      );
    }

    if (!updatedCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      code: updatedCode,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/discount-codes/[id]:', error);
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

/**
 * DELETE /api/admin/discount-codes/[id]
 * Delete a discount code
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Delete the discount code
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount code:', error);
      return NextResponse.json(
        { error: 'Failed to delete discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discount code deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/discount-codes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
