export type CreatorEmailDetails = {
  orderId: string;
  recipientName: string;
  creatorName: string;
  trackingUrl: string;
  recipientUrl?: string;
  templateType?: string;
  themeId?: string;
  testMode?: boolean;
};

const MOODS = {
  bestie_check: { accent: '#a93e55', tint: '#fff0f3', title: 'A little courage. A lot of heart.' },
  shoot_shot: { accent: '#a44353', tint: '#fceff0', title: 'Here is to your next chapter.' },
  maan_jao: { accent: '#356247', tint: '#edf7ef', title: 'A thoughtful place to begin again.' },
  birthday_roast: { accent: '#17665c', tint: '#eaf8f5', title: 'A wish worth making.' },
  netflix_chill: { accent: '#684686', tint: '#f4effa', title: 'A little time, just for two.' },
};

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeUrl(value: string) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid email action URL');
  return escapeHtml(url.toString());
}

export function buildCreatorEmail(input: CreatorEmailDetails, status: 'pending' | 'ready') {
  const mood = MOODS[input.templateType as keyof typeof MOODS] && Object.hasOwn(MOODS, input.templateType || '')
    ? MOODS[input.templateType as keyof typeof MOODS] : MOODS.bestie_check;
  const ready = status === 'ready';
  const testReady = ready && input.testMode;
  const recipient = input.recipientName || 'your recipient';
  const subject = ready ? `${testReady ? '[Test] ' : ''}Your VibeCheck for ${recipient} is ready` : `Your VibeCheck order ${input.orderId} is saved`;
  const heading = ready ? 'Your card is ready.' : 'Your moment is saved.';
  const copy = ready
    ? `${testReady ? 'Test mode: no payment was collected.' : 'Payment verified.'} Your card for ${recipient} is ready to share whenever the moment feels right.`
    : `Your card for ${recipient} is saved. Complete your payment if you have not already. We will email you again when it is verified and your card is ready.`;
  const primaryUrl = ready && input.recipientUrl ? input.recipientUrl : input.trackingUrl;
  const primaryLabel = ready && input.recipientUrl ? 'Open recipient card' : 'View your order';
  const text = [
    `Hey ${input.creatorName || 'there'},`, '', heading, copy, '',
    ...(ready && input.recipientUrl ? ['Recipient link to share:', input.recipientUrl, ''] : []),
    'Your private tracking page:', input.trackingUrl,
    'Keep this creator link private. It includes payment status and activity.', '', `Order: ${input.orderId}`, 'VibeCheck',
  ].join('\n');
  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;background:${mood.tint};color:#30262b;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden">
        <tr><td style="padding:24px 28px;border-top:5px solid ${mood.accent};border-bottom:1px solid #eee8eb;font-size:23px;font-family:Georgia,serif;color:${mood.accent}"><strong>VibeCheck</strong></td></tr>
        <tr><td style="padding:30px 28px">
          <p style="margin:0 0 18px;font-size:13px;color:${mood.accent};font-weight:bold">${escapeHtml(mood.title)}</p>
          <h1 style="margin:0 0 20px;font-size:30px;line-height:1.25">${heading}</h1>
          <p style="font-size:16px;line-height:1.65">Hey ${escapeHtml(input.creatorName || 'there')},</p>
          <p style="font-size:16px;line-height:1.65;margin-bottom:26px">${escapeHtml(copy)}</p>
          <a href="${safeUrl(primaryUrl)}" style="display:inline-block;background:${mood.accent};color:#ffffff;padding:15px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">${primaryLabel}</a>
          ${ready && input.recipientUrl ? `<p style="margin:26px 0 8px"><a href="${safeUrl(input.trackingUrl)}" style="color:${mood.accent};font-weight:bold">Your private tracking page</a></p>` : ''}
          <p style="font-size:13px;line-height:1.6;color:#655a61">Share the recipient link. Keep your tracking link just for you.</p>
        </td></tr>
        <tr><td style="padding:20px 28px;background:${mood.tint};font-size:12px;line-height:1.7;color:#55474f;overflow-wrap:anywhere">${testReady ? 'TEST CARD - PAYMENT SKIPPED' : ready ? 'PAYMENT VERIFIED' : 'AWAITING PAYMENT VERIFICATION'}<br>Order ${escapeHtml(input.orderId)}<br>Made personal. Made with VibeCheck.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  return { subject, text, html };
}
