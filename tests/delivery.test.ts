import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
const smtp = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn(() => smtp) } }));
vi.mock('@/services/server/rate-limit', () => ({ checkRateLimit: () => true, getClientIp: () => '127.0.0.1' }));
vi.mock('@/services/server/creator-auth', () => ({ getCreatorSessionFromRequest: () => null }));
vi.mock('@/services/server/supabase-admin', () => ({ isSupabaseConnectivityError: () => false }));
vi.mock('@/services/server/card-store', () => ({
  createCardDraft: vi.fn(async (input) => ({
    card: { ...input, id: 'card-123', card_data: { ...input.card_data, order_id: 'VC-123' } },
    creatorToken: 'private+creator/token',
  })),
  getPaymentStatus: vi.fn(), getPublicCard: vi.fn(),
}));

import nodemailer from 'nodemailer';
import { sendAdminOtpEmail, sendCreatorOrderEmail } from '@/services/server/email';
import { sendCreatorOrderNotifications, sendCreatorPaymentVerifiedNotifications } from '@/services/server/notifications';
import { createAdminOtpToken, verifyAdminToken } from '@/services/server/admin-auth';
import { createCardDraft } from '@/services/server/card-store';
import { POST as requestOtp } from '@/app/api/admin/request-otp/route';
import { POST as login } from '@/app/api/admin/login/route';
import { POST as createCard } from '@/app/api/cards/route';

const order = {
  creatorEmail: 'creator@example.com', creatorWhatsapp: '+919876543210',
  orderId: 'VC-123', recipientName: 'Recipient', creatorName: 'Creator',
  trackingUrl: 'https://cards.example.com/card/card-123?ct=private%2Bcreator%2Ftoken',
};
function request(path: string, body: unknown = {}, cookie?: string) {
  return new NextRequest(`https://api.example.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}
function configureBrevo() {
  vi.stubEnv('BREVO_API_KEY', '  test-brevo-key  ');
  vi.stubEnv('BREVO_SENDER_EMAIL', ' sender@gmail.com ');
}
function configureResend() {
  vi.stubEnv('RESEND_API_KEY', '  re_test-key  ');
  vi.stubEnv('VIBECHECK_EMAIL_FROM', '  VibeCheck <orders@example.com>  ');
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NODE_ENV', 'production');
  for (const name of [
    'BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'RESEND_API_KEY', 'VIBECHECK_EMAIL_FROM',
    'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'EMAIL_REPLY_TO', 'EMAIL_FROM_NAME',
    'NEXT_PUBLIC_BASE_URL', 'WHATSAPP_CLOUD_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID',
    'VIBECHECK_TOKEN_SECRET', 'NEXTAUTH_SECRET', 'RAZORPAY_KEY_SECRET',
  ]) vi.stubEnv(name, '');
  vi.stubEnv('VIBECHECK_ADMIN_EMAIL', 'owner@example.com');
  vi.stubEnv('VIBECHECK_ADMIN_SESSION_SECRET', 'test-only-admin-session-secret');
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ messageId: 'brevo-123', id: 'resend-123' })));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  smtp.sendMail.mockReset().mockResolvedValue({ accepted: ['owner@example.com'], messageId: 'smtp-123' });
});

describe('email delivery', () => {
  it('does not use embedded Gmail credentials when configuration is absent', async () => {
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: false, reason: 'missing_provider_config' });
    expect(fetch).not.toHaveBeenCalled();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('123456');
  });
  it('ignores example API keys and uses explicitly configured SMTP credentials', async () => {
    vi.stubEnv('RESEND_API_KEY', 'replace-with-resend-api-key');
    vi.stubEnv('GMAIL_USER', ' owner@example.com ');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'test app pass word');
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: true, provider: 'gmail' });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      auth: { user: 'owner@example.com', pass: 'testapppassword' },
    }));
    expect(fetch).not.toHaveBeenCalled();
    expect(smtp.close).toHaveBeenCalledOnce();
  });
  it('does not mark an SMTP-rejected recipient as sent', async () => {
    vi.stubEnv('GMAIL_USER', 'owner@example.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'test-password');
    smtp.sendMail.mockResolvedValueOnce({ accepted: [], rejected: ['owner@example.com'] });
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: false, reason: 'provider_error' });
    expect(smtp.close).toHaveBeenCalledOnce();
  });
  it('uses Brevo HTTPS for the full order link and prefers it over other configured providers', async () => {
    configureBrevo(); configureResend();
    expect(await sendCreatorOrderEmail({ ...order, to: order.creatorEmail }))
      .toMatchObject({ sent: true, provider: 'brevo', messageId: 'brevo-123' });
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(options?.headers).toMatchObject({ 'api-key': 'test-brevo-key' });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(options?.body as string);
    expect(body.sender.email).toBe('sender@gmail.com');
    expect(body.to).toEqual([{ email: order.creatorEmail }]);
    expect(body.replyTo.email).toBe('sender@gmail.com');
    expect(body.textContent).toContain(order.trackingUrl);
    expect(body.htmlContent).toContain(order.trackingUrl);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('requires a valid Brevo sender without falling back to a different provider', async () => {
    configureBrevo(); configureResend();
    vi.stubEnv('BREVO_SENDER_EMAIL', '');
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: false, provider: 'brevo', reason: 'invalid_sender' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('preserves Resend delivery for installations already using it', async () => {
    configureResend();
    expect(await sendCreatorOrderEmail({ ...order, to: order.creatorEmail }))
      .toMatchObject({ sent: true, provider: 'resend', messageId: 'resend-123' });
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://api.resend.com/emails');
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string).text).toContain(order.trackingUrl);
  });
  it.each(['', 'VibeCheck <onboarding@resend.dev>', 'VibeCheck <admin@your-domain.com>'])(
    'rejects an unconfigured/test production Resend sender: %s', async (from) => {
      configureResend(); vi.stubEnv('VIBECHECK_EMAIL_FROM', from);
      expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
        .toMatchObject({ sent: false, reason: 'invalid_sender' });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each([configureBrevo, configureResend])('handles provider rejection, timeout, and missing acceptance IDs', async (configure) => {
    configure();
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ message: 'private-provider-detail' }, { status: 403 }));
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: false, reason: 'provider_error' });
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException('Timed out', 'TimeoutError'));
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: false, reason: 'timeout' });
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}));
    expect(await sendAdminOtpEmail({ to: 'owner@example.com', otp: '123456' }))
      .toMatchObject({ sent: false, reason: 'provider_error' });
    const logs = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logs).toContain('403');
    expect(logs).not.toContain('private-provider-detail');
    expect(logs).not.toContain('123456');
  });
});

describe('admin OTP login', () => {
  it('returns 503 without an OTP cookie when mail configuration is missing', async () => {
    const response = await requestOtp(request('/api/admin/request-otp'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, email_sent: false });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('delivers to the configured owner and accepts that OTP for login', async () => {
    configureBrevo();
    const response = await requestOtp(request('/api/admin/request-otp'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ email: 'owner@example.com', email_sent: true });
    const mail = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(mail.to).toEqual([{ email: 'owner@example.com' }]);
    const otp = mail.textContent.match(/\b\d{6}\b/)[0];
    const cookie = response.cookies.get('vc_admin_otp')!;
    expect(cookie.httpOnly).toBe(true); expect(cookie.secure).toBe(true);
    const signedIn = await login(request('/api/admin/login', { otp }, `${cookie.name}=${cookie.value}`));
    expect(signedIn.status).toBe(200);
    expect(verifyAdminToken(signedIn.cookies.get('vc_admin')?.value)).toEqual({ email: 'owner@example.com' });
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(otp);
  });
  it('keeps the previous delivered OTP usable if a resend fails', async () => {
    configureBrevo();
    const token = createAdminOtpToken('owner@example.com', '654321');
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 503 }));
    const response = await requestOtp(request('/api/admin/request-otp', {}, `vc_admin_otp=${token}`));
    expect(response.status).toBe(502); expect(response.headers.get('set-cookie')).toBeNull();
    expect((await login(request('/api/admin/login', { otp: '654321' }, `vc_admin_otp=${token}`))).status).toBe(200);
  });
  it('rejects an incorrect OTP', async () => {
    const token = createAdminOtpToken('owner@example.com', '654321');
    const response = await login(request('/api/admin/login', { otp: '123456' }, `vc_admin_otp=${token}`));
    expect(response.status).toBe(401); expect(response.cookies.get('vc_admin')).toBeUndefined();
  });
  it('does not use a built-in production signing secret', async () => {
    vi.stubEnv('VIBECHECK_ADMIN_SESSION_SECRET', '');
    expect((await requestOtp(request('/api/admin/request-otp'))).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('order notifications', () => {
  it('sends the themed ready email to the creator through the configured provider', async () => {
    configureBrevo();
    const result = await sendCreatorPaymentVerifiedNotifications({ ...order, templateType: 'birthday_roast', recipientUrl: 'https://cards.example.com/card/card-123' });
    expect(result.email?.sent).toBe(true);
    const mail = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(mail.to).toEqual([{ email: order.creatorEmail }]);
    expect(mail.subject).toContain('is ready');
    expect(mail.htmlContent).toContain('A wish worth making.');
    expect(mail.htmlContent).toContain('Open recipient card');
    expect(mail.htmlContent).toContain(order.trackingUrl);
  });
  it('preserves email success when WhatsApp fails', async () => {
    configureBrevo();
    vi.stubEnv('WHATSAPP_CLOUD_API_TOKEN', 'test-token'); vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'test-phone');
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (String(url).includes('facebook.com')) throw new Error('network unavailable');
      return Response.json({ messageId: 'brevo-123' });
    });
    const result = await sendCreatorOrderNotifications(order);
    expect(result.email?.sent).toBe(true);
    expect(result.whatsapp).toMatchObject({ sent: false, reason: 'provider_error' });
    expect(result.whatsappUrl).toContain('wa.me');
  });
  it('still sends WhatsApp when the email provider rejects delivery', async () => {
    configureBrevo();
    vi.stubEnv('WHATSAPP_CLOUD_API_TOKEN', 'test-token'); vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'test-phone');
    vi.mocked(fetch).mockImplementation(async (url) => String(url).includes('brevo.com')
      ? Response.json({}, { status: 403 }) : Response.json({ messages: [{ id: 'wa-123' }] }));
    const result = await sendCreatorOrderNotifications(order);
    expect(result.email?.sent).toBe(false); expect(result.whatsapp?.sent).toBe(true);
  });
  const payload = {
    creator_name: 'Creator', recipient_name: 'Recipient', template_type: 'maan_jao', tier_selected: 'spark',
    card_data: { message_title: 'Hello', main_body: 'A private message', creator_email: order.creatorEmail },
  };
  it('keeps a created order accessible and reports failed email explicitly', async () => {
    const response = await createCard(request('/api/cards', payload));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe('card-123'); expect(body.creator_url).toContain('ct=private%2Bcreator%2Ftoken');
    expect(body.notifications.email).toMatchObject({ sent: false, reason: 'missing_provider_config' });
    expect(createCardDraft).toHaveBeenCalledOnce();
  });
  it('emails the public frontend URL when API and frontend hosts differ', async () => {
    configureBrevo(); vi.stubEnv('NEXT_PUBLIC_BASE_URL', ' https://cards.example.com/// ');
    const response = await createCard(request('/api/cards', payload));
    expect((await response.json()).notifications.email.sent).toBe(true);
    const mail = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(mail.textContent).toContain(order.trackingUrl); expect(mail.textContent).not.toContain('api.example.com');
  });
});
