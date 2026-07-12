import { NextRequest, NextResponse } from 'next/server';
import { creatorCardClaimSchema } from '@/lib/contracts';
import { claimCreatorCard } from '@/services/server/card-store';
import { getCreatorSessionFromRequest } from '@/services/server/creator-auth';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = getCreatorSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

    const ip = getClientIp(req);
    if (!checkRateLimit(`creator-claim:${session.accountId}:${ip}`, 40, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many card claim attempts. Please try later.' }, { status: 429 });
    }

    const parsed = creatorCardClaimSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid card claim payload.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const card = await claimCreatorCard(parsed.data.card_id, parsed.data.creator_token, session.accountId);
    if (!card) {
      return NextResponse.json({ error: 'Could not claim this card. Creator link may be invalid.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, card_id: parsed.data.card_id });
  } catch (error) {
    console.error('Creator card claim error:', error);
    return NextResponse.json({ error: 'Could not claim card.' }, { status: 500 });
  }
}
