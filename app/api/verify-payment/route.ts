import { NextRequest, NextResponse } from 'next/server';
import { razorpayVerifyPaymentSchema } from '@/lib/contracts';
import { verifyRazorpayPaymentSignature } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`razorpay-verify-payment:${ip}`, 60, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many verification attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = razorpayVerifyPaymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid payment verification fields', issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await verifyRazorpayPaymentSignature(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'CARD_NOT_FOUND' ? 'Card not found' : 'Payment signature mismatch' },
        { status: result.reason === 'CARD_NOT_FOUND' ? 404 : 400 },
      );
    }

    return NextResponse.json({
      success: true,
      payment_id: parsed.data.razorpay_payment_id,
      order_id: parsed.data.razorpay_order_id,
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    return NextResponse.json({ error: 'Could not verify Razorpay payment.' }, { status: 500 });
  }
}
