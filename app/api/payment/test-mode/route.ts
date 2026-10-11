import { NextRequest, NextResponse } from 'next/server';
import { testPaymentModeSchema } from '@/lib/contracts';
import { markCardPaymentTestMode } from '@/services/server/card-store';
import { isTestPaymentsEnabled } from '@/services/server/config';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { verifyAccessToken } from '@/services/server/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!isTestPaymentsEnabled()) {
      return NextResponse.json({ error: 'Test mode payments are disabled.' }, { status: 403 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`payment-test-mode:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many test mode attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = testPaymentModeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid test mode payment payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const creatorToken = req.headers.get('x-vibecheck-creator-token');
    if (creatorToken && !verifyAccessToken(creatorToken, parsed.data.card_id, 'creator')) {
      return NextResponse.json({ error: 'Invalid creator token for test mode.' }, { status: 401 });
    }
    if (process.env.NODE_ENV === 'production' && !creatorToken) {
      return NextResponse.json({ error: 'Creator token is required for production test mode.' }, { status: 401 });
    }

    const result = await markCardPaymentTestMode(parsed.data.card_id, parsed.data.reason || undefined);
    if (!result) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Test mode payment error:', error);
    return NextResponse.json({ error: 'Could not skip payment in test mode.' }, { status: 500 });
  }
}
