import { NextRequest, NextResponse } from 'next/server';
import { adminLoginSchema } from '@/lib/contracts';
import {
  ADMIN_OTP_COOKIE_NAME,
  clearAdminOtpCookie,
  createAdminToken,
  getConfiguredAdminEmail,
  isAdminConfigured,
  setAdminCookie,
  verifyAdminOtp,
} from '@/services/server/admin-auth';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin OTP login is not configured.' }, { status: 503 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`admin-login:${ip}`, 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many admin login attempts. Please try later.' }, { status: 429 });
    }

    const parsed = adminLoginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter the 6-digit OTP sent to the owner email.' }, { status: 400 });
    }

    const pendingOtp = req.cookies.get(ADMIN_OTP_COOKIE_NAME)?.value;
    const verified = verifyAdminOtp(pendingOtp, parsed.data.otp);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });
    }

    const email = getConfiguredAdminEmail();
    const response = NextResponse.json({ success: true, email });
    setAdminCookie(response, createAdminToken(email));
    clearAdminOtpCookie(response);
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 });
  }
}
