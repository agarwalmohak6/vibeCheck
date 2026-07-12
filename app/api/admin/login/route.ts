import { NextRequest, NextResponse } from 'next/server';
import { adminLoginSchema } from '@/lib/contracts';
import {
  createAdminToken,
  getConfiguredAdminEmail,
  isAdminConfigured,
  setAdminCookie,
  validateAdminCredentials,
} from '@/services/server/admin-auth';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin login is not configured.' }, { status: 503 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`admin-login:${ip}`, 12, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many admin login attempts. Please try later.' }, { status: 429 });
    }

    const parsed = adminLoginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid admin email and secret.' }, { status: 400 });
    }

    if (!validateAdminCredentials(parsed.data.email, parsed.data.secret)) {
      return NextResponse.json({ error: 'Invalid admin email or secret.' }, { status: 401 });
    }

    const email = getConfiguredAdminEmail();
    const response = NextResponse.json({ success: true, email });
    setAdminCookie(response, createAdminToken(email));
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 });
  }
}
