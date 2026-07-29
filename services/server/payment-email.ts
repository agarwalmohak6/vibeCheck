import 'server-only';

import { TIERS } from '@/lib/themes';
import { absoluteUrl } from '@/lib/site';
import { createReceiptAccess, getPrivateCard, markConfirmationEmailSent } from './card-store';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] || character);
}

function formatExpiry(expiresAt?: string | null) {
  if (!expiresAt) return 'No fixed expiry (Lifetime plan)';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(expiresAt));
}

export async function deliverPaymentConfirmation(cardId: string, paymentId: string) {
  const card = await getPrivateCard(cardId);
  if (!card || !card.is_paid || !card.customer_email) {
    return { sent: false, receiptUrl: null, reason: 'CARD_NOT_READY' };
  }

  const receipt = createReceiptAccess(card);
  const receiptUrl = absoluteUrl(receipt.url);
  if (card.confirmation_email_sent_at) {
    return { sent: true, receiptUrl, reason: 'ALREADY_SENT' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { sent: false, receiptUrl, reason: 'EMAIL_NOT_CONFIGURED' };
  }

  const tier = TIERS.find((item) => item.id === card.tier_selected);
  const amount = tier?.price ?? 0;
  const expiry = formatExpiry(card.expires_at);
  const safeRecipient = escapeHtml(card.recipient_name);
  const safeCreator = escapeHtml(card.creator_name);
  const safePaymentId = escapeHtml(paymentId);
  const safeReceiptUrl = escapeHtml(receiptUrl);
  const recipientUrl = absoluteUrl(`/card/${card.id}`);

  const html = `<!doctype html>
<html><body style="margin:0;background:#fff4f8;font-family:Inter,Arial,sans-serif;color:#3d1a2e">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#fff4f8,#fff8e8);padding:32px 12px">
<tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #f7c8dc;border-radius:28px;overflow:hidden;box-shadow:0 18px 50px rgba(122,35,82,.12)">
<tr><td style="padding:34px;background:linear-gradient(135deg,#e91e8c,#ed5f70 55%,#d4a017);color:#fff">
<div style="font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase">VibeCheck · Payment confirmed</div>
<h1 style="margin:14px 0 8px;font-family:Georgia,serif;font-size:38px;line-height:1.08">Your private card is ready 💌</h1>
<p style="margin:0;font-size:16px;line-height:1.6">Made by ${safeCreator}, especially for ${safeRecipient}.</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 22px;font-size:16px;line-height:1.7">Your payment is secure and confirmed. This private receipt page keeps the recipient link safe even if your browser refreshes.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7fb;border:1px solid #f5d2e2;border-radius:18px;padding:18px">
<tr><td style="padding:7px;color:#8b6078">Plan</td><td align="right" style="padding:7px;font-weight:800">${escapeHtml(tier?.label || card.tier_selected)} · ₹${amount}</td></tr>
<tr><td style="padding:7px;color:#8b6078">Payment ID</td><td align="right" style="padding:7px;font-family:monospace">${safePaymentId}</td></tr>
<tr><td style="padding:7px;color:#8b6078">Card access until</td><td align="right" style="padding:7px;font-weight:800">${escapeHtml(expiry)}</td></tr>
</table>
<div style="text-align:center;padding:28px 0 20px"><a href="${safeReceiptUrl}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#d4a017);color:#fff;text-decoration:none;font-weight:900;padding:16px 28px;border-radius:16px">Open receipt &amp; sharing link</a></div>
<div style="background:#fff6dd;border:1px solid #f1d18a;border-radius:16px;padding:16px;font-size:13px;line-height:1.6"><strong>One-person privacy:</strong> send the recipient link only to ${safeRecipient}. Their first deliberate “Unseal” click binds the card to that browser, so forwarding it afterward will not open the card elsewhere.</div>
<p style="margin:24px 0 6px;color:#8b6078;font-size:12px">Recipient link</p>
<p style="margin:0;word-break:break-all;font-family:monospace;font-size:12px"><a href="${escapeHtml(recipientUrl)}" style="color:#e91e8c">${escapeHtml(recipientUrl)}</a></p>
</td></tr>
<tr><td style="padding:20px 32px;background:#3d1a2e;color:#f9d9e8;font-size:12px;line-height:1.6">Keep this email private. VibeCheck never asks for your card number or CVV by email.</td></tr>
</table></td></tr></table></body></html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `vibecheck-payment-${paymentId}`,
      },
      body: JSON.stringify({
        from,
        to: [card.customer_email],
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
        subject: `Your VibeCheck for ${card.recipient_name} is ready 💌`,
        html,
        text: [
          'Your VibeCheck payment is confirmed.',
          `For: ${card.recipient_name}`,
          `Plan: ${tier?.label || card.tier_selected} · ₹${amount}`,
          `Payment ID: ${paymentId}`,
          `Access until: ${expiry}`,
          `Open your private receipt and sharing link: ${receiptUrl}`,
          `Recipient link: ${recipientUrl}`,
          'Send the recipient link only to its intended recipient. The first deliberate Unseal click binds it to that browser.',
        ].join('\n\n'),
      }),
    });
    if (!response.ok) {
      console.error('Payment email delivery failed:', response.status, await response.text());
      return { sent: false, receiptUrl, reason: 'EMAIL_PROVIDER_ERROR' };
    }
    await markConfirmationEmailSent(cardId);
    return { sent: true, receiptUrl, reason: null };
  } catch (error) {
    console.error('Payment email delivery failed:', error);
    return { sent: false, receiptUrl, reason: 'EMAIL_PROVIDER_ERROR' };
  }
}
