import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkHealth } from '../scripts/check-health.mjs';

const healthy = () => Response.json({ status: 'ok', service: 'vibecheck', timestamp: new Date().toISOString() });
const options = { sleep: async () => {}, log: () => {} };

test('healthy JSON passes on the first request with cache bypass and timeout', async () => {
  let calls = 0;
  await checkHealth({ ...options, fetchImpl: async (url, init) => {
    calls += 1;
    assert.ok(url.searchParams.get('ping'));
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    return healthy();
  } });
  assert.equal(calls, 1);
});

test('a Render HTML loading page is retried, not treated as success', async () => {
  let calls = 0;
  await checkHealth({ ...options, fetchImpl: async () => ++calls === 1
    ? new Response('<html>Waking up</html>', { headers: { 'Content-Type': 'text/html' } })
    : healthy() });
  assert.equal(calls, 2);
});

for (const [name, response] of [
  ['HTTP error', () => new Response('', { status: 503 })],
  ['wrong application', () => Response.json({ status: 'ok', service: 'another-app', timestamp: new Date().toISOString() })],
  ['cached response', () => Response.json({ status: 'ok', service: 'vibecheck', timestamp: '2020-01-01T00:00:00Z' })],
  ['invalid JSON', () => new Response('{', { headers: { 'Content-Type': 'application/json' } })],
  ['network failure', () => { throw new Error('network unavailable'); }],
]) {
  test(`${name} exhausts the bounded retry budget and fails`, async () => {
    let calls = 0;
    let sleeps = 0;
    await assert.rejects(checkHealth({
      ...options,
      sleep: async () => { sleeps += 1; },
      fetchImpl: async () => { calls += 1; return response(); },
    }), /retry budget/);
    assert.equal(calls, 3);
    assert.equal(sleeps, 2);
  });
}

test('rejects plaintext or credential-bearing monitor URLs before requesting', async () => {
  for (const url of ['http://example.com/api/health', 'https://secret:password@example.com/api/health']) {
    await assert.rejects(checkHealth({ ...options, url, fetchImpl: async () => assert.fail('must not request') }), /HTTPS URL without credentials/);
  }
});
