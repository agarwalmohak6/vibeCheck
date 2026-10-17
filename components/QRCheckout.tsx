'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiIntent, DEFAULT_UPI_VPA, isValidUpiVpa } from '@/lib/upi';
import { startPaymentPolling } from '@/lib/paymentPolling';
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

export default function QRCheckout({ cardId, amount, onPaid, vpa, orderId }: QRCheckoutProps) {
  const [referenceSubmitted, setReferenceSubmitted] = useState(false);
  const [notice, setNotice] = useState('');
  const configuredVpa = (vpa || process.env.NEXT_PUBLIC_UPI_VPA || DEFAULT_UPI_VPA).trim();
  const valid = isValidUpiVpa(configuredVpa) && Number.isFinite(amount) && amount >= 0.01;
  const upiIntent = valid ? buildUpiIntent(configuredVpa, 'VibeCheck',
    (orderId || cardId).replace(/[^A-Za-z0-9]/g, '').slice(0, 32), amount,
    `VibeCheck ${orderId || cardId.slice(0, 8)}`) : '';

  useEffect(() => {
    const polling = startPaymentPolling(cardId, status => {
      if (status.is_paid === true) onPaid();
      else if (status.payment_reference_submitted) setReferenceSubmitted(true);
    });
    const resume = () => { if (document.visibilityState === 'visible') void polling.refresh(); };
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      polling.stop(); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume);
    };
  }, [cardId, onPaid]);

  const copyVpa = async () => {
    try { await navigator.clipboard.writeText(configuredVpa); setNotice('UPI ID copied. Paste it in Paytm or your UPI app.'); }
    catch { setNotice('Copy is unavailable. Select and copy the UPI ID shown below.'); }
  };

  return <section className="vc-upi-checkout" aria-labelledby="upi-heading">
    <header><span>Secure UPI payment</span><h2 id="upi-heading">One little payment. One big moment.</h2><p>Order {orderId || cardId.slice(0, 8).toUpperCase()}</p></header>
    {!valid ? <p role="alert">Payment configuration is unavailable. Please contact support before paying.</p> : <>
      <div className="vc-upi-checkout__payment">
        <div className="vc-upi-checkout__qr"><QRCodeSVG value={upiIntent} size={196} level="M" fgColor="#222222" bgColor="#ffffff" title="Scan to pay with UPI" /></div>
        <div className="vc-upi-checkout__details">
          <span>Amount to pay</span><strong className="vc-upi-checkout__amount">₹{amount.toFixed(2)}</strong>
          <p>Receiving UPI ID</p><code>{configuredVpa}</code>
          <a className="vc-upi-checkout__pay" href={upiIntent}>Open UPI app</a>
          <button type="button" onClick={() => void copyVpa()}>Copy UPI ID</button>
        </div>
      </div>
      <p role="status" className="vc-upi-checkout__notice">{notice}</p>
      <div className="vc-upi-checkout__fallback">
        <strong>Paytm did not open the payment?</strong>
        <p>In Paytm, choose To UPI ID, paste the ID above, and enter ₹{amount.toFixed(2)}. Or scan this QR from another screen. Check the bank-verified recipient name before paying.</p>
        <p>If the app says the UPI ID is invalid or the transfer is blocked, stop and contact support. Do not pay twice.</p>
      </div>
      <PaymentReferenceForm cardId={cardId} variant="soft" onSubmitted={() => setReferenceSubmitted(true)} />
      <p className="vc-upi-checkout__verification" role="status">{referenceSubmitted ? 'Reference received. Waiting for payment verification.' : 'After payment, submit the UTR from your UPI app. Your card opens after verification.'}</p>
    </>}
  </section>;
}
