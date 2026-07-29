import { NextRequest, NextResponse } from 'next/server';
import { unlockCardSchema } from '@/lib/contracts';
import { getRecipientAccessState, verifyCardPasscode } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ip = getClientIp(req);
  const recipientToken = req.cookies.get(`vc_recipient_${id}`)?.value;
  if (await getRecipientAccessState(id, recipientToken) !== 'granted') {
    return NextResponse.json({ error: 'Recipient access required.' }, { status: 403 });
  }

  if (!checkRateLimit(`unlock:${id}:${ip}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many unlock attempts. Please wait a bit.' }, { status: 429 });
  }

  const parsed = unlockCardSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid unlock payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await verifyCardPasscode(id, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: 'Incorrect code' }, { status: 401 });
  }

  return NextResponse.json({ unlocked: true, unlock_token: result.unlockToken });
}
