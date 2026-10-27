/** Only complete, authenticated credit alerts can constitute payment evidence. */
export type MailHeader = { name: string; value: string };
export type AxisAlert = { id: string; receivedAt: number; headers: MailHeader[]; text: string };
export type AxisCredit = { messageId: string; transactionId: string; amountInPaise: number; accountLast4: string; receivedAt: string; transactionAt: string };

export const AXIS_SENDERS = ['alerts@axis.bank.in', 'info@alerts.axisbankmail.in', 'info@alerts.axis.bank.mail.in', 'info@digital.axis.bank.mail.in'];

function singleHeader(headers: MailHeader[], name: string) {
  const values = headers.filter(header => header.name.toLowerCase() === name.toLowerCase());
  return values.length === 1 ? values[0].value : '';
}

function inPaise(value: string) {
  const [rupees, paise = ''] = value.replaceAll(',', '').split('.');
  return Number(rupees) * 100 + Number(paise.padEnd(2, '0'));
}

function alertTimestamp(text: string): number | null {
  const match = text.match(/Date\s*(?:&|and)\s*Time\s*:\s*(\d{2})[-/](\d{2})[-/](\d{2}|\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})\s*IST\b/i);
  if (!match) return null;
  const [, dd, mm, yy, hh, minute, second] = match;
  const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
  const value = Date.UTC(year, Number(mm) - 1, Number(dd), Number(hh), Number(minute), Number(second));
  const date = new Date(value);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== Number(mm) - 1 || date.getUTCDate() !== Number(dd) || Number(hh) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  return value - 330 * 60_000;
}

export function matchAxisCredit(alert: AxisAlert, expected: { transactionId: string; amountInPaise: number; accountLast4: string; orderCreatedAt: string; now?: number }): AxisCredit | null {
  if (!/^\d{4}$/.test(expected.accountLast4) || !/^\d{12}$/.test(expected.transactionId)) return null;
  const from = singleHeader(alert.headers, 'from');
  const address = (from.match(/<([^<>]+)>/)?.[1] || from).trim().toLowerCase();
  if (!AXIS_SENDERS.includes(address)) return null;
  // Reject ambiguous/imported/forwarded authentication results. Do not trust From alone.
  const authentication = singleHeader(alert.headers, 'authentication-results');
  if (!/^mx\.google\.com\s*;/i.test(authentication)) return null;
  const domain = address.split('@')[1];
  const escaped = domain.replaceAll('.', '\\.');
  if (!new RegExp(`\\bdmarc=pass\\b[^;]*\\bheader\\.from=${escaped}(?:\\s|;|$)`, 'i').test(authentication)) return null;
  if (!new RegExp(`\\bdkim=pass\\b[^;]*\\bheader\\.(?:i|d)=(?:[^\\s;@]*@)?${escaped}(?:\\s|;|$)`, 'i').test(authentication)) return null;
  const subject = singleHeader(alert.headers, 'subject');
  if (/^(?:re|fwd?)\s*:/i.test(subject)) return null;
  const text = `${subject}\n${alert.text}`.replace(/\s+/g, ' ');
  // Deliberately support the explicit Axis credit-summary template only. Unknown templates stay manual.
  const summary = text.match(/Amount\s+Credited\s*:\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+Account\s+Number\s*:\s*[xX*]+(\d{4})(?!\d)/i)
    || text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:was|is|has been)\s+credited\s+to\s+your\s+A\/?c\s*(?:no\.?|number)?\s*[:.]?\s*[xX*]+(\d{4})(?!\d)/i);
  if (!summary || summary[2] !== expected.accountLast4) return null;
  const amountInPaise = inPaise(summary[1]);
  if (!Number.isSafeInteger(amountInPaise) || amountInPaise !== expected.amountInPaise) return null;
  const subjectAmount = subject.match(/^(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+was\s+credited\s+to\s+your\s+A\/?c\b/i);
  if (!subjectAmount || inPaise(subjectAmount[1]) !== amountInPaise) return null;
  const ids = [...text.matchAll(/\bUPI\/(?:P2A|P2M)\/(\d{12})(?=\/|\s|$)/gi)].map(match => match[1]);
  if (new Set(ids).size !== 1 || ids[0] !== expected.transactionId) return null;
  const transactionAt = alertTimestamp(text);
  const now = expected.now ?? Date.now();
  const createdAt = Date.parse(expected.orderCreatedAt);
  const earliest = Math.max(createdAt - 5 * 60_000, now - 24 * 60 * 60_000);
  if (!Number.isFinite(createdAt) || transactionAt == null || !Number.isFinite(alert.receivedAt)) return null;
  if (transactionAt < earliest || transactionAt > now + 5 * 60_000 || alert.receivedAt < earliest || alert.receivedAt > now + 5 * 60_000 || transactionAt > alert.receivedAt + 5 * 60_000) return null;
  return { messageId: alert.id, transactionId: ids[0], amountInPaise, accountLast4: summary[2], receivedAt: new Date(alert.receivedAt).toISOString(), transactionAt: new Date(transactionAt).toISOString() };
}
