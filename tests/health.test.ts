import { describe, expect, it } from 'vitest';
import { GET, dynamic } from '@/app/api/health/route';

describe('public liveness endpoint', () => {
  it('returns fresh, uncached health JSON without database or email dependencies', async () => {
    const before = Date.now();
    const response = await GET();
    const body = await response.json();
    expect(dynamic).toBe('force-dynamic');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(body).toEqual({ status: 'ok', service: 'vibecheck', timestamp: expect.any(String) });
    expect(Date.parse(body.timestamp)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(body.timestamp)).toBeLessThanOrEqual(Date.now());
  });
});
