import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cashfree = vi.hoisted(() => ({
  createCashfreeOrderForCard: vi.fn(),
  isCashfreeConfigured: vi.fn(),
}));

vi.mock('@/services/server/cashfree', () => cashfree);
vi.mock('@/services/server/rate-limit', () => ({
  checkRateLimit: vi.fn(() => true),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

import { POST } from '@/app/api/payment/cashfree/order/route';

const cardId = '123e4567-e89b-12d3-a456-426614174000';
const order = {
  order_id: 'cf_approved_order',
  payment_session_id: 'approved-session',
  card_id: cardId,
  amount: 99,
  currency: 'INR',
  tier_label: 'Keepsake',
};

function orderRequest() {
  return new NextRequest('https://example.com/api/payment/cashfree/order', {
    method: 'POST',
    body: JSON.stringify({ card_id: cardId }),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Cashfree new-order availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS', 'false');
    cashfree.isCashfreeConfigured.mockReturnValue(true);
    cashfree.createCashfreeOrderForCard.mockResolvedValue(order);
  });

  it.each([
    [undefined, undefined],
    ['false', 'false'],
    ['true', 'false'],
    ['false', 'true'],
    [undefined, 'true'],
    ['TRUE', 'true'],
    ['true', '1'],
  ])('rejects new orders unless both switches are explicitly true (%s, %s)', async (serverFlag, publicFlag) => {
    vi.stubEnv('CASHFREE_CHECKOUT_ENABLED', serverFlag);
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', publicFlag);

    const response = await POST(orderRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: 'CASHFREE_CHECKOUT_UNAVAILABLE',
      error: expect.stringContaining('direct UPI'),
    });
    expect(cashfree.createCashfreeOrderForCard).not.toHaveBeenCalled();
  });

  it('does not let development mock payments bypass the disabled gateway', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS', 'true');
    vi.stubEnv('CASHFREE_CHECKOUT_ENABLED', undefined);
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', undefined);
    cashfree.isCashfreeConfigured.mockReturnValue(false);

    const response = await POST(orderRequest());

    expect(response.status).toBe(503);
    expect(cashfree.createCashfreeOrderForCard).not.toHaveBeenCalled();
  });

  it('preserves configured order creation when both switches are enabled', async () => {
    vi.stubEnv('CASHFREE_CHECKOUT_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', 'true');

    const response = await POST(orderRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, ...order });
    expect(cashfree.createCashfreeOrderForCard).toHaveBeenCalledExactlyOnceWith(cardId, 'https://example.com');
  });

  it('still requires credentials when the approved checkout switches are enabled', async () => {
    vi.stubEnv('CASHFREE_CHECKOUT_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', 'true');
    cashfree.isCashfreeConfigured.mockReturnValue(false);

    const response = await POST(orderRequest());

    expect(response.status).toBe(401);
    expect(cashfree.createCashfreeOrderForCard).not.toHaveBeenCalled();
  });
});
