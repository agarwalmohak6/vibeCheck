import { NextRequest, NextResponse } from 'next/server';
import { manualPaymentVerifySchema } from '@/lib/contracts';
import { getAdminFromRequest, isAdminConfigured } from '@/services/server/admin-auth';
import { verifyUpiPaymentReference } from '@/services/server/card-store';
import { getSupabaseAdmin } from '@/services/server/supabase-admin';
import { notifyCreatorCardReady } from '@/services/server/notify-card-ready';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Manual verification is not configured.' }, { status: 503 });
    }

    const admin = getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: 'Admin OTP login required.' }, { status: 401 });

    if (process.env.NODE_ENV === 'production' && !getSupabaseAdmin()) {
      return NextResponse.json({ error: 'Persistent payment storage is unavailable. Configure Supabase before approving Transaction IDs.' }, { status: 503 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`manual-payment-verify:${admin.email}:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many manual verification attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = manualPaymentVerifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Enter the Transaction ID to verify.' },
        { status: 400 },
      );
    }

    const result = await verifyUpiPaymentReference(parsed.data.utr);
    if (!result) {
      return NextResponse.json({ error: 'No submitted Transaction ID found for this reference.' }, { status: 404 });
    }

    const notifications = await notifyCreatorCardReady(result.card_id, req.nextUrl.origin);

    return NextResponse.json({ success: true, notifications, ...result });
  } catch (error) {
    console.error('Manual payment verification error:', error);
    return NextResponse.json({ error: 'Could not manually verify payment.' }, { status: 500 });
  }
}
