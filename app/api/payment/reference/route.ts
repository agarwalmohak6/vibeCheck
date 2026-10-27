import { NextRequest, NextResponse } from 'next/server';
import { paymentReferenceSchema } from '@/lib/contracts';
import { getPublicCard, getPaymentStatus, submitUpiPaymentReference } from '@/services/server/card-store';
import { tryAxisAutoApproval } from '@/services/server/axis-auto-approval';
import { getSupabaseAdmin } from '@/services/server/supabase-admin';
import { sendAdminPaymentReviewNotifications } from '@/services/server/notifications';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && !getSupabaseAdmin()) {
      return NextResponse.json({ error: 'Payment reference storage is temporarily unavailable. Please do not pay again; contact support.' }, { status: 503 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`payment-reference:${ip}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many reference submissions. Please try again later.' }, { status: 429 });
    }

    const parsed = paymentReferenceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Enter the Transaction ID.' },
        { status: 400 },
      );
    }

    const status = await submitUpiPaymentReference(parsed.data.card_id, parsed.data.utr);
    if (!status) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const card = await getPublicCard(parsed.data.card_id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const autoVerification = card ? await tryAxisAutoApproval(card, parsed.data.utr, baseUrl) : 'disabled';
    if (autoVerification === 'verified') {
      return NextResponse.json({ success: true, auto_verification: 'verified', ...await getPaymentStatus(parsed.data.card_id) });
    }
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

    return NextResponse.json({ success: true, notifications, auto_verification: autoVerification, ...status });
  } catch (err) {
    if (err instanceof Error && err.message === 'PAYMENT_REFERENCE_ALREADY_USED') {
      return NextResponse.json({ error: 'This UPI reference is already linked to another card.' }, { status: 409 });
    }

    console.error('Payment reference submit error:', err);
    return NextResponse.json({ error: 'Could not submit payment reference' }, { status: 500 });
  }
}
