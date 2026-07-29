import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deliverPaymentConfirmation } from '@/services/server/payment-email';
import { getPrivateCard } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { verifyAccessToken } from '@/services/server/security';

export const dynamic = 'force-dynamic';

const retryEmailSchema = z.object({
  card_id: z.string().uuid(),
  receipt_token: z.string().min(20).max(2048),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`payment-email:${ip}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ sent: false, reason: 'RATE_LIMITED' }, { status: 429 });
  }

  const parsed = retryEmailSchema.safeParse(await request.json());
  if (!parsed.success || !verifyAccessToken(parsed.data.receipt_token, parsed.data.card_id, 'receipt')) {
    return NextResponse.json({ sent: false, reason: 'INVALID_RECEIPT' }, { status: 403 });
  }

  const card = await getPrivateCard(parsed.data.card_id);
  if (!card?.is_paid || !card.payment_id) {
    return NextResponse.json({ sent: false, reason: 'CARD_NOT_READY' }, { status: 404 });
  }

  const delivery = await deliverPaymentConfirmation(card.id, card.payment_id);
  return NextResponse.json(
    { sent: delivery.sent, reason: delivery.reason },
    { status: delivery.sent ? 200 : 503 },
  );
}
