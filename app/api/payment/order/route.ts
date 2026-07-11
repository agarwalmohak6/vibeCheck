import { NextRequest, NextResponse } from 'next/server';
import { paymentOrderSchema } from '@/lib/contracts';
import { createRazorpayOrderForCard, isRazorpayConfigured } from '@/services/server/payment-gateway';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Automatic payments are not configured yet.' }, { status: 503 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`payment-order:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many payment attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = paymentOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment order payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const order = await createRazorpayOrderForCard(parsed.data.card_id);
    if (!order) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (!order.order_id) {
      return NextResponse.json({ success: true, already_paid: true });
    }

    return NextResponse.json({ success: true, ...order });
  } catch (err) {
    console.error('Payment order error:', err);
    return NextResponse.json({ error: 'Could not create payment order' }, { status: 500 });
  }
}
