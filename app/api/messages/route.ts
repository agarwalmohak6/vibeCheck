import { NextRequest, NextResponse } from 'next/server';
import { sendMessageSchema } from '@/lib/contracts';
import { getMessagesForCard, sendCardMessage } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get('card_id');
  if (!cardId) return NextResponse.json({ error: 'Missing card_id' }, { status: 400 });

  const messages = await getMessagesForCard(cardId);
  return NextResponse.json(messages);
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

    const creatorToken = req.headers.get('x-vibecheck-creator-token');
    const message = await sendCardMessage(
      parsed.data.card_id,
      parsed.data.sender,
      parsed.data.text,
      creatorToken
    );
    if (!message) return NextResponse.json({ error: 'Creator token required' }, { status: 403 });
    return NextResponse.json(message);
  } catch (err) {
    console.error('Message send error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
