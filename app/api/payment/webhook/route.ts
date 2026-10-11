import { NextRequest, NextResponse } from 'next/server';
import { paymentWebhookSchema } from '@/lib/contracts';
import { isMockPaymentsEnabled } from '@/services/server/config';
import { getCardIdForProviderOrder, getPublicCard, markCardPaymentVerified } from '@/services/server/card-store';
import { createAccessToken, verifyRazorpayWebhook } from '@/services/server/security';
import { verifyRazorpayWebhookPayment } from '@/services/server/payment-gateway';
import { sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';

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

    const paymentNotes = razorpayPayment && typeof razorpayPayment.notes === 'object' && razorpayPayment.notes
      ? razorpayPayment.notes as Record<string, unknown>
      : null;
    const paymentOrderId = razorpayPayment && typeof razorpayPayment.order_id === 'string'
      ? razorpayPayment.order_id
      : undefined;
    const notesCardId = paymentNotes && typeof paymentNotes.card_id === 'string'
      ? paymentNotes.card_id
      : undefined;
    const recoveredCardId = !notesCardId && paymentOrderId
      ? await getCardIdForProviderOrder(paymentOrderId)
      : null;

    const normalizedBody = razorpayPayment
      ? {
          card_id: notesCardId || recoveredCardId || undefined,
          payment_id: razorpayPayment.id,
          order_id: paymentOrderId,
          amount: razorpayPayment.amount,
          currency: razorpayPayment.currency,
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
    const paymentCheck = await verifyRazorpayWebhookPayment({
      cardId: parsed.data.card_id,
      orderId: parsed.data.order_id,
      paymentId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
    });
    if (!paymentCheck.ok) {
      return NextResponse.json({ error: 'Payment could not be matched to this card.' }, { status: 400 });
    }

    const ok = await markCardPaymentVerified(
      parsed.data.card_id,
      paymentId,
      parsed.data.extends_at,
      parsed.data.order_id,
    );
    if (!ok) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const card = await getPublicCard(parsed.data.card_id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const notifications = card
      ? await sendCreatorPaymentVerifiedNotifications({
          creatorEmail: card.card_data.creator_email,
          creatorWhatsapp: card.card_data.creator_whatsapp,
          orderId: card.card_data.order_id || card.id,
          recipientName: card.recipient_name,
          creatorName: card.creator_name,
          trackingUrl: `${baseUrl.replace(/\/$/, '')}/card/${card.id}?ct=${encodeURIComponent(createAccessToken(card.id, 'creator'))}`,
        }).catch((error) => {
          console.error('Creator payment verified notifications failed:', error);
          return null;
        })
      : null;

    return NextResponse.json({ success: true, notifications, card_id: parsed.data.card_id });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
