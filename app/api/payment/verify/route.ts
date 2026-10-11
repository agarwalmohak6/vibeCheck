import { NextRequest, NextResponse } from 'next/server';
import { paymentVerifySchema } from '@/lib/contracts';
import { getPublicCard } from '@/services/server/card-store';
import { sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';
import { verifyRazorpayCheckoutPayment } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { createAccessToken } from '@/services/server/security';

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
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }
}
