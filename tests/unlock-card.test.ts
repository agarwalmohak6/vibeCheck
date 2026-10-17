import { describe, expect, it, vi } from 'vitest';
import { requestCardUnlock } from '@/lib/unlockCard';

describe('private lock request', () => {
  it('requires a successful server verification and its unlock token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ unlocked: true, unlock_token: 'verified-token' }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    expect(await requestCardUnlock('card-id', ' 1234 ', controller.signal)).toEqual({ status: 'unlocked', token: 'verified-token' });
    expect(fetchMock).toHaveBeenCalledWith('/api/cards/card-id/unlock', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ code: '1234' }), signal: controller.signal,
    }));
  });

  it.each([
    [401, 'incorrect'], [429, 'rate_limited'], [500, 'unavailable'], [503, 'unavailable'],
  ])('handles HTTP %s without unlocking', async (status, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: Number(status) })));
    expect(await requestCardUnlock('id', 'answer')).toEqual({ status: expected });
  });

  it.each([{ unlocked: true }, { unlock_token: 'token' }, { unlocked: false, unlock_token: 'token' }, { unlocked: true, unlock_token: '' }])('does not unlock with an incomplete success response %j', async response => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(response)));
    expect(await requestCardUnlock('id', '1234')).toEqual({ status: 'unavailable' });
  });

  it('handles an interrupted connection and permits a subsequent retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new DOMException('Timed out', 'AbortError'))
      .mockResolvedValueOnce(Response.json({ unlocked: true, unlock_token: 'token' })));
    expect(await requestCardUnlock('id', '1234')).toEqual({ status: 'unavailable' });
    expect(await requestCardUnlock('id', '1234')).toEqual({ status: 'unlocked', token: 'token' });
  });
});
