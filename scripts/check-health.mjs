import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

export async function checkHealth({
  url = 'https://vibecheck-gh7u.onrender.com/api/health',
  fetchImpl = fetch,
  sleep = delay,
  log = console.log,
  attempts = 3,
  timeoutMs = 75_000,
  retryDelayMs = 5_000,
} = {}) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.username || target.password) {
    throw new Error('Health checks require an HTTPS URL without credentials.');
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = Date.now();
    target.searchParams.set('ping', String(startedAt));
    try {
      const response = await fetchImpl(target, {
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Application JSON missing; the service may still be waking up.');
      }

      const body = await response.json();
      const timestamp = Date.parse(body?.timestamp);
      if (body?.status !== 'ok' || body?.service !== 'vibecheck' ||
          !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 120_000) {
        throw new Error('Application health response is invalid or stale.');
      }

      log(`VibeCheck healthy: HTTP ${response.status}, ${Date.now() - startedAt}ms, attempt ${attempt}/${attempts}`);
      return body;
    } catch (error) {
      lastError = error;
      log(`Health check ${attempt}/${attempts} failed: ${error instanceof Error ? error.message : 'Request failed'}`);
      if (attempt < attempts) await sleep(retryDelayMs);
    }
  }
  throw new Error('VibeCheck did not become healthy within the retry budget.', { cause: lastError });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkHealth({ url: process.env.HEALTHCHECK_URL || undefined }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
