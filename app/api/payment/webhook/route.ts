import { NextRequest, NextResponse } from 'next/server';
import { markCardPaid } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Simulated payment handler — also acts as Razorpay webhook endpoint
// POST /api/payment/webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Simulated payment: body = { card_id, payment_id }
    const { card_id, payment_id } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'Missing card_id' }, { status: 400 });
    }

    await markCardPaid(card_id, payment_id || `mock_${Date.now()}`);

    return NextResponse.json({ success: true, card_id });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
