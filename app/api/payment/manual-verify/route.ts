import { NextRequest, NextResponse } from 'next/server';
import { manualPaymentVerifySchema } from '@/lib/contracts';
import { getAdminFromRequest, isAdminConfigured } from '@/services/server/admin-auth';
import { getPublicCard, verifyUpiPaymentReference } from '@/services/server/card-store';
import { sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { createAccessToken } from '@/services/server/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Manual verification is not configured.' }, { status: 503 });
    }

    const admin = getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: 'Admin OTP login required.' }, { status: 401 });

    const ip = getClientIp(req);
    if (!checkRateLimit(`manual-payment-verify:${admin.email}:${ip}`, 30, 60 * 60 * 1000)) {
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

    const card = await getPublicCard(result.card_id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const notifications = card
      ? await sendCreatorPaymentVerifiedNotifications({
          creatorEmail: card.card_data.creator_email,
          creatorWhatsapp: card.card_data.creator_whatsapp,
          orderId: card.card_data.order_id || card.id,
          recipientName: card.recipient_name,
          creatorName: card.creator_name,
          trackingUrl: `${baseUrl.replace(/\/$/, '')}/card/${card.id}?ct=${encodeURIComponent(createAccessToken(card.id, 'creator'))}`,
        }).catch((error) => {
          console.error('Creator payment verified notifications failed:', error);
          return null;
        })
      : null;

    return NextResponse.json({ success: true, notifications, ...result });
  } catch (error) {
    console.error('Manual payment verification error:', error);
    return NextResponse.json({ error: 'Could not manually verify payment.' }, { status: 500 });
  }
}
