import 'server-only';
import nodemailer from 'nodemailer';

type AdminOtpEmailInput = {
  to: string;
  otp: string;
};

type CreatorOrderEmailInput = {
  to: string;
  orderId: string;
  recipientName: string;
  creatorName: string;
  trackingUrl: string;
};

type AdminPaymentReviewEmailInput = {
  to: string;
  orderId: string;
  cardId: string;
  recipientName: string;
  creatorName: string;
  paymentReference: string;
  adminUrl: string;
};

type CreatorPaymentVerifiedEmailInput = {
  to: string;
  orderId: string;
  recipientName: string;
  creatorName: string;
  trackingUrl: string;
};

export type EmailDeliveryResult = {
  // "sent" means accepted by the provider, not confirmed inbox delivery.
  sent: boolean;
  to: string;
  provider: 'brevo' | 'resend' | 'gmail' | 'none';
  reason?: 'missing_provider_config' | 'invalid_sender' | 'provider_error' | 'timeout';
  messageId?: string;
};

const EMAIL_TIMEOUT_MS = 12_000;

function setting(name: string) {
  const value = process.env[name]?.trim() || '';
  return /^replace-with-/i.test(value) ? '' : value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function failedDelivery(
  to: string,
  provider: EmailDeliveryResult['provider'],
  reason: NonNullable<EmailDeliveryResult['reason']>,
  status?: number,
): EmailDeliveryResult {
  // Never log OTPs, private creator URLs, or provider credentials.
  console.error('Email delivery failed.', { provider, reason, status });
  return { sent: false, to, provider, reason };
}

function isTimeout(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  return ('name' in error && (error.name === 'TimeoutError' || error.name === 'AbortError')) ||
    ('code' in error && error.code === 'ETIMEDOUT');
}

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailDeliveryResult> {
  // Brevo's free HTTPS API works on Render without opening SMTP ports.
  const brevoApiKey = setting('BREVO_API_KEY');
  if (brevoApiKey) {
    const senderEmail = setting('BREVO_SENDER_EMAIL');
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(senderEmail)) {
      return failedDelivery(input.to, 'brevo', 'invalid_sender');
    }
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { email: senderEmail, name: setting('EMAIL_FROM_NAME') || 'VibeCheck' },
          to: [{ email: input.to }],
          replyTo: { email: setting('EMAIL_REPLY_TO') || senderEmail },
          subject: input.subject,
          textContent: input.text,
          htmlContent: input.html,
        }),
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
        cache: 'no-store',
      });
      if (!res.ok) return failedDelivery(input.to, 'brevo', 'provider_error', res.status);
      const result = await res.json() as { messageId?: string };
      if (!result.messageId) return failedDelivery(input.to, 'brevo', 'provider_error');
      return { sent: true, to: input.to, provider: 'brevo', messageId: result.messageId };
    } catch (error) {
      return failedDelivery(input.to, 'brevo', isTimeout(error) ? 'timeout' : 'provider_error');
    }
  }

  const resendApiKey = setting('RESEND_API_KEY');

  // HTTPS works on Render Free, where outbound SMTP ports are blocked.
  if (resendApiKey) {
    const from = setting('VIBECHECK_EMAIL_FROM') ||
      (process.env.NODE_ENV !== 'production' ? 'VibeCheck <onboarding@resend.dev>' : '');
    const sender = from.match(/<?([^<>\s]+@[^<>\s]+)>?$/)?.[1];
    if (!sender || /@your-domain\.com$/i.test(sender) ||
      (process.env.NODE_ENV === 'production' && /@resend\.dev$/i.test(sender))) {
      return failedDelivery(input.to, 'resend', 'invalid_sender');
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, ...input, reply_to: setting('EMAIL_REPLY_TO') || undefined }),
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
        cache: 'no-store',
      });

      if (!res.ok) {
        return failedDelivery(input.to, 'resend', 'provider_error', res.status);
      }
      const result = await res.json() as { id?: string };
      if (!result.id) return failedDelivery(input.to, 'resend', 'provider_error');
      return { sent: true, to: input.to, provider: 'resend', messageId: result.id };
    } catch (error) {
      return failedDelivery(input.to, 'resend', isTimeout(error) ? 'timeout' : 'provider_error');
    }
  }

  // Explicit credentials only; SMTP is suitable for local or SMTP-capable hosts.
  const gmailUser = setting('GMAIL_USER');
  const gmailAppPassword = setting('GMAIL_APP_PASSWORD').replace(/\s+/g, '');
  if (!gmailUser || !gmailAppPassword) {
    return failedDelivery(input.to, 'none', 'missing_provider_config');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    connectionTimeout: EMAIL_TIMEOUT_MS,
    greetingTimeout: EMAIL_TIMEOUT_MS,
    socketTimeout: EMAIL_TIMEOUT_MS,
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  try {
    const result = await transporter.sendMail({
      from: { name: setting('EMAIL_FROM_NAME') || 'VibeCheck', address: gmailUser },
      to: input.to,
      replyTo: setting('EMAIL_REPLY_TO') || gmailUser,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    const accepted = result.accepted?.some((address) =>
      address.toLowerCase() === input.to.toLowerCase()
    );
    if (!accepted) return failedDelivery(input.to, 'gmail', 'provider_error');
    return { sent: true, to: input.to, provider: 'gmail', messageId: result.messageId };
  } catch (error) {
    return failedDelivery(input.to, 'gmail', isTimeout(error) ? 'timeout' : 'provider_error');
  } finally {
    transporter.close();
  }
}

export async function sendAdminOtpEmail({ to, otp }: AdminOtpEmailInput) {
  const subject = `VibeCheck admin OTP: ${otp}`;
  const text = [
    'Your VibeCheck admin login OTP is:',
    '',
    otp,
    '',
    'This code expires in 10 minutes. If you did not request it, ignore this email.',
  ].join('\n');
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#09090b;color:#f8fafc;padding:28px;border-radius:18px">
      <p style="margin:0 0 8px;color:#38bdf8;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">VibeCheck Admin</p>
      <h1 style="margin:0 0 16px;font-size:26px">One-time login code</h1>
      <div style="display:inline-block;background:#111827;border:1px solid #334155;border-radius:14px;padding:14px 18px;font-size:30px;font-weight:900;letter-spacing:.22em">${otp}</div>
      <p style="margin:18px 0 0;color:#cbd5e1;font-size:14px;line-height:1.55">This code expires in 10 minutes. Ignore this email if you did not request it.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

export async function sendCreatorOrderEmail({
  to,
  orderId,
  recipientName,
  creatorName,
  trackingUrl,
}: CreatorOrderEmailInput) {
  const safeOrderId = escapeHtml(orderId);
  const safeRecipientName = escapeHtml(recipientName || 'your recipient');
  const safeTrackingUrl = escapeHtml(trackingUrl);
  const subject = `Your VibeCheck order ${orderId}`;
  const text = [
    `Hey ${creatorName || 'there'},`,
    '',
    `Your VibeCheck for ${recipientName || 'your recipient'} has been created.`,
    `Order ID: ${orderId}`,
    '',
    'Track and manage it here:',
    trackingUrl,
    '',
    'Keep this creator link private.',
  ].join('\n');
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#fff7fb;color:#3d1a2e;padding:28px;border-radius:22px;border:1px solid #ffd1e5">
      <p style="margin:0 0 8px;color:#e91e8c;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase">VibeCheck Order</p>
      <h1 style="margin:0 0 10px;font-size:28px;line-height:1">Your private card is being prepared</h1>
      <p style="margin:0 0 18px;color:#7b3f6e;font-size:14px;line-height:1.55">Order <strong>${safeOrderId}</strong> for <strong>${safeRecipientName}</strong> is linked to this creator tracking page.</p>
      <a href="${safeTrackingUrl}" style="display:inline-block;background:#3d1a2e;color:#fff;text-decoration:none;border-radius:999px;padding:13px 18px;font-weight:900">Track order</a>
      <p style="margin:18px 0 0;color:#7b3f6e;font-size:12px;line-height:1.55">Keep this link private. It can show opens, answers, and payment status.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

export async function sendAdminPaymentReviewEmail({
  to,
  orderId,
  cardId,
  recipientName,
  creatorName,
  paymentReference,
  adminUrl,
}: AdminPaymentReviewEmailInput) {
  const subject = `UPI verification needed: ${paymentReference}`;
  const text = [
    'A VibeCheck creator submitted a UPI payment reference.',
    '',
    `Order ID: ${orderId}`,
    `Card ID: ${cardId}`,
    `From: ${creatorName || 'Creator'}`,
    `For: ${recipientName || 'Recipient'}`,
    `UTR/reference: ${paymentReference}`,
    '',
    'Open admin verification:',
    adminUrl,
  ].join('\n');
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#07111f;color:#f8fafc;padding:28px;border-radius:22px;border:1px solid #164e63">
      <p style="margin:0 0 8px;color:#22d3ee;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase">UPI Verification</p>
      <h1 style="margin:0 0 14px;font-size:26px;line-height:1.1">Payment proof needs review</h1>
      <p style="margin:0 0 18px;color:#cbd5e1;font-size:14px;line-height:1.55">Order <strong>${escapeHtml(orderId)}</strong> submitted UTR <strong>${escapeHtml(paymentReference)}</strong>.</p>
      <div style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:14px;margin:0 0 18px">
        <p style="margin:0 0 6px;color:#cbd5e1;font-size:13px">Creator: <strong>${escapeHtml(creatorName || 'Creator')}</strong></p>
        <p style="margin:0 0 6px;color:#cbd5e1;font-size:13px">Recipient: <strong>${escapeHtml(recipientName || 'Recipient')}</strong></p>
        <p style="margin:0;color:#94a3b8;font-size:12px">Card ID: ${escapeHtml(cardId)}</p>
      </div>
      <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#22d3ee;color:#07111f;text-decoration:none;border-radius:999px;padding:13px 18px;font-weight:900">Open admin dashboard</a>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

export async function sendCreatorPaymentVerifiedEmail({
  to,
  orderId,
  recipientName,
  creatorName,
  trackingUrl,
}: CreatorPaymentVerifiedEmailInput) {
  const subject = `VibeCheck order ${orderId} is unlocked`;
  const text = [
    `Hey ${creatorName || 'there'},`,
    '',
    `Payment for ${recipientName || 'your recipient'} has been verified.`,
    `Order ID: ${orderId}`,
    '',
    'Your recipient link is ready from your creator tracking page:',
    trackingUrl,
  ].join('\n');
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#ecfdf5;color:#052e16;padding:28px;border-radius:22px;border:1px solid #bbf7d0">
      <p style="margin:0 0 8px;color:#059669;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase">Payment Verified</p>
      <h1 style="margin:0 0 10px;font-size:28px;line-height:1">Your VibeCheck is unlocked</h1>
      <p style="margin:0 0 18px;color:#166534;font-size:14px;line-height:1.55">Order <strong>${escapeHtml(orderId)}</strong> for <strong>${escapeHtml(recipientName || 'your recipient')}</strong> is ready to send.</p>
      <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#052e16;color:#fff;text-decoration:none;border-radius:999px;padding:13px 18px;font-weight:900">Open tracking page</a>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}
