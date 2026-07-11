import { NextRequest, NextResponse } from 'next/server';
import { paymentReferenceSchema } from '@/lib/contracts';
import { submitUpiPaymentReference } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`payment-reference:${ip}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many reference submissions. Please try again later.' }, { status: 429 });
    }

    const parsed = paymentReferenceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid UTR/reference payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const status = await submitUpiPaymentReference(parsed.data.card_id, parsed.data.utr);
    if (!status) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    if (err instanceof Error && err.message === 'PAYMENT_REFERENCE_ALREADY_USED') {
      return NextResponse.json({ error: 'This UPI reference is already linked to another card.' }, { status: 409 });
    }

    console.error('Payment reference submit error:', err);
    return NextResponse.json({ error: 'Could not submit payment reference' }, { status: 500 });
  }
}
