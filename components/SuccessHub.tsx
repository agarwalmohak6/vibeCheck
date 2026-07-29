'use client';

import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { whatsappLink } from '@/lib/utils';

export default function SuccessHub({
  cardId,
  receiptToken,
  recipientUrl,
  recipientName,
  creatorName,
  customerEmail,
  paymentId,
  expiresAt,
  emailSent,
}: {
  cardId: string;
  receiptToken: string;
  recipientUrl: string;
  recipientName: string;
  creatorName: string;
  customerEmail: string;
  paymentId: string;
  expiresAt?: string | null;
  emailSent: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [deliveryState, setDeliveryState] = useState<'sent' | 'pending' | 'sending' | 'config' | 'failed'>(
    emailSent ? 'sent' : 'pending',
  );
  const retryStarted = useRef(false);
  const cardUrl = recipientUrl;
  const maskedEmail = customerEmail.replace(/^(.{2}).*(@.*)$/, '$1•••$2');
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Lifetime plan';

  const copyLink = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.75 } });
    window.setTimeout(() => setCopied(false), 2200);
  };

  const retryEmail = useCallback(async () => {
    setDeliveryState('sending');
    try {
      const response = await fetch('/api/payment/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          receipt_token: receiptToken,
        }),
      });
      const result = await response.json() as { sent?: boolean; reason?: string };
      if (response.ok && result.sent) {
        setDeliveryState('sent');
        return;
      }
      setDeliveryState(result.reason === 'EMAIL_NOT_CONFIGURED' ? 'config' : 'failed');
    } catch {
      setDeliveryState('failed');
    }
  }, [cardId, receiptToken]);

  useEffect(() => {
    if (emailSent || retryStarted.current) return;
    retryStarted.current = true;
    void retryEmail();
  }, [emailSent, retryEmail]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative z-10 mx-auto w-full max-w-3xl rounded-[2.5rem] border border-pink-200/80 bg-white/90 p-6 text-center shadow-2xl shadow-pink-200/50 backdrop-blur sm:p-10"
    >
      <div className="text-6xl">🎉</div>
      <h1 className="mt-4 font-serif text-4xl font-black text-[#3d1a2e] sm:text-5xl">Your VibeCheck is ready.</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[#7b3f6e]">
        Send this one-person link to {recipientName}. This receipt page survives refreshes and remains available for the card&apos;s duration.
      </p>

      <div className="mt-7 rounded-2xl border border-pink-200 bg-[#fff7fb] p-5 text-left">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-500">Recipient link</p>
        <p className="mt-2 break-all font-mono text-sm font-bold text-[#bd176f]">{cardUrl}</p>
      </div>

      <div className="mt-5 grid gap-3 text-left sm:grid-cols-3">
        <div className="rounded-2xl border border-pink-100 bg-white p-4">
          <p className="text-xs text-[#987084]">Confirmation</p>
          <p className="mt-1 text-sm font-black text-[#3d1a2e]">
            {deliveryState === 'sent'
              ? `Sent to ${maskedEmail}`
              : deliveryState === 'sending'
                ? `Sending to ${maskedEmail}…`
                : deliveryState === 'config'
                  ? 'Gmail setup required'
                  : deliveryState === 'failed'
                    ? 'Gmail rejected delivery'
                    : `Delivery pending to ${maskedEmail}`}
          </p>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-white p-4">
          <p className="text-xs text-[#987084]">Payment</p>
          <p className="mt-1 truncate font-mono text-xs font-black text-[#3d1a2e]" title={paymentId}>{paymentId || 'Confirmed'}</p>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-white p-4">
          <p className="text-xs text-[#987084]">Access until</p>
          <p className="mt-1 text-sm font-black text-[#3d1a2e]">{expiry}</p>
        </div>
      </div>

      {deliveryState !== 'sent' && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left text-sm leading-6 text-rose-950">
          <strong>
            {deliveryState === 'config' ? 'Email is not configured on Render.' : 'The receipt link is safe, but email still needs attention.'}
          </strong>{' '}
          {deliveryState === 'config'
            ? 'Add GMAIL_USER and GMAIL_APP_PASSWORD, then retry.'
            : 'Check the Gmail App Password and Render logs, then retry below.'}
          <button
            type="button"
            onClick={() => void retryEmail()}
            disabled={deliveryState === 'sending'}
            className="mt-3 block rounded-xl bg-[#3d1a2e] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
          >
            {deliveryState === 'sending' ? 'Sending email…' : 'Retry confirmation email'}
          </button>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-sm leading-6 text-amber-950">
        <strong>How one-person access works:</strong> ask {recipientName} to open the link in their preferred browser and press “Unseal on this device.” That deliberate action binds the card to that browser. Link-preview bots cannot consume it, and forwarding it afterward will not open it elsewhere.
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-5 py-4 font-black text-white shadow-lg shadow-pink-200"
        >
          {copied ? 'Copied ✓' : 'Copy recipient link'}
        </button>
        <a
          href={whatsappLink(cardUrl, creatorName, recipientName)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 py-4 font-black text-white shadow-lg shadow-emerald-100"
        >
          Share on WhatsApp
        </a>
      </div>
      <Link href="/customize?new=1" className="mt-7 inline-block text-xs font-black text-pink-600 underline underline-offset-4">
        Make another VibeCheck
      </Link>
    </motion.section>
  );
}
