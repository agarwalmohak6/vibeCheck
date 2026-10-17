'use client';

import { useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_modal' | '_top' | '_blank';
      }) => Promise<{
        error?: { message?: string; code?: string };
        redirect?: boolean;
        paymentDetails?: unknown;
      }>;
    };
  }
}

interface CashfreeCheckoutProps {
  cardId: string;
  amount: number;
  onPaid: () => void;
  orderId?: string;
  creatorToken?: string | null;
}

function loadCashfreeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Cashfree) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CashfreeCheckout({
  cardId,
  amount,
  onPaid,
  orderId,
  creatorToken,
}: CashfreeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  const verifyPayment = async (orderIdToVerify: string) => {
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/payment/cashfree/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(creatorToken ? { 'x-vibecheck-creator-token': creatorToken } : {}),
        },
        body: JSON.stringify({
          card_id: cardId,
          order_id: orderIdToVerify,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Payment verified successfully! Unlocking your card…');
        onPaid();
      } else {
        setError(data.error || 'Payment not detected yet. If you recently paid, please wait a few seconds and try again.');
      }
    } catch {
      setError('Network error while verifying payment. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleStartCheckout = async () => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const orderRes = await fetch('/api/payment/cashfree/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(creatorToken ? { 'x-vibecheck-creator-token': creatorToken } : {}),
        },
        body: JSON.stringify({ card_id: cardId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.payment_session_id) {
        if (orderData.already_paid) {
          onPaid();
          return;
        }
        setError(orderData.error || 'Could not initiate Cashfree checkout. Please try again or use direct UPI.');
        setLoading(false);
        return;
      }

      setActiveOrderId(orderData.order_id);

      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded || !window.Cashfree) {
        setError('Cashfree payment SDK could not be loaded. Please check your connection or use direct UPI.');
        setLoading(false);
        return;
      }

      const rawEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toLowerCase();
      const envMode: 'sandbox' | 'production' =
        rawEnv === 'production' || rawEnv === 'prod' ? 'production' : 'sandbox';

      const cashfree = window.Cashfree({ mode: envMode });

      setLoading(false);

      const result = await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_modal',
      });

      if (result?.error) {
        setError(result.error.message || 'Payment was cancelled or failed.');
        return;
      }

      // Check payment status on return
      await verifyPayment(orderData.order_id);
    } catch (err) {
      console.error('Cashfree checkout start error:', err);
      setError('An unexpected error occurred while starting payment.');
      setLoading(false);
    }
  };

  return (
    <section className="vc-cashfree-checkout rounded-3xl border border-pink-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-md md:p-8">
      <div className="flex flex-col gap-2 border-b border-pink-100 pb-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Instant Automated Payment
        </div>
        <h2 className="text-2xl font-black text-gray-900 md:text-3xl">
          Unlock Your VibeCheck
        </h2>
        <p className="text-sm text-gray-600">
          Order reference: <code className="font-mono text-xs text-gray-800">{orderId || cardId.slice(0, 8).toUpperCase()}</code>
        </p>
      </div>

      <div className="my-6 flex flex-col items-center justify-between gap-6 rounded-2xl bg-linear-to-br from-pink-50/70 to-purple-50/70 p-6 sm:flex-row">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total payable</span>
          <div className="text-4xl font-black text-gray-900">₹{amount.toFixed(2)}</div>
          <p className="mt-1 text-xs text-gray-500">
            One-time payment • No subscription • Instant delivery
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartCheckout}
          disabled={loading || verifying}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-pink-600 to-rose-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Opening checkout…</span>
            </>
          ) : (
            <>
              <span>Pay ₹{amount.toFixed(2)} via Cashfree</span>
              <span className="text-lg">✨</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-gray-500">
        <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1">GPay</span>
        <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1">PhonePe</span>
        <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1">Paytm UPI</span>
        <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1">Cards</span>
        <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1">NetBanking</span>
      </div>

      {activeOrderId && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          <span>Already completed payment in your UPI app or browser?</span>
          <button
            type="button"
            onClick={() => void verifyPayment(activeOrderId)}
            disabled={verifying}
            className="rounded-lg bg-amber-600 px-4 py-2 font-bold text-white transition hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
          >
            {verifying ? 'Checking status…' : 'Check payment status now'}
          </button>
        </div>
      )}

      {notice && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 border-t border-pink-100 pt-4 flex flex-wrap justify-between items-center text-xs text-gray-500">
        <span>Protected by 256-bit SSL encryption</span>
        <nav aria-label="Payment policies" className="flex gap-3 underline">
          <Link href="/terms" target="_blank">Terms</Link>
          <Link href="/privacy" target="_blank">Privacy</Link>
          <Link href="/refund-policy" target="_blank">Refunds</Link>
          <Link href="/shipping-policy" target="_blank">Delivery</Link>
        </nav>
      </div>
    </section>
  );
}
