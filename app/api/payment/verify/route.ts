import { NextRequest, NextResponse } from 'next/server';
import { paymentVerifySchema } from '@/lib/contracts';
import { notifyCreatorCardReady } from '@/services/server/notify-card-ready';
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

    const notifications = await notifyCreatorCardReady(parsed.data.card_id, req.nextUrl.origin);

    return NextResponse.json({ success: true, notifications, card_id: parsed.data.card_id });
  } catch (err) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }
}
