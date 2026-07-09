import { getPublicCard } from '@/services/server/card-store';
import { isExpired } from '@/lib/utils';
import RecipientView from '@/components/RecipientView';
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
  const card = await getPublicCard(id);

  if (!card) return notFound();

  if (isExpired(card.expires_at)) {
    return <ExpiredView card={card} />;
  }

  const roomParam = query.room;
  const initialRoomMode = Array.isArray(roomParam)
    ? roomParam.includes('chat')
    : roomParam === 'chat';

  return <RecipientView card={card} initialRoomMode={initialRoomMode} />;
}
