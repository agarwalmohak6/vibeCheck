import { NextRequest, NextResponse } from 'next/server';
import { creatorAuthSchema } from '@/lib/contracts';
import { loginCreator, setCreatorCookie } from '@/services/server/creator-auth';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`creator-login:${ip}`, 15, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many login attempts. Please try later.' }, { status: 429 });
    }

    const parsed = creatorAuthSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter your email/mobile and password.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await loginCreator(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: 'Invalid email/mobile or password.' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, account: result.account });
    setCreatorCookie(response, result.account.id);
    return response;
  } catch (error) {
    console.error('Creator login error:', error);
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 });
  }
}
