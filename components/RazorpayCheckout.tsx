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

export default function RazorpayCheckout({ cardId, amount, onPaid, fallback }: RazorpayCheckoutProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isFallbackVisible, setIsFallbackVisible] = useState(false);
  const [error, setError] = useState('');
  const prefillContact = (process.env.NEXT_PUBLIC_RAZORPAY_PREFILL_CONTACT || '').replace(/\D/g, '');

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
        description: `${order.tier_label || 'Private card'} - auto verified`,
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
        },
        modal: {
          ondismiss: () => setIsStarting(false),
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
            setError(verifyData.error || 'Payment completed, but verification failed. Use UTR fallback below.');
            setIsFallbackVisible(true);
            setIsStarting(false);
            return;
          }

          onPaid();
        },
      });

      checkout.on('payment.failed', () => {
        setError('Payment was not completed. Try again or use direct UPI below.');
        setIsFallbackVisible(true);
        setIsStarting(false);
      });

      checkout.open();
    } catch {
      setError('Could not start automatic payment. You can use direct UPI below.');
      setIsFallbackVisible(true);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 p-6 text-center shadow-2xl">
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-pink-200">Automatic UPI verification</p>
            <h3 className="text-2xl font-black text-white">Pay ₹{amount} and unlock instantly</h3>
            <p className="text-xs leading-relaxed text-neutral-400">
              Razorpay verifies the payment with a signed callback. No UTR checking, no manual approval.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Amount due</p>
                <p className="text-2xl font-black text-white">₹{amount}</p>
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
            className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-5 py-4 text-sm font-black text-white shadow-xl shadow-pink-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? 'Opening secure payment...' : 'Pay with UPI - auto verify'}
          </button>

          <button
            type="button"
            onClick={() => setIsFallbackVisible((value) => !value)}
            className="text-[11px] font-bold text-neutral-400 underline decoration-white/20 underline-offset-4 hover:text-pink-200"
          >
            {isFallbackVisible ? 'Hide direct UPI fallback' : 'Use direct UPI + UTR instead'}
          </button>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-[11px] font-bold text-red-200">
              {error}
            </p>
          )}
        </div>
      </div>

      {isFallbackVisible && fallback}
    </div>
  );
}
