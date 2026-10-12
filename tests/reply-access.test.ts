import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
vi.mock('@/services/server/rate-limit', () => ({ checkRateLimit: () => true, getClientIp: () => 'test' }));
vi.mock('@/services/server/card-store', () => ({ getPublicCard: vi.fn(), getMessagesForCard: vi.fn(async () => []), sendCardMessage: vi.fn(async () => ({ id: 'message' })) }));
import { getPublicCard, sendCardMessage } from '@/services/server/card-store';
import { createAccessToken } from '@/services/server/security';
import { GET, POST } from '@/app/api/messages/route';
const id = 'a30212fb-3d99-4e96-bde2-d602d3fef4cf';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VIBECHECK_TOKEN_SECRET', 'test-secret-for-card-replies');
  vi.mocked(getPublicCard).mockResolvedValue({ id, recipient_name: 'You', creator_name: 'Me', template_type: 'netflix_chill', theme_selected: 'midnight_romance', tier_selected: 'one_moment', created_at: new Date().toISOString(), is_paid: true, card_data: { message_title: 'A note', main_body: 'Hello', has_secret_code: true } });
});
function request(method: 'GET' | 'POST', headers: Record<string, string> = {}) {
  return new NextRequest(`https://example.com/api/messages?card_id=${id}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(method === 'POST' ? { body: JSON.stringify({ card_id: id, sender: 'recipient', text: 'I’d love to', message_id: 'd4e8c88e-7767-4bfc-897f-76ad3093bdf6' }) } : {}) });
}
describe('private reply room access', () => {
  it('keeps reads and writes locked until the private card is unlocked', async () => {
    expect((await GET(request('GET'))).status).toBe(403);
    expect((await POST(request('POST'))).status).toBe(403);
    expect(sendCardMessage).not.toHaveBeenCalled();
  });
  it('lets the unlocked recipient send a stable message ID for safe retries', async () => {
    const headers = { 'x-vibecheck-unlock-token': createAccessToken(id, 'unlock') };
    expect((await GET(request('GET', headers))).status).toBe(200);
    expect((await POST(request('POST', headers))).status).toBe(200);
    expect(sendCardMessage).toHaveBeenCalledWith(id, 'recipient', 'I’d love to', null, 'd4e8c88e-7767-4bfc-897f-76ad3093bdf6');
  });
  it('lets the creator enter their own locked room with the creator token', async () => {
    expect((await GET(request('GET', { 'x-vibecheck-creator-token': createAccessToken(id, 'creator') }))).status).toBe(200);
  });
});
