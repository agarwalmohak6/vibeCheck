import { NextRequest, NextResponse } from 'next/server';
import { paymentWebhookSchema } from '@/lib/contracts';
import { isMockPaymentsEnabled } from '@/services/server/config';
import { markCardPaymentVerified } from '@/services/server/card-store';
import { validateCapturedRazorpayPayment } from '@/services/server/payment-gateway';
import { verifyRazorpayWebhook } from '@/services/server/security';
import { deliverPaymentConfirmation } from '@/services/server/payment-email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const isVerifiedWebhook = verifyRazorpayWebhook(rawBody, signature);
    const isAllowedMock = isMockPaymentsEnabled() && req.headers.get('x-vibecheck-mock-payment') === 'true';

    if (isAllowedMock) {
      const parsedMock = paymentWebhookSchema.safeParse(JSON.parse(rawBody || '{}'));
      if (!parsedMock.success) {
        return NextResponse.json(
          { error: 'Invalid mock payment payload', issues: parsedMock.error.flatten() },
          { status: 400 },
        );
      }
      const paymentId = parsedMock.data.payment_id || `mock_verified_${Date.now()}`;
      const ok = await markCardPaymentVerified(
        parsedMock.data.card_id,
        paymentId,
        parsedMock.data.extends_at,
      );
      if (!ok) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      await deliverPaymentConfirmation(parsedMock.data.card_id, paymentId);
      return NextResponse.json({ success: true, card_id: parsedMock.data.card_id, mock: true });
    }

    if (!isVerifiedWebhook) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 401 });
    }

    const body = JSON.parse(rawBody || '{}') as Record<string, unknown>;
    const event = typeof body.event === 'string' ? body.event : '';
    if (!['payment.captured', 'order.paid'].includes(event)) {
      return NextResponse.json({ success: true, ignored: true, event });
    }

    const razorpayPayment = (
      body.payload &&
      typeof body.payload === 'object' &&
      'payment' in body.payload &&
      typeof body.payload.payment === 'object' &&
      body.payload.payment &&
      'entity' in body.payload.payment &&
      typeof body.payload.payment.entity === 'object'
    )
      ? body.payload.payment.entity as Record<string, unknown>
      : null;

    const normalizedBody = razorpayPayment
      ? {
          card_id: typeof razorpayPayment.notes === 'object' && razorpayPayment.notes
            ? (razorpayPayment.notes as Record<string, unknown>).card_id
            : undefined,
          payment_id: razorpayPayment.id,
          order_id: razorpayPayment.order_id,
          status: razorpayPayment.status,
        }
      : body;

    const parsed = paymentWebhookSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const status = (parsed.data.status || '').toLowerCase();
    if (status !== 'captured') {
      return NextResponse.json({ success: true, ignored: true, status });
    }

    if (!parsed.data.payment_id || !parsed.data.order_id) {
      return NextResponse.json({ error: 'Webhook is missing payment or order ID' }, { status: 400 });
    }

    const isValidPayment = await validateCapturedRazorpayPayment(
      parsed.data.card_id,
      parsed.data.order_id,
      parsed.data.payment_id,
    );
    if (!isValidPayment) {
      return NextResponse.json({ error: 'Payment does not match this card or tier' }, { status: 400 });
    }

    const ok = await markCardPaymentVerified(
      parsed.data.card_id,
      parsed.data.payment_id,
      parsed.data.extends_at,
      parsed.data.order_id,
    );
    if (!ok) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    await deliverPaymentConfirmation(parsed.data.card_id, parsed.data.payment_id);

    return NextResponse.json({ success: true, card_id: parsed.data.card_id });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
