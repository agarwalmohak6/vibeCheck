import { NextRequest, NextResponse } from 'next/server';
import { paymentOrderSchema } from '@/lib/contracts';
import { createRazorpayOrderForCard, isRazorpayConfigured } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

function getRazorpayStatus(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    Number((error as { statusCode?: number }).statusCode) === 401
  ) {
    return 401;
  }

  return 500;
}

export async function POST(req: NextRequest) {
  try {
    const allowMock = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';
    if (!isRazorpayConfigured() && !allowMock) {
      return NextResponse.json({ error: 'Razorpay credentials are not configured.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`razorpay-create-order:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many payment attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = paymentOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payment order payload.', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const order = await createRazorpayOrderForCard(parsed.data.card_id);
    if (!order) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (!order.order_id) {
      return NextResponse.json({ success: true, already_paid: true });
    }

    return NextResponse.json({ success: true, ...order });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    const status = getRazorpayStatus(error);
    return NextResponse.json(
      { error: status === 401 ? 'Razorpay authentication failed.' : 'Could not create Razorpay order.' },
      { status },
    );
  }
}
