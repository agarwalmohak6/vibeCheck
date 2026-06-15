import { NextRequest, NextResponse } from 'next/server';
import { createCardSchema } from '@/lib/contracts';
import { createCardDraft, getPaymentStatus, getPublicCard } from '@/services/server/card-store';
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

    const { card, creatorToken } = await createCardDraft(parsed.data);
    return NextResponse.json({
      id: card.id,
      url: `/card/${card.id}`,
      creator_token: creatorToken,
      creator_url: `/card/${card.id}?ct=${encodeURIComponent(creatorToken)}`,
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
