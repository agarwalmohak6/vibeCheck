'use client';

import { FormEvent, useState } from 'react';

type PaymentReferenceFormProps = {
  cardId: string;
  className?: string;
  variant?: 'dark' | 'soft';
  onSubmitted?: (reference: string) => void;
};

function normalizeReference(value: string) {
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(
      /\b(?:UPI|UTR|RRN|REF|REFERENCE|TRANSACTION|TXN|TXNID|TRN|ID|NO|NUMBER)\b\s*[:#-]*/gi,
      ' ',
    )
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ''))
    .filter((token) => token.length >= 6 && token.length <= 40);
  const tokensWithDigits = tokens.filter((token) => /\d/.test(token));
  if (tokensWithDigits.length) return tokensWithDigits[tokensWithDigits.length - 1];
  return cleaned.replace(/[\s-]+/g, '');
}

export default function PaymentReferenceForm({
  cardId,
  className = '',
  variant = 'dark',
  onSubmitted,
}: PaymentReferenceFormProps) {
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [error, setError] = useState('');
  const isDark = variant === 'dark';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeReference(reference);

    if (normalized.length < 6) {
      setError('Enter the Transaction ID from your payment app.');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/payment/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId, transaction_id: normalized }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not submit the reference. Please check it once and retry.');
        setStatus('idle');
        return;
      }

      const submittedReference = data.payment_reference || normalized;
      setReference(submittedReference);
      setStatus('submitted');
      onSubmitted?.(submittedReference);
    } catch {
      setError('Network hiccup while submitting the reference. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-2xl border p-3 text-left ${
        isDark
          ? 'border-white/10 bg-white/[0.04]'
          : 'border-[#e7ccaf]/80 bg-white/65 shadow-lg shadow-[#eedaca]/30'
      } ${className}`}
    >
      <div className="mb-2 space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-pink-200' : 'text-[#b65361]'}`}>
          Paid already?
        </p>
        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-[#7b4b70]'}`}>
          Enter your Transaction ID The card unlocks after verification.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={reference}
          onChange={(event) => {
            setReference(event.target.value);
            if (error) setError('');
          }}
          disabled={status === 'submitting'}
          placeholder="Transaction ID"
          aria-label="Transaction ID"
          autoComplete="off"
          inputMode="text"
          autoCapitalize="characters"
          className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs font-bold outline-none transition focus:ring-2 ${
            isDark
              ? 'border-white/10 bg-black/20 text-white placeholder:text-neutral-500 focus:ring-pink-400/40'
              : 'border-[#e7ccaf] bg-white/85 text-[#3f1e33] placeholder:text-[#b78daa] focus:ring-pink-300/50'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="shrink-0 rounded-xl bg-linear-to-r from-[#d5786d] to-[#c75765] px-3 py-2 text-xs font-black text-white shadow-lg shadow-pink-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Saving...' : 'Submit'}
        </button>
      </div>

      {status === 'submitted' && (
        <p className={`mt-2 text-[10px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
          Transaction ID submitted. We’ll verify the received payment before unlocking your card.
        </p>
      )}
      {error && (
        <p className={`mt-2 text-[10px] font-bold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </form>
  );
}
