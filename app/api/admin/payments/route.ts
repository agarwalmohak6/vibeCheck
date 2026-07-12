import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, isAdminConfigured } from '@/services/server/admin-auth';
import { listManualPaymentReferences } from '@/services/server/card-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin dashboard is not configured.' }, { status: 503 });
    }

    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
    }

    const limitParam = Number(req.nextUrl.searchParams.get('limit') || '75');
    const payments = await listManualPaymentReferences(Number.isFinite(limitParam) ? limitParam : 75);
    return NextResponse.json({ success: true, admin_email: admin.email, payments });
  } catch (error) {
    console.error('Admin payments list error:', error);
    return NextResponse.json({ error: 'Could not load manual payment submissions.' }, { status: 500 });
  }
}
