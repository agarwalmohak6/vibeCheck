import { NextRequest, NextResponse } from 'next/server';
import { paymentWebhookSchema } from '@/lib/contracts';
import { isMockPaymentsEnabled } from '@/services/server/config';
import { markCardPaymentVerified } from '@/services/server/card-store';
import { verifyRazorpayWebhook } from '@/services/server/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const isVerifiedWebhook = verifyRazorpayWebhook(rawBody, signature);
    const isAllowedMock = isMockPaymentsEnabled() && req.headers.get('x-vibecheck-mock-payment') === 'true';

    if (!isVerifiedWebhook && !isAllowedMock) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 401 });
    }

    const body = JSON.parse(rawBody || '{}') as Record<string, unknown>;
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
          status: razorpayPayment.status,
        }
      : body;

    const parsed = paymentWebhookSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const paidStatuses = new Set(['authorized', 'captured', 'paid', 'success']);
    const status = (parsed.data.status || 'success').toLowerCase();
    if (!paidStatuses.has(status)) {
      return NextResponse.json({ success: true, ignored: true, status });
    }

    const paymentId = parsed.data.payment_id || `verified_${Date.now()}`;
    const ok = await markCardPaymentVerified(parsed.data.card_id, paymentId, parsed.data.extends_at);
    if (!ok) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    return NextResponse.json({ success: true, card_id: parsed.data.card_id });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
