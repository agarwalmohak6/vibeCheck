'use client';

import { useState } from 'react';

type PaymentTestModeToggleProps = {
  cardId: string;
  amount: number;
  onPaid: () => void;
  creatorToken?: string | null;
  className?: string;
};

export default function PaymentTestModeToggle({
  cardId,
  amount,
  onPaid,
  creatorToken,
  className = '',
}: PaymentTestModeToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState('');
  const [skippedPaymentId, setSkippedPaymentId] = useState('');
  const canShowTestMode = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === 'true';

  if (!canShowTestMode) return null;

  const handleSkipPayment = async () => {
    setIsSkipping(true);
    setError('');
    setSkippedPaymentId('');

    try {
      const res = await fetch('/api/payment/test-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(creatorToken ? { 'x-vibecheck-creator-token': creatorToken } : {}),
        },
        body: JSON.stringify({
          card_id: cardId,
          reason: 'checkout_test_mode_toggle',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not skip payment in test mode.');
        return;
      }

      setSkippedPaymentId(data.payment_id || 'test_mode');
      onPaid();
    } catch {
      setError('Network hiccup while enabling test mode. Try once more.');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <section className={`relative overflow-hidden rounded-[2rem] border border-amber-200/80 bg-linear-to-br from-white via-amber-50 to-pink-50 p-4 text-left shadow-2xl shadow-amber-100/70 ${className}`}>
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-300/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-pink-300/35 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.8)]" />
            Test mode
          </div>
          <h3 className="mt-3 font-[var(--font-display)] text-3xl font-black leading-none text-[#3d1a2e]">
            Skip payment, keep it flagged.
          </h3>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-[#7b3f6e]">
            Use this while testing the full card flow. It unlocks the card for ₹{amount} and stores the payment as a test-mode skip.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            setEnabled((value) => !value);
            setError('');
          }}
          className={`relative h-12 w-24 shrink-0 rounded-full border p-1 transition cursor-pointer ${
            enabled
              ? 'border-amber-300 bg-[#3d1a2e] shadow-lg shadow-amber-200'
              : 'border-pink-200 bg-white/80 shadow-inner'
          }`}
        >
          <span
            className={`grid h-10 w-10 place-items-center rounded-full text-xs font-black transition ${
              enabled
                ? 'translate-x-12 bg-linear-to-r from-pink-500 to-amber-500 text-white'
                : 'translate-x-0 bg-pink-50 text-[#7b3f6e]'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {enabled && (
        <div className="relative mt-4 grid gap-3 rounded-3xl border border-amber-200 bg-white/75 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-500">Developer shortcut</p>
            <p className="mt-1 text-sm font-bold leading-relaxed text-[#7b3f6e]">
              This bypasses real UPI/admin approval and flags the payment as Test Mode in admin records.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkipPayment}
            disabled={isSkipping}
            className="rounded-2xl bg-[#3d1a2e] px-5 py-3 text-sm font-black text-white shadow-xl shadow-pink-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSkipping ? 'Flagging skip...' : 'Skip payment now'}
          </button>
        </div>
      )}

      {skippedPaymentId && (
        <p className="relative mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
          Test payment recorded: {skippedPaymentId}
        </p>
      )}
      {error && (
        <p className="relative mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
