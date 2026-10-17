import { getPublicCard } from '@/services/server/card-store';
import { verifyAccessToken } from '@/services/server/security';
import { verifyCashfreeOrderForCard } from '@/services/server/cashfree';
import { isExpired } from '@/lib/utils';
import RecipientView from '@/components/RecipientView';
import SuccessHub from '@/components/SuccessHub';
import ExpiredView from '@/components/ExpiredView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getPublicCard(id);
  if (!card) return { title: 'Card not found — VibeCheck', robots: { index: false, follow: false } };
  return {
    title: `${card.creator_name} sent you a VibeCheck 💌`,
    description: `Open to see a special message from ${card.creator_name} to ${card.recipient_name} ✨`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  let card = await getPublicCard(id);

  if (!card) return notFound();

  // If returning from Cashfree redirect and payment not yet confirmed
  const cfOrderId = typeof query.cf_order_id === 'string'
    ? query.cf_order_id
    : Array.isArray(query.cf_order_id)
      ? query.cf_order_id[0]
      : undefined;

  if (cfOrderId && !card.is_paid) {
    await verifyCashfreeOrderForCard(id, cfOrderId);
    const refreshed = await getPublicCard(id);
    if (refreshed) {
      card = refreshed;
    }
  }

  if (isExpired(card.expires_at)) {
    return <ExpiredView card={card} />;
  }

  const roomParam = query.room;
  const initialRoomMode = Array.isArray(roomParam)
    ? roomParam.includes('chat')
    : roomParam === 'chat';

  const isCreator = typeof query.ct === 'string' && verifyAccessToken(query.ct, card.id, 'creator');
  if (isCreator && !initialRoomMode) {
    return <main className="vc-creator-tracking" data-theme={card.theme_selected}>
      <SuccessHub cardId={card.id} recipientName={card.recipient_name} creatorName={card.creator_name}
        creatorToken={query.ct as string} orderId={card.card_data.order_id} isPaid={card.is_paid} />
    </main>;
  }
  return <RecipientView card={card} initialRoomMode={initialRoomMode} isCreator={isCreator} />;
}
