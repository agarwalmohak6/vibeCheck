import { NextRequest, NextResponse } from 'next/server';
import { razorpayVerifyPaymentSchema } from '@/lib/contracts';
import { getPublicCard } from '@/services/server/card-store';
import { sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';
import { verifyRazorpayCheckoutPayment, verifyRazorpayPaymentSignature } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { createAccessToken } from '@/services/server/security';

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

    const result = parsed.data.card_id
      ? await verifyRazorpayCheckoutPayment({
          card_id: parsed.data.card_id,
          razorpay_order_id: parsed.data.razorpay_order_id,
          razorpay_payment_id: parsed.data.razorpay_payment_id,
          razorpay_signature: parsed.data.razorpay_signature,
        })
      : await verifyRazorpayPaymentSignature(parsed.data);
    if (!result.ok) {
      const reason = result.reason;
      return NextResponse.json(
        {
          error:
            reason === 'CARD_NOT_FOUND'
              ? 'Card not found'
              : reason === 'AMOUNT_MISMATCH'
                ? 'Payment amount does not match this card'
                : reason === 'ORDER_MISMATCH'
                  ? 'Payment order does not match this card'
                  : reason === 'PAYMENT_NOT_CAPTURED'
                    ? 'Payment is still being captured. Keep this page open for a moment.'
                    : 'Payment signature mismatch',
        },
        { status: reason === 'CARD_NOT_FOUND' ? 404 : reason === 'PAYMENT_NOT_CAPTURED' ? 409 : 400 },
      );
    }

    const card = parsed.data.card_id ? await getPublicCard(parsed.data.card_id) : null;
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

    return NextResponse.json({
      success: true,
      notifications,
      payment_id: parsed.data.razorpay_payment_id,
      order_id: parsed.data.razorpay_order_id,
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    return NextResponse.json({ error: 'Could not verify Razorpay payment.' }, { status: 500 });
  }
}
