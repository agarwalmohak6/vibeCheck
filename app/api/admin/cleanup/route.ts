import { NextRequest, NextResponse } from 'next/server';
import { adminCleanupSchema } from '@/lib/contracts';
import { getAdminFromRequest, isAdminConfigured } from '@/services/server/admin-auth';
import { clearAllCardsAndPayments } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin dashboard is not configured.' }, { status: 503 });
    }

    const admin = getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });

    const ip = getClientIp(req);
    if (!checkRateLimit(`admin-cleanup:${admin.email}:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many cleanup attempts. Please wait.' }, { status: 429 });
    }

    const parsed = adminCleanupSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Type CLEAR_TEST_DATA to confirm cleanup.' }, { status: 400 });
    }

    const result = await clearAllCardsAndPayments();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Admin cleanup error:', error);
    return NextResponse.json({ error: 'Could not clear cards and payments.' }, { status: 500 });
  }
}
