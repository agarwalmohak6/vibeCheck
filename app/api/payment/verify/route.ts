import { NextRequest, NextResponse } from 'next/server';
import { paymentVerifySchema } from '@/lib/contracts';
import { verifyRazorpayCheckoutPayment } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { deliverPaymentConfirmation } from '@/services/server/payment-email';

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
      const isMissingCard = result.reason === 'CARD_NOT_FOUND';
      return NextResponse.json(
        {
          error: isMissingCard
            ? 'Card not found'
            : result.reason === 'PAYMENT_MISMATCH'
              ? 'Payment does not match this card, amount, or captured status'
              : 'Payment verification failed',
        },
        { status: isMissingCard ? 404 : 400 },
      );
    }

    const delivery = await deliverPaymentConfirmation(parsed.data.card_id, parsed.data.razorpay_payment_id);
    return NextResponse.json({
      success: true,
      card_id: parsed.data.card_id,
      receipt_url: delivery.receiptUrl,
      email_sent: delivery.sent,
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }
}
