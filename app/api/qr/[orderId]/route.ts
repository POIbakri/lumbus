import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import QRCode from 'qrcode';
import { buildLPAString } from '@/lib/device-detection';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('smdp, activation_code, qr_url')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.smdp || !order.activation_code) {
      return NextResponse.json({ error: 'Activation details not ready' }, { status: 404 });
    }

    // Generate our own QR code for security
    // Build LPA string from eSIM activation details
    const lpaString = buildLPAString(order.smdp, order.activation_code);

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(lpaString, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=300', // 5 minutes
      },
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json({ error: 'QR code generation failed' }, { status: 500 });
  }
}
