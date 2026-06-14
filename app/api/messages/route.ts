import { NextRequest, NextResponse } from 'next/server';
import { getMessages, sendMessage } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get('card_id');
  if (!cardId) return NextResponse.json({ error: 'Missing card_id' }, { status: 400 });

  const messages = await getMessages(cardId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { card_id, sender, text } = body;

    if (!card_id || !sender || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await sendMessage({ card_id, sender, text });
    return NextResponse.json(message);
  } catch (err) {
    console.error('Message send error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
