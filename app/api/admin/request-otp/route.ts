import { NextRequest, NextResponse } from 'next/server';
import { adminOtpRequestSchema } from '@/lib/contracts';
import {
  createAdminOtpToken,
  generateAdminOtp,
  getConfiguredAdminEmail,
  isAdminConfigured,
  setAdminOtpCookie,
} from '@/services/server/admin-auth';
import { sendAdminOtpEmail } from '@/services/server/email';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin OTP login is not configured.' }, { status: 503 });
    }

    const ip = getClientIp(req);
    const email = getConfiguredAdminEmail();
    if (!checkRateLimit(`admin-otp:${email}:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many OTP requests. Please try again in a few minutes.' }, { status: 429 });
    }

    const parsed = adminOtpRequestSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid OTP request.' }, { status: 400 });
    }

    if (parsed.data.email && parsed.data.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: `OTP can only be sent to ${email}.` }, { status: 403 });
    }

    const otp = generateAdminOtp();
    console.info(`[ADMIN OTP] Generated OTP for ${email}: ${otp}`);

    let emailSent = false;
    try {
      const emailResult = await sendAdminOtpEmail({ to: email, otp });
      emailSent = emailResult.sent;
    } catch (mailError) {
      console.error('Admin OTP email delivery failed:', mailError);
    }

    const response = NextResponse.json({
      success: true,
      email,
      email_sent: emailSent,
    });
    setAdminOtpCookie(response, createAdminOtpToken(email, otp));
    return response;
  } catch (error) {
    console.error('Admin OTP request error:', error);
    return NextResponse.json({ error: 'Could not send admin OTP.' }, { status: 500 });
  }
}
