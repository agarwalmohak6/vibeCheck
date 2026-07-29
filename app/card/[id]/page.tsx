import { getPublicCard, getRecipientAccessState } from '@/services/server/card-store';
import { isExpired } from '@/lib/utils';
import RecipientView from '@/components/RecipientView';
import ExpiredView from '@/components/ExpiredView';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import RecipientClaimGate from '@/components/RecipientClaimGate';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getPublicCard(id);
  if (!card) return { title: 'Card not found — VibeCheck', robots: { index: false, follow: false } };
  return {
    title: 'A private VibeCheck is waiting 💌',
    description: 'Open this private, one-person card on the browser you want to use.',
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

export default async function CardPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getPublicCard(id);

  if (!card) return notFound();

  if (isExpired(card.expires_at)) {
    return <ExpiredView card={card} />;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(`vc_recipient_${id}`)?.value;
  const accessState = await getRecipientAccessState(id, token);
  if (accessState !== 'granted') {
    return (
      <RecipientClaimGate
        cardId={id}
        recipientName={card.recipient_name}
        creatorName={card.creator_name}
        expiresAt={card.expires_at}
        state={accessState}
      />
    );
  }

  return <RecipientView card={card} />;
}
