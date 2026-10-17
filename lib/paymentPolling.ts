type PaymentStatus = { is_paid?: boolean; payment_reference_submitted?: boolean };

export function startPaymentPolling(cardId: string, onStatus: (status: PaymentStatus) => void) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight = false;
  let paid = false;

  const refresh = async () => {
    if (controller.signal.aborted || inFlight || paid) return;
    clearTimeout(timer);
    inFlight = true;
    try {
      const response = await fetch(`/api/cards?id=${encodeURIComponent(cardId)}&status=payment`, {
        cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
      });
      if (!response.ok) return;
      const status = await response.json() as PaymentStatus;
      if (controller.signal.aborted) return;
      paid = status.is_paid === true;
      onStatus(status);
    } catch {
      // Returning from a payment app or a temporary network failure must not stop verification.
    } finally {
      inFlight = false;
      if (!controller.signal.aborted && !paid) timer = setTimeout(refresh, 3000);
    }
  };

  void refresh();
  return { refresh, stop: () => { controller.abort(); clearTimeout(timer); } };
}
