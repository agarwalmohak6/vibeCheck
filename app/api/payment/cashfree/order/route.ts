import { NextRequest, NextResponse } from 'next/server';
import { cashfreeOrderSchema } from '@/lib/contracts';
import { isCashfreeCheckoutVisible } from '@/lib/paymentAvailability';
import { createCashfreeOrderForCard, isCashfreeConfigured } from '@/services/server/cashfree';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Credentials do not imply merchant approval. Keep new checkout off until
    // Cashfree has approved the account and both deployment switches are enabled.
    if (
      process.env.CASHFREE_CHECKOUT_ENABLED !== 'true' ||
      !isCashfreeCheckoutVisible()
    ) {
      return NextResponse.json(
        {
          code: 'CASHFREE_CHECKOUT_UNAVAILABLE',
          error: 'Cashfree checkout is unavailable. Please use direct UPI and submit the Transaction ID for verification.',
        },
        { status: 503 },
      );
    }

    const allowMock =
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';

    if (!isCashfreeConfigured() && !allowMock) {
      return NextResponse.json(
        { error: 'Cashfree credentials are not configured.' },
        { status: 401 },
      );
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`cashfree-create-order:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const parsed = cashfreeOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payment order payload.', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const origin = req.nextUrl.origin;
    const order = await createCashfreeOrderForCard(parsed.data.card_id, origin);
    if (!order) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (order.already_paid) {
      return NextResponse.json({ success: true, already_paid: true });
    }

    return NextResponse.json({ success: true, ...order });
  } catch (error) {
    console.error('Create Cashfree order error:', error);
    const message =
      error instanceof Error ? error.message : 'Could not create Cashfree order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
