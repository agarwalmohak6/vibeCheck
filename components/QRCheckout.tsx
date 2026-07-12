'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiIntent, isValidUpiVpa } from '@/lib/upi';
import { supabase } from '@/lib/supabase';
import PaymentReferenceForm from '@/components/PaymentReferenceForm';

interface QRCheckoutProps {
  cardId: string;
  amount: number;
  onPaid: () => void;
  vpa?: string;
}

export default function QRCheckout({ cardId, amount, onPaid, vpa }: QRCheckoutProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [referenceSubmitted, setReferenceSubmitted] = useState(false);
  const allowMockPayments = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';
  const configuredVpa = (vpa || process.env.NEXT_PUBLIC_UPI_VPA || '').trim();
  const hasValidVpa = isValidUpiVpa(configuredVpa);

  // 1. Build the UPI Intent URL
  const payeeName = "VibeCheck";
  const txnId = cardId.replace(/-/g, '').substring(0, 32); // clean txn id
  const upiIntent = hasValidVpa
    ? buildUpiIntent(configuredVpa, payeeName, txnId, amount, `VibeCheck Premium ID ${cardId.substring(0, 8)}`)
    : '';

  // 2. Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // 3. Supabase Realtime Listener
  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isMock) {
      const channel = supabase
        .channel(`card-payment-${cardId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'cards', filter: `id=eq.${cardId}` },
          (payload) => {
            if (payload.new && (payload.new as { is_paid?: boolean }).is_paid) {
              onPaid();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [cardId, onPaid]);

  // 4. Polling Fallback (every 3 seconds)
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/cards?id=${cardId}&status=payment`);
        if (res.ok) {
          const card = await res.json();
          if (card.is_paid) {
            onPaid();
          } else if (card.payment_reference_submitted) {
            setReferenceSubmitted(true);
          }
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    };

    if (timeLeft > 0) {
      pollingInterval = setInterval(checkPaymentStatus, 3000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [cardId, onPaid, timeLeft]);

  // 5. Mock Payment Trigger (to bypass payment in dev/demo)
  const handleMockPayment = async () => {
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vibecheck-mock-payment': 'true' },
        body: JSON.stringify({
          card_id: cardId,
          payment_id: `mock_txn_${Date.now()}`,
          status: 'success'
        }),
      });

      if (res.ok) {
        onPaid();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to trigger mock payment');
      }
    } catch (err) {
      setErrorMsg('Network error trying to simulate payment');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-pink-200/80 bg-white/[0.82] p-4 text-left shadow-2xl shadow-pink-200/50 backdrop-blur sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -left-16 top-8 h-64 w-64 rounded-full bg-pink-300/45 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-amber-200/55 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-rose-300/35 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-8 text-5xl opacity-20">💞</div>
      <div className="pointer-events-none absolute right-14 top-12 text-4xl opacity-20">🍰</div>
      <div className="pointer-events-none absolute bottom-10 right-1/3 text-5xl opacity-20">💌</div>

      <div className="relative grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-[2rem] border border-pink-200 bg-linear-to-br from-white via-pink-50 to-amber-50 p-5 shadow-xl shadow-pink-100/80">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-pink-500">Direct UPI backup</p>
            <h3 className="mt-3 font-[var(--font-display)] text-4xl font-black leading-[0.95] text-[#3d1a2e] sm:text-5xl">
              Your surprise is still cooking.
            </h3>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[#7b3f6e]">
              Razorpay was being moody, so here is the cute manual route. Pay, paste the UTR, and the card unlocks after verification.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['1', 'Scan or open UPI'],
              ['2', 'Pay the exact amount'],
              ['3', 'Paste UTR below'],
            ].map(([step, label]) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-pink-200 bg-white/75 p-3 shadow-lg shadow-pink-100">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-r from-pink-500 to-amber-500 text-sm font-black text-white">
                  {step}
                </span>
                <span className="text-sm font-black text-[#3d1a2e]">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Tiny promise</p>
            <p className="mt-2 text-sm font-black leading-relaxed text-[#7b3f6e]">
              This is the last boring step before the lovely part opens.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-pink-200 bg-white/85 p-5 text-center shadow-xl shadow-pink-100/80">
          <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center lg:text-left">
            <div className="mx-auto inline-block rounded-[2rem] border border-pink-200 bg-white p-4 shadow-2xl shadow-pink-200/60">
              {!hasValidVpa ? (
                <div className="flex h-[220px] w-[220px] flex-col items-center justify-center rounded-2xl bg-pink-50 p-4 text-center text-[#3d1a2e]">
                  <span className="mb-2 text-3xl">⚠️</span>
                  <p className="text-sm font-black">UPI ID missing or invalid</p>
                  <p className="mt-1 text-xs font-bold leading-snug text-[#7b3f6e]">Set NEXT_PUBLIC_UPI_VPA and redeploy.</p>
                </div>
              ) : timeLeft > 0 ? (
                <QRCodeSVG
                  value={upiIntent}
                  size={220}
                  level="M"
                  fgColor="#3d1a2e"
                  bgColor="#FFFFFF"
                />
              ) : (
                <div className="flex h-[220px] w-[220px] flex-col items-center justify-center rounded-2xl bg-pink-50 p-4 text-center text-[#3d1a2e]">
                  <span className="mb-2 text-3xl">⏰</span>
                  <p className="text-sm font-black">QR expired</p>
                  <button
                    onClick={() => setTimeLeft(300)}
                    className="mt-3 rounded-full bg-[#3d1a2e] px-4 py-2 text-xs font-black text-white"
                  >
                    Refresh QR
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-pink-200 bg-pink-50/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9e6b8a]">Amount due</p>
                    <p className="mt-1 text-4xl font-black text-[#3d1a2e]">₹{amount}</p>
                  </div>
                  {timeLeft > 0 && (
                    <div className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e6b8a]">QR timer</p>
                      <p className="font-mono text-lg font-black text-pink-500">{formatTime(timeLeft)}</p>
                    </div>
                  )}
                </div>
              </div>

              {hasValidVpa && (
                <div className="space-y-3">
                  <a
                    href={upiIntent}
                    className="block rounded-2xl bg-linear-to-r from-pink-500 via-rose-500 to-amber-500 px-5 py-4 text-center text-sm font-black text-white shadow-xl shadow-pink-300/45 transition hover:-translate-y-0.5"
                  >
                    Open UPI app and pay
                  </a>
                  <div className="rounded-2xl border border-pink-200 bg-white/80 px-4 py-3 text-xs font-black text-[#7b3f6e]">
                    Paying to <span className="text-pink-500">{configuredVpa}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <PaymentReferenceForm
              cardId={cardId}
              variant="soft"
              onSubmitted={() => setReferenceSubmitted(true)}
            />

            <div className="rounded-2xl border border-pink-200 bg-white/70 p-4 text-left shadow-lg shadow-pink-100">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-500">After payment</p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-[#7b3f6e]">
                Open your UPI app history, copy the UTR or transaction reference, and submit it here.
              </p>
              {referenceSubmitted && (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  UTR received. Keep this page open while it waits for verification.
                </p>
              )}
            </div>
          </div>

          {allowMockPayments && (
            <div className="mt-4 border-t border-pink-100 pt-4">
              <button
                onClick={handleMockPayment}
                disabled={isVerifying}
                className="w-full rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-xs font-black text-pink-600 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVerifying ? 'Processing sim...' : 'Test Pay (Instant Success)'}
              </button>
              {errorMsg && (
                <p className="mt-2 text-[10px] font-bold text-red-500">{errorMsg}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
