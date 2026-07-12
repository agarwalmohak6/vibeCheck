import { NextRequest, NextResponse } from 'next/server';
import { paymentOrderSchema, razorpayCreateOrderSchema } from '@/lib/contracts';
import { createRazorpayOrder, createRazorpayOrderForCard, isRazorpayConfigured } from '@/services/server/payment-gateway';
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
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Razorpay credentials are not configured.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`razorpay-create-order:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many payment attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const cardOrder = paymentOrderSchema.safeParse(body);
    if (cardOrder.success) {
      const order = await createRazorpayOrderForCard(cardOrder.data.card_id);
      if (!order) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      if (!order.order_id) {
        return NextResponse.json({ success: true, already_paid: true });
      }

      return NextResponse.json({ success: true, ...order });
    }

    const parsed = razorpayCreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid order payload. Send either card_id or amount/currency/receipt.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const order = await createRazorpayOrder(parsed.data);
    return NextResponse.json({
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      key_id: order.key_id,
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    const status = getRazorpayStatus(error);
    return NextResponse.json(
      { error: status === 401 ? 'Razorpay authentication failed.' : 'Could not create Razorpay order.' },
      { status },
    );
  }
}
