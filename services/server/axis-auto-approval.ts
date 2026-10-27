import 'server-only';
import type { PublicCard } from '@/types/vibecheck';
import { getSupabaseAdmin } from './supabase-admin';
import { findAxisCredit, isAxisAutoApprovalConfigured } from './axis-mailbox';
import { notifyCreatorCardReady } from './notify-card-ready';

type Result = 'disabled' | 'pending' | 'verified';
const attempts = new Map<string, { at: number; result: Promise<Result> }>();

/** Fail closed: no credentials, missing migration, delayed email, or ambiguous alert = manual review. */
export async function tryAxisAutoApproval(card: PublicCard, transactionId: string, baseUrl: string): Promise<Result> {
  if (!isAxisAutoApprovalConfigured()) return 'disabled';
  if (card.is_paid) return 'verified';
  const key = `${card.id}:${transactionId}`;
  const existing = attempts.get(key);
  if (existing && Date.now() - existing.at < 30_000) return existing.result;
  for (const [id, value] of attempts) if (Date.now() - value.at > 60_000) attempts.delete(id);
  if (attempts.size > 500) return 'pending';
  const result = verify(card, transactionId, baseUrl).catch((): Result => {
    // Do not log the email body, OAuth credentials, or bank account details.
    console.error('Axis email verification unavailable; payment remains in manual review.');
    return 'pending';
  });
  attempts.set(key, { at: Date.now(), result });
  return result;
}

async function verify(card: PublicCard, transactionId: string, baseUrl: string): Promise<Result> {
  const admin = getSupabaseAdmin();
  if (!admin) return 'pending';
  const { data: proof, error } = await admin.from('payments')
    .select('card_id,amount_in_paise,currency,status,raw_payload').eq('provider', 'upi_manual').eq('provider_payment_id', transactionId).maybeSingle();
  const amount = proof?.amount_in_paise ?? proof?.raw_payload?.expected_amount_in_paise;
  if (error || !proof || proof.card_id !== card.id || proof.status !== 'created' || proof.currency !== 'INR' || !Number.isSafeInteger(amount) || amount <= 0) return 'pending';
  const credit = await findAxisCredit({ transactionId, amountInPaise: amount, orderCreatedAt: card.created_at });
  if (!credit) return 'pending';
  const approved = await admin.rpc('approve_axis_email_payment', {
    p_card_id: card.id, p_transaction_id: credit.transactionId, p_amount_in_paise: credit.amountInPaise,
    p_message_id: credit.messageId, p_account_last4: credit.accountLast4, p_received_at: credit.receivedAt, p_transaction_at: credit.transactionAt,
  });
  if (approved.error) throw new Error('BANK_APPROVAL_NOT_COMMITTED');
  if (typeof approved.data?.newly_verified !== 'boolean') throw new Error('BANK_APPROVAL_NOT_COMMITTED');
  if (approved.data?.newly_verified) {
    await notifyCreatorCardReady(card.id, baseUrl).catch(() => console.error('Verified payment notification could not be delivered.'));
  }
  return 'verified';
}
