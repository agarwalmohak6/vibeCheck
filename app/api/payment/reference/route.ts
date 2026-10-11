import { NextRequest, NextResponse } from 'next/server';
import { paymentReferenceSchema } from '@/lib/contracts';
import { getPublicCard, submitUpiPaymentReference } from '@/services/server/card-store';
import { sendAdminPaymentReviewNotifications } from '@/services/server/notifications';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`payment-reference:${ip}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many reference submissions. Please try again later.' }, { status: 429 });
    }

    const parsed = paymentReferenceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Enter the UPI UTR or transaction reference.' },
        { status: 400 },
      );
    }

    const status = await submitUpiPaymentReference(parsed.data.card_id, parsed.data.utr);
    if (!status) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const card = await getPublicCard(parsed.data.card_id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const notifications = card
      ? await sendAdminPaymentReviewNotifications({
          baseUrl,
          orderId: card.card_data.order_id || card.id,
          cardId: card.id,
          recipientName: card.recipient_name,
          creatorName: card.creator_name,
          paymentReference: status.payment_reference || parsed.data.utr,
        }).catch((error) => {
          console.error('Admin payment review notifications failed:', error);
          return null;
        })
      : null;

    return NextResponse.json({ success: true, notifications, ...status });
  } catch (err) {
    if (err instanceof Error && err.message === 'PAYMENT_REFERENCE_ALREADY_USED') {
      return NextResponse.json({ error: 'This UPI reference is already linked to another card.' }, { status: 409 });
    }

    console.error('Payment reference submit error:', err);
    return NextResponse.json({ error: 'Could not submit payment reference' }, { status: 500 });
  }
}
