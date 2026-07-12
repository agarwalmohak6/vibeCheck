import { NextResponse } from 'next/server';
import { clearCreatorCookie } from '@/services/server/creator-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearCreatorCookie(response);
  return response;
}
