import { describe, expect, it } from 'vitest';
import { matchAxisCredit, type AxisAlert } from '@/services/server/axis-alert';
import { paymentReferenceSchema, manualPaymentVerifySchema } from '@/lib/contracts';

// Synthetic values; no customer's real email, account, or transaction is committed.
const now = Date.parse('2026-10-27T15:01:00+05:30');
const expected = { transactionId: '123456789012', amountInPaise: 4999, accountLast4: '4321', orderCreatedAt: '2026-10-27T14:55:00+05:30', now };
function alert(): AxisAlert {
  return { id: '1234abcd5678ef90', receivedAt: Date.parse('2026-10-27T15:00:01+05:30'), headers: [
    { name: 'From', value: 'Axis Bank Alerts <alerts@axis.bank.in>' },
    { name: 'Subject', value: 'INR 49.99 was credited to your A/c.' },
    { name: 'Authentication-Results', value: 'mx.google.com; dkim=pass header.i=@axis.bank.in header.s=bank; spf=pass smtp.mailfrom=bank@delivery.axis.bank.in; dmarc=pass (p=REJECT) header.from=axis.bank.in' },
  ], text: 'Dear Customer, Here is the summary of your transaction:\nAmount Credited: \n INR 49.99 \nAccount Number: XX4321\nDate & Time: 27-10-26, 15:00:00 IST\nTransaction Info: UPI/P2A/123456789012/PAYER/BANK/Sent\nPlease never share debit card details.' };
}
describe('authenticated Axis credit matching', () => {
  it('matches the observed bank template with exact amount, account, bank ID and IST time', () => {
    expect(matchAxisCredit(alert(), expected)).toMatchObject({ transactionId: expected.transactionId, amountInPaise: 4999, accountLast4: '4321', transactionAt: '2026-10-27T09:30:00.000Z' });
  });
  it.each(['amount', 'account', 'reference', 'old_order', 'old_alert', 'future', 'sender', 'dkim', 'dmarc', 'forwarded', 'debit', 'conflicting_amount', 'second_id', 'ambiguous_auth', 'no_auth', 'invalid_date', 'no_bank_id'] as const)('does not approve %s evidence', reason => {
    const input = alert(), wanted = { ...expected };
    if (reason === 'amount') wanted.amountInPaise++;
    if (reason === 'account') wanted.accountLast4 = '1111';
    if (reason === 'reference') wanted.transactionId = '223456789012';
    if (reason === 'old_order') wanted.orderCreatedAt = '2026-10-27T15:10:00+05:30';
    if (reason === 'old_alert') wanted.now += 25 * 60 * 60_000;
    if (reason === 'future') input.receivedAt += 60 * 60_000;
    if (reason === 'sender') input.headers[0].value = 'Axis Bank <fraud@example.com>';
    if (reason === 'dkim') input.headers[2].value = input.headers[2].value.replace('dkim=pass', 'dkim=fail');
    if (reason === 'dmarc') input.headers[2].value = input.headers[2].value.replace('dmarc=pass', 'dmarc=fail');
    if (reason === 'forwarded') input.headers[1].value = 'Fwd: ' + input.headers[1].value;
    if (reason === 'debit') input.text = input.text.replace('Amount Credited', 'Amount Debited');
    if (reason === 'conflicting_amount') input.headers[1].value = input.headers[1].value.replace('49.99', '99.99');
    if (reason === 'second_id') input.text += ' UPI/P2M/223456789012/PAYER';
    if (reason === 'ambiguous_auth') input.headers.push(input.headers[2]);
    if (reason === 'no_auth') input.headers.pop();
    if (reason === 'invalid_date') input.text = input.text.replace('27-10-26', '32-10-26');
    if (reason === 'no_bank_id') input.text = input.text.replace('UPI/P2A/123456789012', 'APP/123456789012');
    expect(matchAxisCredit(input, wanted)).toBeNull();
  });
});

describe('Transaction ID rename compatibility', () => {
  const card_id = 'f9c99cbb-398e-4b7e-b2a3-eae910e9540a';
  it('accepts the new field while preserving existing UTR clients', () => {
    expect(paymentReferenceSchema.parse({ card_id, transaction_id: '123456789012' })).toEqual({ card_id, utr: '123456789012' });
    expect(paymentReferenceSchema.parse({ card_id, utr: '123456789012' })).toEqual({ card_id, utr: '123456789012' });
  });
  it('rejects missing or conflicting references', () => {
    expect(paymentReferenceSchema.safeParse({ card_id }).success).toBe(false);
    expect(paymentReferenceSchema.safeParse({ card_id, transaction_id: '123456789012', utr: '223456789012' }).success).toBe(false);
  });
  it('keeps the explicit bank-credit confirmation requirement on manual approval', () => {
    expect(manualPaymentVerifySchema.safeParse({ utr: '123456789012' }).success).toBe(false);
    expect(manualPaymentVerifySchema.safeParse({ utr: '123456789012', confirmed_received: true }).success).toBe(true);
  });
});
