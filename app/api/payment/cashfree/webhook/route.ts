import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhookSignature } from '@/services/server/cashfree';
import { getPublicCard, markCardPaymentVerified } from '@/services/server/card-store';
import { sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';
import { createAccessToken } from '@/services/server/security';
import { getSupabaseAdmin } from '@/services/server/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    const isValid = verifyCashfreeWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type || payload.event;
    const orderData = payload.data?.order || payload.data;
    const paymentData = payload.data?.payment;

    const orderId = String(orderData?.order_id || '');
    const paymentId = String(paymentData?.cf_payment_id || orderId);

    let cardId: string | null = null;
    const orderTags = orderData?.order_tags;
    if (orderTags && typeof orderTags.card_id === 'string') {
      cardId = orderTags.card_id;
    }

    const admin = getSupabaseAdmin();
    if (!cardId && admin && orderId) {
      const { data: paymentRecord } = await admin
        .from('payments')
        .select('card_id')
        .eq('provider_order_id', orderId)
        .maybeSingle();
      if (paymentRecord?.card_id) {
        cardId = paymentRecord.card_id;
      }
    }

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || orderData?.order_status === 'PAID') {
      if (cardId) {
        await markCardPaymentVerified(cardId, paymentId, undefined, orderId, 'cashfree');
        const card = await getPublicCard(cardId);
        if (card) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
          await sendCreatorPaymentVerifiedNotifications({
            creatorEmail: card.card_data.creator_email,
            creatorWhatsapp: card.card_data.creator_whatsapp,
            orderId: card.card_data.order_id || orderId,
            recipientName: card.recipient_name,
            creatorName: card.creator_name,
            trackingUrl: `${baseUrl.replace(/\/$/, '')}/card/${card.id}?ct=${encodeURIComponent(createAccessToken(card.id, 'creator'))}`,
          }).catch((err) => {
            console.error('Webhook notification error:', err);
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
