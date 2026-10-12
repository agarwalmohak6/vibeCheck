'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiIntent, DEFAULT_UPI_VPA, isValidUpiVpa } from '@/lib/upi';
import { supabase } from '@/lib/supabase';
import PaymentReferenceForm from '@/components/PaymentReferenceForm';

interface QRCheckoutProps {
  cardId: string;
  amount: number;
  onPaid: () => void;
  vpa?: string;
  orderId?: string;
  creatorEmail?: string;
  creatorWhatsapp?: string;
}

export default function QRCheckout({
  cardId,
  amount,
  onPaid,
  vpa,
  orderId,
  creatorEmail,
  creatorWhatsapp,
}: QRCheckoutProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [referenceSubmitted, setReferenceSubmitted] = useState(false);
  const configuredVpa = (vpa || process.env.NEXT_PUBLIC_UPI_VPA || DEFAULT_UPI_VPA).trim();
  const hasValidVpa = isValidUpiVpa(configuredVpa);

  // 1. Build the UPI Intent URL
  const payeeName = "VibeCheck";
  const txnId = (orderId || cardId).replace(/[^A-Za-z0-9]/g, '').substring(0, 32); // clean txn id
  const upiIntent = hasValidVpa
    ? buildUpiIntent(configuredVpa, payeeName, txnId, amount, `VibeCheck ${orderId || cardId.substring(0, 8)}`)
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

  return (
    <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#e7ccaf]/80 bg-white/[0.86] p-3 text-left shadow-2xl shadow-[#eedaca]/50 backdrop-blur sm:rounded-[2.25rem] sm:p-5 lg:p-7">
      <div className="pointer-events-none absolute -left-16 top-8 h-64 w-64 rounded-full bg-pink-300/45 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-amber-200/55 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-rose-300/35 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-8 text-5xl opacity-20">💞</div>
      <div className="pointer-events-none absolute right-14 top-12 text-4xl opacity-20">🍰</div>
      <div className="pointer-events-none absolute bottom-10 right-1/3 text-5xl opacity-20">💌</div>

      <div className="relative grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="order-2 flex flex-col justify-between rounded-[1.5rem] border border-[#e7ccaf] bg-linear-to-br from-white via-pink-50 to-amber-50 p-4 shadow-xl shadow-[#eedaca]/80 sm:rounded-[2rem] sm:p-5 lg:order-1">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b65361]">UPI checkout</p>
            <h3 className="mt-3 font-[var(--font-display)] text-3xl font-black leading-[0.95] text-[#714337] sm:text-5xl">
              Pay fast. Paste UTR. Unlock clean.
            </h3>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[#8b6150]">
              Tap the UPI button on mobile or scan the QR on desktop. After payment, submit the exact UTR so admin can verify and unlock the card.
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-[#e7ccaf] bg-white/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b65361]">Order tracking</p>
            <p className="mt-1 font-mono text-lg font-black text-[#714337]">{orderId || cardId.slice(0, 8).toUpperCase()}</p>
            <p className="mt-2 text-xs font-bold leading-relaxed text-[#8b6150]">
              Tracking link saved for {creatorEmail || 'your email'}{creatorWhatsapp ? ` and ${creatorWhatsapp}` : ''}.
            </p>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['1', 'Open UPI app'],
              ['2', 'Pay the exact amount'],
              ['3', 'Submit UTR'],
            ].map(([step, label]) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-[#e7ccaf] bg-white/75 p-3 shadow-lg shadow-[#eedaca]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-r from-[#d5786d] to-[#c75765] text-sm font-black text-white">
                  {step}
                </span>
                <span className="text-sm font-black text-[#714337]">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Tiny promise</p>
            <p className="mt-2 text-sm font-black leading-relaxed text-[#8b6150]">
              This is direct UPI, so verification uses your UTR instead of silently trusting a screenshot.
            </p>
          </div>
        </div>

        <div className="order-1 rounded-[1.5rem] border border-[#e7ccaf] bg-white/88 p-4 text-center shadow-xl shadow-[#eedaca]/80 sm:rounded-[2rem] sm:p-5 lg:order-2">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center lg:text-left">
            <div className="mx-auto inline-block rounded-[1.5rem] border border-[#e7ccaf] bg-white p-3 shadow-2xl shadow-[#eedaca]/60 sm:rounded-[2rem] sm:p-4">
              {!hasValidVpa ? (
                <div className="flex h-[190px] w-[190px] flex-col items-center justify-center rounded-2xl bg-[#fff4e8] p-4 text-center text-[#714337] sm:h-[220px] sm:w-[220px]">
                  <span className="mb-2 text-3xl">⚠️</span>
                  <p className="text-sm font-black">UPI ID missing or invalid</p>
                  <p className="mt-1 text-xs font-bold leading-snug text-[#8b6150]">Set NEXT_PUBLIC_UPI_VPA and redeploy.</p>
                </div>
              ) : timeLeft > 0 ? (
                <QRCodeSVG
                  value={upiIntent}
                  size={210}
                  level="M"
                  fgColor="#714337"
                  bgColor="#FFFFFF"
                />
              ) : (
                <div className="flex h-[190px] w-[190px] flex-col items-center justify-center rounded-2xl bg-[#fff4e8] p-4 text-center text-[#714337] sm:h-[220px] sm:w-[220px]">
                  <span className="mb-2 text-3xl">⏰</span>
                  <p className="text-sm font-black">QR expired</p>
                  <button
                    onClick={() => setTimeLeft(300)}
                    className="mt-3 rounded-full bg-[#714337] px-4 py-2 text-xs font-black text-white"
                  >
                    Refresh QR
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-[#e7ccaf] bg-[#fff4e8]/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#946f59]">Amount due</p>
                    <p className="mt-1 text-4xl font-black text-[#714337]">₹{amount}</p>
                  </div>
                  {timeLeft > 0 && (
                    <div className="rounded-2xl border border-[#e7ccaf] bg-white px-4 py-3 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#946f59]">QR timer</p>
                      <p className="font-mono text-lg font-black text-[#b65361]">{formatTime(timeLeft)}</p>
                    </div>
                  )}
                </div>
              </div>

              {hasValidVpa && (
                <div className="space-y-3">
                  <a
                    href={upiIntent}
                    className="block rounded-2xl bg-linear-to-r from-[#d5786d] via-rose-500 to-[#c75765] px-5 py-4 text-center text-sm font-black text-white shadow-xl shadow-pink-300/45 transition hover:-translate-y-0.5"
                  >
                    Open PhonePe / GPay / Paytm
                  </a>
              <div className="rounded-2xl border border-[#e7ccaf] bg-white/80 px-4 py-3 text-xs font-black text-[#8b6150]">
                Paying to <span className="text-[#b65361]">{configuredVpa}</span>
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

            <div className="rounded-2xl border border-[#e7ccaf] bg-white/70 p-4 text-left shadow-lg shadow-[#eedaca]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b65361]">After payment</p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-[#8b6150]">
                Open your UPI app history, copy the UTR or transaction reference, and submit it here.
              </p>
              {referenceSubmitted && (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  UTR received. Keep this page open while it waits for verification.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
