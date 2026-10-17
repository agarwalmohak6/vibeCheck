export type UnlockResult =
  | { status: 'unlocked'; token: string }
  | { status: 'incorrect' | 'rate_limited' | 'unavailable' };

export async function requestCardUnlock(cardId: string, code: string, signal?: AbortSignal): Promise<UnlockResult> {
  try {
    const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
      signal,
    });
    if (response.status === 429) return { status: 'rate_limited' };
    if (response.status === 401) return { status: 'incorrect' };
    if (!response.ok) return { status: 'unavailable' };
    const data = await response.json();
    if (data?.unlocked !== true || typeof data.unlock_token !== 'string' || !data.unlock_token) {
      return { status: 'unavailable' };
    }
    return { status: 'unlocked', token: data.unlock_token };
  } catch {
    return { status: 'unavailable' };
  }
}
