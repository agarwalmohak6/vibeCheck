import { NextRequest, NextResponse } from 'next/server';
import { paymentVerifySchema } from '@/lib/contracts';
import { verifyRazorpayCheckoutPayment } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`payment-verify:${ip}`, 60, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many verification attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = paymentVerifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment verification payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await verifyRazorpayCheckoutPayment(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'CARD_NOT_FOUND' ? 'Card not found' : 'Payment verification failed' },
        { status: result.reason === 'CARD_NOT_FOUND' ? 404 : 401 },
      );
    }

    return NextResponse.json({ success: true, card_id: parsed.data.card_id });
  } catch (err) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }
}
