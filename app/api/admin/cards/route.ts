import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, isAdminConfigured } from '@/services/server/admin-auth';
import { listAdminCards } from '@/services/server/card-store';

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

    const limitParam = Number(req.nextUrl.searchParams.get('limit') || '200');
    const cards = await listAdminCards(Number.isFinite(limitParam) ? limitParam : 200);
    return NextResponse.json({ success: true, admin_email: admin.email, cards });
  } catch (error) {
    console.error('Admin cards list error:', error);
    return NextResponse.json({ error: 'Could not load admin cards.' }, { status: 500 });
  }
}
