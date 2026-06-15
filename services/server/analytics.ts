import 'server-only';

export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {}
) {
  const key = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';
  if (!key) return;

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties,
      }),
      keepalive: true,
    });
  } catch {
    // Analytics must never block the purchase or card experience.
  }
}
