import { NextRequest, NextResponse } from 'next/server';
import { sendMessageSchema } from '@/lib/contracts';
import { getMessagesForCard, getPublicCard, sendCardMessage } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { verifyAccessToken } from '@/services/server/security';
import { isExpired } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function hasRoomAccess(req: NextRequest, card: NonNullable<Awaited<ReturnType<typeof getPublicCard>>>) {
  return !card.card_data.has_secret_code ||
    verifyAccessToken(req.headers.get('x-vibecheck-creator-token'), card.id, 'creator') ||
    verifyAccessToken(req.headers.get('x-vibecheck-unlock-token'), card.id, 'unlock');
}

export async function GET(req: NextRequest) {
  try {
    const cardId = req.nextUrl.searchParams.get('card_id');
    if (!cardId) return NextResponse.json({ error: 'Missing card_id' }, { status: 400 });
    const card = await getPublicCard(cardId);
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    if (isExpired(card.expires_at)) return NextResponse.json({ error: 'Chat room expired' }, { status: 410 });
    if (!hasRoomAccess(req, card)) return NextResponse.json({ error: 'Unlock this card before entering the room' }, { status: 403 });
    return NextResponse.json(await getMessagesForCard(cardId));
  } catch (error) {
    console.error('Reply room read failed:', error);
    return NextResponse.json({ error: 'Your replies could not load. Please try again.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`messages:${ip}`, 60, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 });
    }

    const parsed = sendMessageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const card = await getPublicCard(parsed.data.card_id);
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    if (isExpired(card.expires_at)) return NextResponse.json({ error: 'Chat room expired' }, { status: 410 });

    if (!hasRoomAccess(req, card)) return NextResponse.json({ error: 'Unlock this card before replying' }, { status: 403 });
    const creatorToken = req.headers.get('x-vibecheck-creator-token');
    const message = await sendCardMessage(
      parsed.data.card_id,
      parsed.data.sender,
      parsed.data.text,
      creatorToken,
      parsed.data.message_id
    );
    if (!message) return NextResponse.json({ error: 'Creator token required' }, { status: 403 });
    return NextResponse.json(message);
  } catch (err) {
    console.error('Message send error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
