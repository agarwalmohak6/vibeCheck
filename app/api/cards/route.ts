import { NextRequest, NextResponse } from 'next/server';
import { createCardSchema } from '@/lib/contracts';
import { createCardDraft, getPaymentStatus, getPublicCard } from '@/services/server/card-store';
import { getCreatorSessionFromRequest } from '@/services/server/creator-auth';
import { sendCreatorOrderNotifications } from '@/services/server/notifications';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`cards:create:${ip}`, 12, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many card attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = createCardSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid card payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const creatorSession = getCreatorSessionFromRequest(req);
    const { card, creatorToken } = await createCardDraft(parsed.data, creatorSession?.accountId);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const creatorUrl = `${baseUrl}/card/${card.id}?ct=${encodeURIComponent(creatorToken)}`;
    const creatorEmail = card.card_data.creator_email?.trim();
    const creatorWhatsapp = card.card_data.creator_whatsapp?.trim();
    const notifications = await sendCreatorOrderNotifications({
      creatorEmail,
      creatorWhatsapp,
      orderId: card.card_data.order_id || card.id,
      recipientName: card.recipient_name,
      creatorName: card.creator_name,
      trackingUrl: creatorUrl,
    }).catch((error) => {
      console.error('Creator order notifications failed:', error);
      return null;
    });

    return NextResponse.json({
      id: card.id,
      url: `/card/${card.id}`,
      creator_token: creatorToken,
      creator_url: `/card/${card.id}?ct=${encodeURIComponent(creatorToken)}`,
      notifications,
      card,
    });
  } catch (err) {
    console.error('Card creation error:', err);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const statusOnly = req.nextUrl.searchParams.get('status') === 'payment';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (statusOnly) {
    const status = await getPaymentStatus(id);
    if (!status) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    return NextResponse.json(status);
  }

  const card = await getPublicCard(id);
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  return NextResponse.json(card);
}
