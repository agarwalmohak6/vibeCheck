import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicCard } from '@/types/vibecheck';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ configured: vi.fn(), find: vi.fn(), from: vi.fn(), rpc: vi.fn(), notify: vi.fn() }));
vi.mock('@/services/server/axis-mailbox', () => ({ isAxisAutoApprovalConfigured: mocks.configured, findAxisCredit: mocks.find }));
vi.mock('@/services/server/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: mocks.from, rpc: mocks.rpc }) }));
vi.mock('@/services/server/notify-card-ready', () => ({ notifyCreatorCardReady: mocks.notify }));
import { tryAxisAutoApproval } from '@/services/server/axis-auto-approval';

let sequence = 0;
function card(): PublicCard { return { id: `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`, recipient_name: 'Recipient', creator_name: 'Creator', template_type: 'bestie_check', theme_selected: 'soft_coquette', tier_selected: 'one_moment', card_data: { message_title: 'Hello', main_body: 'A note' }, created_at: '2026-10-27T09:00:00Z', is_paid: false }; }
function proof(value: Record<string, unknown>) {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: value, error: null }) };
  mocks.from.mockReturnValue(query);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.find.mockResolvedValue({ messageId: 'bankcredit123456', transactionId: '123456789012', amountInPaise: 4900, accountLast4: '4321', receivedAt: '2026-10-27T09:05:01Z', transactionAt: '2026-10-27T09:05:00Z' });
  mocks.rpc.mockResolvedValue({ data: { newly_verified: true }, error: null });
  mocks.notify.mockResolvedValue({ email: { sent: true } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
describe('approval requires committed bank evidence', () => {
  it('does not read mail or change payments when the feature is disabled', async () => {
    mocks.configured.mockReturnValue(false);
    expect(await tryAxisAutoApproval(card(), '123456789012', 'https://example.com')).toBe('disabled');
    expect(mocks.find).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(['wrong_card', 'no_amount', 'foreign_currency', 'no_alert', 'mail_unavailable', 'migration_missing'])('keeps %s in manual review without a ready notification', async reason => {
    const order = card();
    proof({ card_id: reason === 'wrong_card' ? 'another-card' : order.id, amount_in_paise: reason === 'no_amount' ? null : 4900, currency: reason === 'foreign_currency' ? 'USD' : 'INR', status: 'created' });
    if (reason === 'no_alert') mocks.find.mockResolvedValue(null);
    if (reason === 'mail_unavailable') mocks.find.mockRejectedValue(new Error('Mailbox unavailable'));
    if (reason === 'migration_missing') mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    expect(await tryAxisAutoApproval(order, '123456789012', 'https://example.com')).toBe('pending');
    expect(mocks.notify).not.toHaveBeenCalled();
    if (reason !== 'migration_missing') expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('checks a concurrent/repeated reference once and notifies only after approval commits', async () => {
    const order = card(); proof({ card_id: order.id, amount_in_paise: 4900, currency: 'INR', status: 'created' });
    expect(await Promise.all([tryAxisAutoApproval(order, '123456789012', 'https://example.com'), tryAxisAutoApproval(order, '123456789012', 'https://example.com')])).toEqual(['verified', 'verified']);
    expect(mocks.find).toHaveBeenCalledOnce(); expect(mocks.rpc).toHaveBeenCalledOnce(); expect(mocks.notify).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.notify.mock.invocationCallOrder[0]);
  });
});
