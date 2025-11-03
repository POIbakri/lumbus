import { NextRequest, NextResponse } from 'next/server';
import { linkReferrer } from '@/lib/referral';
import { z } from 'zod';

const linkSchema = z.object({
  userId: z.string().uuid(),
  referralCode: z.string().min(8).max(8).regex(/^[A-Z0-9]+$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, referralCode } = linkSchema.parse(body);

    // Link the referral code to the user
    const linked = await linkReferrer(userId, referralCode.toUpperCase().trim());

    if (linked) {
      return NextResponse.json({
        success: true,
        message: '10% OFF + 1GB FREE data applied! Your friend gets 1GB too!',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid referral code or you already have orders. Referral codes are for first-time buyers only.',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error linking referral:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Referral codes must be exactly 8 characters (letters and numbers only).',
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to link referral code. Please try again.',
    }, { status: 500 });
  }
}
