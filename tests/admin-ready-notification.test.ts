import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), configured: vi.fn(), rateLimit: vi.fn(), verify: vi.fn(), card: vi.fn(), notify: vi.fn(), testPay: vi.fn(),
}));
vi.mock('@/services/server/admin-auth', () => ({ getAdminFromRequest: mocks.admin, isAdminConfigured: mocks.configured }));
vi.mock('@/services/server/card-store', () => ({ verifyUpiPaymentReference: mocks.verify, getPublicCard: mocks.card, markCardPaymentTestMode: mocks.testPay }));
vi.mock('@/services/server/config', () => ({ isTestPaymentsEnabled: () => true }));
vi.mock('@/services/server/notifications', () => ({ sendCreatorPaymentVerifiedNotifications: mocks.notify }));
vi.mock('@/services/server/rate-limit', () => ({ checkRateLimit: mocks.rateLimit, getClientIp: () => '127.0.0.1' }));
vi.mock('@/services/server/security', () => ({ createAccessToken: () => 'private+token', verifyAccessToken: () => true }));

import { POST as adminApprove } from '@/app/api/admin/verify-utr/route';
import { POST as manualApprove } from '@/app/api/payment/manual-verify/route';
import { POST as skipPayment } from '@/app/api/payment/test-mode/route';

const card = { id: 'card-123', is_paid: true, creator_name: 'Mohak', recipient_name: 'Priya', template_type: 'shoot_shot', theme_selected: 'proposal_glow', card_data: { creator_email: 'creator@example.com', order_id: 'VC-123' } };
const request = (utr = '123456789012') => new NextRequest('https://api.example.com/api/admin/verify-utr', { method: 'POST', body: JSON.stringify({ utr }), headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_BASE_URL', ' https://cards.example.com/// ');
  mocks.configured.mockReturnValue(true);
  mocks.admin.mockReturnValue({ email: 'admin@example.com' });
  mocks.rateLimit.mockReturnValue(true);
  mocks.verify.mockResolvedValue({ card_id: card.id, status: 'paid' });
  mocks.card.mockResolvedValue(card);
  mocks.notify.mockResolvedValue({ email: { sent: true } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe.each([['admin dashboard', adminApprove], ['manual payment', manualApprove]] as const)('%s ready notification', (_, approve) => {
  it('notifies the actual creator only after verification, with theme and separate links', async () => {
    const response = await approve(request());
    expect(response.status).toBe(200);
    expect(mocks.verify.mock.invocationCallOrder[0]).toBeLessThan(mocks.notify.mock.invocationCallOrder[0]);
    expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      creatorEmail: 'creator@example.com', templateType: 'shoot_shot', themeId: 'proposal_glow',
      recipientUrl: 'https://cards.example.com/card/card-123',
      trackingUrl: 'https://cards.example.com/card/card-123?ct=private%2Btoken',
    }));
  });
  it('blocks unauthenticated callers', async () => {
    mocks.admin.mockReturnValue(null);
    expect((await approve(request())).status).toBe(401);
    expect(mocks.verify).not.toHaveBeenCalled(); expect(mocks.notify).not.toHaveBeenCalled();
  });
  it('does not email on unknown payment references', async () => {
    mocks.verify.mockResolvedValue(null);
    expect((await approve(request())).status).toBe(404);
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it('never announces a card ready if its paid state is not persisted', async () => {
    mocks.card.mockResolvedValue({ ...card, is_paid: false });
    await approve(request());
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it('keeps payment approval successful and reports a failed notification', async () => {
    mocks.notify.mockResolvedValue({ email: { sent: false, reason: 'provider_error' } });
    const response = await approve(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, notifications: { email: { sent: false } } });
  });
  it('keeps an unexpected notification failure from undoing approval', async () => {
    mocks.notify.mockRejectedValue(new Error('Network failure'));
    const response = await approve(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, notifications: null });
  });
  it('keeps a post-payment read failure from reporting the payment as failed', async () => {
    mocks.card.mockRejectedValue(new Error('Temporary read failure'));
    const response = await approve(request());
    expect(response.status).toBe(200);
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});

it('sends a clearly flagged ready notification after a test-mode card is created', async () => {
  const id = '705429b5-e85a-4618-96f1-b88ebc3f84c9';
  mocks.testPay.mockResolvedValue({ card_id: id, test_mode: true });
  mocks.card.mockResolvedValue({ ...card, id, payment_id: 'test_mode_example' });
  const response = await skipPayment(new NextRequest('https://cards.example.com/api/payment/test-mode', {
    method: 'POST', body: JSON.stringify({ card_id: id }), headers: { 'Content-Type': 'application/json', 'x-vibecheck-creator-token': 'creator-token' },
  }));
  expect(response.status).toBe(200);
  expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ testMode: true, recipientUrl: `https://cards.example.com/card/${id}` }));
});
