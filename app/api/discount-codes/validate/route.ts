import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { z } from 'zod';

const validateSchema = z.object({
  code: z.string().min(1),
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = validateSchema.parse(body);

    // Call the database function to validate the code
    const { data, error } = await supabase
      .rpc('validate_discount_code', {
        p_code: code.toUpperCase().trim(),
        p_user_id: userId,
      });

    if (error) {
      console.error('Error validating discount code:', error);
      return NextResponse.json(
        { error: 'Failed to validate discount code' },
        { status: 500 }
      );
    }

    // The function returns an object with is_valid, discount_percent, and error_message
    const result = Array.isArray(data) ? data[0] : data;

    if (!result.is_valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error_message || 'Invalid discount code',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      discountPercent: result.discount_percent,
    });
  } catch (error) {
    console.error('Error in discount code validation:', error);
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
