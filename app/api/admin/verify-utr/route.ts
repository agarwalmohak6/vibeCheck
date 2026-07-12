import { NextRequest, NextResponse } from 'next/server';
import { manualPaymentVerifySchema } from '@/lib/contracts';
import { getAdminFromRequest, isAdminConfigured } from '@/services/server/admin-auth';
import { verifyUpiPaymentReference } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin dashboard is not configured.' }, { status: 503 });
    }

    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`admin-verify-utr:${admin.email}:${ip}`, 60, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many verification attempts. Please try later.' }, { status: 429 });
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
    console.error('Admin UTR verification error:', error);
    return NextResponse.json({ error: 'Could not verify this UTR.' }, { status: 500 });
  }
}
