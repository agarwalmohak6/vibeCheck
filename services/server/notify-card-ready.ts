import 'server-only';

import { getPublicCard } from './card-store';
import { sendCreatorPaymentVerifiedNotifications } from './notifications';
import { createAccessToken } from './security';

export async function notifyCreatorCardReady(cardId: string, requestOrigin: string) {
  try {
    const card = await getPublicCard(cardId);
    if (!card?.is_paid) return null;
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL?.trim() || requestOrigin).replace(/\/+$/, '');
    const recipientUrl = `${baseUrl}/card/${card.id}`;
    return await sendCreatorPaymentVerifiedNotifications({
      creatorEmail: card.card_data.creator_email,
      creatorWhatsapp: card.card_data.creator_whatsapp,
      orderId: card.card_data.order_id || card.id,
      recipientName: card.recipient_name,
      creatorName: card.creator_name,
      recipientUrl,
      trackingUrl: `${recipientUrl}?ct=${encodeURIComponent(createAccessToken(card.id, 'creator'))}`,
      templateType: card.template_type,
      themeId: card.theme_selected,
      testMode: card.payment_id?.startsWith('test_mode_') || false,
    });
  } catch {
    // A notification failure must not turn an already-approved payment into an API error.
    console.error('Creator ready notification failed. Payment state was not changed.');
    return null;
  }
}
