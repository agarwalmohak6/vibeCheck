import { NextRequest, NextResponse } from 'next/server';
import { claimRecipientAccess } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ip = getClientIp(req);
  if (!checkRateLimit(`recipient-claim:${id}:${ip}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }
  const claim = await claimRecipientAccess(id);
  if (!claim) return NextResponse.redirect(new URL(`/card/${id}`, req.url), 303);

  const response = NextResponse.redirect(new URL(`/card/${id}`, req.url), 303);
  response.cookies.set(`vc_recipient_${id}`, claim.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: claim.maxAge,
  });
  return response;
}
