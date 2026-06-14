import { NextRequest, NextResponse } from 'next/server';
import { createCard, getCard } from '@/lib/supabase';
import { computeExpiresAt } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient_name,
      creator_name,
      template_type,
      theme_selected = 'midnight_romance',
      card_data,
      tier_selected,
      music_track_id,
    } = body;

    if (!recipient_name || !creator_name || !template_type || !card_data || !tier_selected) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expires_at = computeExpiresAt(tier_selected);

    const card = await createCard({
      recipient_name,
      creator_name,
      template_type,
      theme_selected,
      card_data,
      tier_selected,
      expires_at,
      music_track_id,
    });

    return NextResponse.json({
      id: card.id,
      url: `/card/${card.id}`,
      card,
    });
  } catch (err) {
    console.error('Card creation error:', err);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const card = await getCard(id);
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  return NextResponse.json(card);
}
