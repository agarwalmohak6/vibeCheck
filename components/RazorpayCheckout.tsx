'use client';

import { ReactNode, useState } from 'react';

type RazorpayCheckoutProps = {
  cardId: string;
  amount: number;
  onPaid: () => void;
  fallback?: ReactNode;
};

type RazorpayOrderResponse = {
  success?: boolean;
  already_paid?: boolean;
  key_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  tier_label?: string;
  error?: string;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', callback: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatPrefillContact(value: string) {
  const cleaned = value.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;

  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return digits;
}

export default function RazorpayCheckout({ cardId, amount, onPaid, fallback }: RazorpayCheckoutProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isFallbackVisible, setIsFallbackVisible] = useState(false);
  const [error, setError] = useState('');
  const prefillContact = formatPrefillContact(process.env.NEXT_PUBLIC_RAZORPAY_PREFILL_CONTACT || '');

  const openCheckout = async () => {
    setIsStarting(true);
    setError('');

    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId }),
      });
      const order = await orderRes.json() as RazorpayOrderResponse;

      if (order.already_paid) {
        onPaid();
        return;
      }

      if (!orderRes.ok || !order.key_id || !order.order_id || !order.amount || !order.currency) {
        setError(order.error || 'Automatic payment is unavailable right now.');
        setIsFallbackVisible(true);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError('Payment sheet could not load. You can use direct UPI below.');
        setIsFallbackVisible(true);
        return;
      }

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'VibeCheck',
        description: `${order.tier_label || 'Private card'} - private card unlock`,
        order_id: order.order_id,
        notes: {
          card_id: cardId,
          product: 'vibecheck_private_card',
        },
        prefill: prefillContact
          ? {
              contact: prefillContact,
            }
          : undefined,
        theme: {
          color: '#e91e8c',
          backdrop_color: '#fff0f6',
        },
        modal: {
          ondismiss: () => {
            setIsStarting(false);
            setIsFallbackVisible(true);
            setError('Razorpay did not complete this time. Direct UPI is ready below, and your card will still unlock after UTR verification.');
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              card_id: cardId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            setError(verifyData.error || 'Payment completed, but verification failed. Use direct UPI below and submit the UTR.');
            setIsFallbackVisible(true);
            setIsStarting(false);
            return;
          }

          onPaid();
        },
      });

      checkout.on('payment.failed', () => {
        setError('Payment was not completed. Try Razorpay again or use direct UPI below.');
        setIsFallbackVisible(true);
        setIsStarting(false);
      });

      checkout.open();
    } catch {
      setError('Could not start Razorpay right now. Direct UPI is ready below.');
      setIsFallbackVisible(true);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-pink-200/70 bg-white/80 p-4 text-left shadow-2xl shadow-pink-200/50 backdrop-blur sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-300/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-[-5rem] h-72 w-72 rounded-full bg-amber-300/45 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(233,30,140,0.12),transparent_28%),radial-gradient(circle_at_84%_28%,rgba(212,160,23,0.14),transparent_30%)]" />
        <div className="pointer-events-none absolute left-8 top-8 text-4xl opacity-20">💌</div>
        <div className="pointer-events-none absolute right-10 top-12 text-3xl opacity-20">✨</div>
        <div className="pointer-events-none absolute bottom-10 left-[45%] text-4xl opacity-20">🎁</div>

        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="space-y-5 p-2 sm:p-4">
            <div className="inline-flex rounded-full border border-pink-200 bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-pink-500 shadow-lg shadow-pink-100">
              Your VibeCheck is almost ready
            </div>
            <div className="space-y-3">
              <h2 className="font-[var(--font-display)] text-5xl font-black leading-[0.92] text-[#3d1a2e] sm:text-6xl">
                The best thing for them is cooking.
              </h2>
              <p className="max-w-xl text-base font-bold leading-relaxed text-[#7b3f6e] sm:text-lg">
                We have wrapped the card, hidden the tiny questions, warmed up the song, and kept the reveal waiting at the door.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['💗', 'One private link'],
                ['🎵', 'Song attached'],
                ['🔐', 'Unlocks after payment'],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-3xl border border-pink-200 bg-white/70 p-4 shadow-xl shadow-pink-100/70">
                  <p className="text-2xl">{icon}</p>
                  <p className="mt-2 text-sm font-black text-[#3d1a2e]">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-black text-[#7b3f6e]">
              {['No forwarded-card energy', 'Made for one person', 'Send-worthy reveal', 'Cute enough to pay for'].map((label) => (
                <span key={label} className="rounded-full border border-pink-200 bg-white/65 px-3 py-2 shadow-md shadow-pink-100">
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-[#3d1a2e]/10 bg-[#130b10] p-5 text-center shadow-2xl shadow-[#3d1a2e]/20 sm:p-6">
            <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-pink-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-amber-500/25 blur-3xl" />

            <div className="relative space-y-5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-pink-200">Secure Razorpay checkout</p>
                <h3 className="text-3xl font-black text-white">Pay ₹{amount} and unlock instantly</h3>
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-neutral-300">
                  Razorpay can show any enabled method for your account. If it still says no method found, use direct UPI below.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Amount due</p>
                    <p className="text-3xl font-black text-white">₹{amount}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-200">
                    Auto unlock
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={openCheckout}
                disabled={isStarting}
                className="w-full rounded-2xl bg-linear-to-r from-pink-500 via-rose-500 to-amber-500 px-5 py-4 text-sm font-black text-white shadow-xl shadow-pink-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStarting ? 'Opening secure payment...' : 'Pay securely with Razorpay'}
              </button>

              <button
                type="button"
                onClick={() => setIsFallbackVisible((value) => !value)}
                className="text-[12px] font-black text-neutral-300 underline decoration-white/20 underline-offset-4 hover:text-pink-200"
              >
                {isFallbackVisible ? 'Hide direct UPI backup' : 'Razorpay stuck? Use direct UPI backup'}
              </button>

              {error && (
                <p className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-[11px] font-bold text-red-100">
                  {error}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {isFallbackVisible && (
        <div className="animate-bounce-in">
          {fallback}
        </div>
      )}
    </div>
  );
}
