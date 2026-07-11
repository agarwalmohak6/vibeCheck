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
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 bg-neutral-900 border border-white/10 rounded-2xl max-w-sm w-full mx-auto shadow-2xl relative overflow-hidden">
      
      {/* Background radial highlight */}
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Scan UPI QR to Pay</h3>
        <p className="text-xs text-neutral-400 mt-1">Unlock your interactive digital card</p>
      </div>

      {/* QR Container */}
      <div className="bg-white p-4 rounded-2xl shadow-xl relative inline-block border-4 border-pink-500/20">
        {!hasValidVpa ? (
          <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-neutral-800 text-center p-3">
            <span className="text-2xl mb-2">⚠️</span>
            <p className="text-xs font-bold">UPI ID missing or invalid</p>
            <p className="mt-1 text-[10px] leading-snug text-neutral-500">Set NEXT_PUBLIC_UPI_VPA and redeploy.</p>
          </div>
        ) : timeLeft > 0 ? (
          <QRCodeSVG 
            value={upiIntent} 
            size={180} 
            level="M"
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        ) : (
          <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-neutral-800 text-center p-2">
            <span className="text-2xl mb-1">⏰</span>
            <p className="text-xs font-bold">QR Expired</p>
            <button 
              onClick={() => setTimeLeft(300)} 
              className="mt-2 text-[10px] bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1 px-3 rounded cursor-pointer"
            >
              Refresh QR
            </button>
          </div>
        )}
      </div>
      {hasValidVpa && (
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-neutral-300">
          Paying to <span className="text-pink-300">{configuredVpa}</span>
        </div>
      )}

      {/* Pricing / Timer */}
      <div className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 flex justify-between items-center">
        <div className="text-left">
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Amount Due</p>
          <p className="text-base font-extrabold text-white">₹{amount}</p>
        </div>
        
        {timeLeft > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Expires In</p>
            <p className="text-sm font-mono font-bold text-pink-500">{formatTime(timeLeft)}</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-1">
        <p className="text-[10px] text-neutral-400 leading-normal">
          Open Google Pay, PhonePe, Paytm, or any UPI app to scan.
        </p>
        <p className="text-[9px] text-neutral-500 italic">
          After paying, submit the UTR/ref number below. The card unlocks once verified.
        </p>
      </div>

      <PaymentReferenceForm
        cardId={cardId}
        variant="dark"
        onSubmitted={() => setReferenceSubmitted(true)}
      />

      {referenceSubmitted && (
        <div className="w-full rounded-xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold leading-relaxed text-emerald-200">
          UTR received. Keep this page open; we are still waiting for verification.
        </div>
      )}

      {/* Dev Mock Sandbox Shortcut */}
      {allowMockPayments && (
      <div className="w-full pt-2 border-t border-white/5">
        <button
          onClick={handleMockPayment}
          disabled={isVerifying}
          className="w-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 text-pink-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? (
            <span>Processing Sim...</span>
          ) : (
            <>
              <span>⚡</span>
              <span>Test Pay (Instant Success)</span>
            </>
          )}
        </button>
        {errorMsg && (
          <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errorMsg}</p>
        )}
      </div>
      )}
    </div>
  );
}
