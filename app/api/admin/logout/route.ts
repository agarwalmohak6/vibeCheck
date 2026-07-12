import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/services/server/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAdminCookie(response);
  return response;
}
