import { NextRequest, NextResponse } from 'next/server';
import { manualPaymentVerifySchema } from '@/lib/contracts';
import { verifyUpiPaymentReference } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

function isAllowed(req: NextRequest) {
  const secret = process.env.VIBECHECK_ADMIN_SECRET;
  if (!secret) return false;

  const headerSecret = req.headers.get('x-vibecheck-admin-secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return headerSecret === secret || bearer === secret;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.VIBECHECK_ADMIN_SECRET) {
      return NextResponse.json({ error: 'Manual verification is not configured.' }, { status: 503 });
    }

    if (!isAllowed(req)) {
      return NextResponse.json({ error: 'Unauthorized manual verification request.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`manual-payment-verify:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many manual verification attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = manualPaymentVerifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid UTR payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await verifyUpiPaymentReference(parsed.data.utr);
    if (!result) {
      return NextResponse.json({ error: 'No submitted UTR found for this reference.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Manual payment verification error:', error);
    return NextResponse.json({ error: 'Could not manually verify payment.' }, { status: 500 });
  }
}
