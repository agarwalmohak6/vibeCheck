import { notFound } from 'next/navigation';
import AmbientBackground from '@/components/AmbientBackground';
import SuccessHub from '@/components/SuccessHub';
import { isExpired } from '@/lib/utils';
import { getPrivateCard } from '@/services/server/card-store';
import { verifyAccessToken } from '@/services/server/security';
import { absoluteUrl } from '@/lib/site';

export const metadata = {
  title: 'Your private VibeCheck receipt',
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const token = Array.isArray(query.token) ? query.token[0] : query.token;
  const card = await getPrivateCard(id);
  if (!card || !card.is_paid || !verifyAccessToken(token, id, 'receipt')) return notFound();
  if (isExpired(card.expires_at)) {
    return (
      <main className="min-h-screen bg-[#fff1f6] px-4 py-12 text-[#3d1a2e] flex items-center justify-center">
        <section className="max-w-lg rounded-[2rem] border border-pink-200 bg-white p-9 text-center shadow-xl">
          <div className="text-6xl">🕯️</div>
          <h1 className="mt-4 font-serif text-4xl font-black">This receipt has expired</h1>
          <p className="mt-3 text-sm leading-7 text-[#7b3f6e]">Its private card duration has ended, so the recovery page closed with it.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <AmbientBackground />
      <SuccessHub
        cardId={id}
        receiptToken={token || ''}
        recipientUrl={absoluteUrl(`/card/${id}`)}
        recipientName={card.recipient_name}
        creatorName={card.creator_name}
        customerEmail={card.customer_email || ''}
        paymentId={card.payment_id || ''}
        expiresAt={card.expires_at}
        emailSent={Boolean(card.confirmation_email_sent_at)}
      />
    </main>
  );
}
