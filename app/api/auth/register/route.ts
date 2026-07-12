import { NextRequest, NextResponse } from 'next/server';
import { creatorAuthSchema } from '@/lib/contracts';
import { registerCreator, setCreatorCookie } from '@/services/server/creator-auth';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`creator-register:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many account attempts. Please try later.' }, { status: 429 });
    }

    const parsed = creatorAuthSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter an email or mobile number and a password.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await registerCreator(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: 'That account already exists. Log in with the original password.' }, { status: 409 });
    }

    const response = NextResponse.json({ success: true, account: result.account, existing: result.existing });
    setCreatorCookie(response, result.account.id);
    return response;
  } catch (error) {
    console.error('Creator register error:', error);
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 });
  }
}
