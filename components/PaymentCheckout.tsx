'use client';

import CashfreeCheckout from '@/components/CashfreeCheckout';
import QRCheckout from '@/components/QRCheckout';

interface PaymentCheckoutProps {
  cardId: string;
  amount: number;
  onPaid: () => void;
  vpa: string;
  orderId?: string;
  creatorToken?: string | null;
}

export default function PaymentCheckout({ vpa, ...props }: PaymentCheckoutProps) {
  return (
    <>
      <CashfreeCheckout {...props} />
      <QRCheckout {...props} vpa={vpa} />
    </>
  );
}
