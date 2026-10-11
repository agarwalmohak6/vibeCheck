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
export const maxDuration = 30;

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
    const emailResult = await sendAdminOtpEmail({ to: email, otp });
    if (!emailResult.sent) {
      const configurationError = emailResult.reason === 'missing_provider_config' ||
        emailResult.reason === 'invalid_sender';
      return NextResponse.json({
        success: false,
        email_sent: false,
        error: configurationError
          ? 'Admin email is not configured correctly. Set BREVO_API_KEY and a verified BREVO_SENDER_EMAIL on the API server, or configure your Resend sender.'
          : 'The email provider could not send your OTP. Please try again shortly. If this continues on Render, use an HTTPS email provider instead of Gmail SMTP.',
      }, { status: configurationError ? 503 : 502 });
    }

    const response = NextResponse.json({
      success: true,
      email,
      email_sent: true,
    });
    setAdminOtpCookie(response, createAdminOtpToken(email, otp));
    return response;
  } catch (error) {
    console.error('Admin OTP request error:', error);
    return NextResponse.json({ error: 'Could not send admin OTP.' }, { status: 500 });
  }
}
