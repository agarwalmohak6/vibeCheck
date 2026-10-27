import 'server-only';
import { AXIS_SENDERS, matchAxisCredit, type AxisAlert, type MailHeader } from './axis-alert';

type MailPart = { mimeType?: string; filename?: string; body?: { data?: string }; parts?: MailPart[] };
type GmailMessage = { id: string; internalDate: string; labelIds?: string[]; payload?: MailPart & { headers?: MailHeader[] } };
let cachedToken: { value: string; expiresAt: number } | null = null;

export function isAxisAutoApprovalConfigured() {
  return process.env.AXIS_EMAIL_AUTO_APPROVAL_ENABLED === 'true' && /^\d{4}$/.test(process.env.AXIS_RECEIVING_ACCOUNT_LAST4 || '') &&
    ['GMAIL_PAYMENTS_CLIENT_ID', 'GMAIL_PAYMENTS_CLIENT_SECRET', 'GMAIL_PAYMENTS_REFRESH_TOKEN', 'GMAIL_PAYMENTS_MAILBOX'].every(key => !!process.env[key]?.trim());
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(4000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: process.env.GMAIL_PAYMENTS_CLIENT_ID!.trim(), client_secret: process.env.GMAIL_PAYMENTS_CLIENT_SECRET!.trim(), refresh_token: process.env.GMAIL_PAYMENTS_REFRESH_TOKEN!.trim(), grant_type: 'refresh_token' }) });
  if (!res.ok) throw new Error('PAYMENT_MAILBOX_AUTH_FAILED');
  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('PAYMENT_MAILBOX_AUTH_FAILED');
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Math.min(data.expires_in || 300, 3600) * 1000 };
  return data.access_token;
}

async function gmail<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { cache: 'no-store', signal: AbortSignal.timeout(4000), headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { if (res.status === 401) cachedToken = null; throw new Error('PAYMENT_MAILBOX_READ_FAILED'); }
  return res.json() as Promise<T>;
}

export function bodyText(part?: MailPart): string {
  if (!part || part.filename) return '';
  if (part.mimeType === 'text/plain' && part.body?.data) return Buffer.from(part.body.data, 'base64url').toString('utf8');
  const plain = (part.parts || []).filter(child => child.mimeType !== 'text/html').map(bodyText).filter(Boolean).join('\n');
  if (plain) return plain;
  if (part.mimeType === 'text/html' && part.body?.data) return Buffer.from(part.body.data, 'base64url').toString('utf8')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|#160);/gi, ' ').replace(/&amp;/g, '&');
  return (part.parts || []).map(bodyText).filter(Boolean).join('\n');
}

export async function findAxisCredit(expected: { transactionId: string; amountInPaise: number; orderCreatedAt: string }) {
  if (!isAxisAutoApprovalConfigured() || !/^\d{12}$/.test(expected.transactionId)) return null;
  const token = await accessToken();
  const profile = await gmail<{ emailAddress: string }>('profile', token);
  if (profile.emailAddress.toLowerCase() !== process.env.GMAIL_PAYMENTS_MAILBOX!.trim().toLowerCase()) throw new Error('PAYMENT_MAILBOX_ACCOUNT_MISMATCH');
  const query = `{${AXIS_SENDERS.map(sender => `from:${sender}`).join(' ')}} newer_than:2d "${expected.transactionId}" -in:spam -in:trash`;
  const list = await gmail<{ messages?: { id: string }[]; nextPageToken?: string }>(`messages?${new URLSearchParams({ q: query, maxResults: '10' })}`, token);
  if (list.nextPageToken) return null; // Ambiguous or unusually large result sets require a person to review them.
  const matches = await Promise.all((list.messages || []).map(async item => {
    const message = await gmail<GmailMessage>(`messages/${encodeURIComponent(item.id)}?format=full`, token);
    if (message.labelIds?.some(label => ['SPAM', 'TRASH', 'DRAFT', 'SENT'].includes(label))) return null;
    const alert: AxisAlert = { id: message.id, receivedAt: Number(message.internalDate), headers: message.payload?.headers || [], text: bodyText(message.payload) };
    return matchAxisCredit(alert, { ...expected, accountLast4: process.env.AXIS_RECEIVING_ACCOUNT_LAST4! });
  }));
  const valid = matches.filter(match => match !== null);
  return valid.length === 1 ? valid[0] : null;
}
