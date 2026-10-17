import { NextRequest, NextResponse } from 'next/server';
import { cashfreeVerifySchema } from '@/lib/contracts';
import { verifyCashfreeOrderForCard } from '@/services/server/cashfree';
import { getPublicCard } from '@/services/server/card-store';
import { sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { createAccessToken } from '@/services/server/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`cashfree-verify-payment:${ip}`, 60, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const parsed = cashfreeVerifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid payment verification fields', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await verifyCashfreeOrderForCard(
      parsed.data.card_id,
      parsed.data.order_id,
    );

    if (!result.ok) {
      const reason = result.reason;
      return NextResponse.json(
        {
          error:
            reason === 'CARD_NOT_FOUND'
              ? 'Card not found'
              : reason === 'AMOUNT_MISMATCH'
                ? 'Payment amount does not match this card'
                : reason?.startsWith('PAYMENT_STATUS_')
                  ? `Payment is ${reason.replace('PAYMENT_STATUS_', '').toLowerCase()}. Please try again or refresh.`
                  : 'Could not verify payment with Cashfree',
        },
        { status: reason === 'CARD_NOT_FOUND' ? 404 : 400 },
      );
    }

    const card = await getPublicCard(parsed.data.card_id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const notifications = card
      ? await sendCreatorPaymentVerifiedNotifications({
          creatorEmail: card.card_data.creator_email,
          creatorWhatsapp: card.card_data.creator_whatsapp,
          orderId: card.card_data.order_id || parsed.data.order_id,
          recipientName: card.recipient_name,
          creatorName: card.creator_name,
          trackingUrl: `${baseUrl.replace(/\/$/, '')}/card/${card.id}?ct=${encodeURIComponent(createAccessToken(card.id, 'creator'))}`,
        }).catch((error) => {
          console.error('Creator payment verified notifications failed:', error);
          return null;
        })
      : null;

    return NextResponse.json({
      success: true,
      notifications,
      payment_id: result.paymentId,
      order_id: parsed.data.order_id,
    });
  } catch (error) {
    console.error('Verify Cashfree payment error:', error);
    return NextResponse.json({ error: 'Could not verify Cashfree payment.' }, { status: 500 });
  }
}
