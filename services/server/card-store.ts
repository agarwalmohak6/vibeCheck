import 'server-only';
import { randomUUID } from 'crypto';
import type { CreateCardInput } from '@/lib/contracts';
import { computeExpiresAt } from '@/lib/utils';
import type { Card } from '@/lib/supabase';
import type { CardEventType, ChatMessageDTO, PublicCard, TrackerEvent } from '@/types/vibecheck';
import { captureServerEvent } from './analytics';
import { createAccessToken, hashPasscode, verifyAccessToken, verifyPasscodeHash } from './security';
import { getSupabaseAdmin } from './supabase-admin';

type StoredSecret = {
  salt: string;
  hash: string;
  question?: string;
};

type MockState = {
  __MOCK_STORE?: Record<string, Card>;
  __MOCK_CHATS?: ChatMessageDTO[];
  __MOCK_SECRETS?: Record<string, StoredSecret>;
  __MOCK_EVENTS?: TrackerEvent[];
  __MOCK_PAYMENT_REFERENCES?: Record<string, {
    payment_reference: string;
    status: 'created' | 'paid';
    submitted_at: string;
  }>;
};

const globalStore = globalThis as unknown as MockState;
const MOCK_STORE = globalStore.__MOCK_STORE || (globalStore.__MOCK_STORE = {});
const MOCK_CHATS = globalStore.__MOCK_CHATS || (globalStore.__MOCK_CHATS = []);
const MOCK_SECRETS = globalStore.__MOCK_SECRETS || (globalStore.__MOCK_SECRETS = {});
const MOCK_EVENTS = globalStore.__MOCK_EVENTS || (globalStore.__MOCK_EVENTS = []);
const MOCK_PAYMENT_REFERENCES =
  globalStore.__MOCK_PAYMENT_REFERENCES || (globalStore.__MOCK_PAYMENT_REFERENCES = {});

function sanitizeCardData(input: CreateCardInput['card_data'], hasSecretCode: boolean) {
  const { unlock_question, cover_image_url, ...rest } = input;
  delete rest.unlock_code;

  return {
    ...rest,
    cover_image_url,
    unlock_question: hasSecretCode ? unlock_question || '' : '',
    has_secret_code: hasSecretCode,
  };
}

function toPublicCard(row: Card): PublicCard {
  const hasSecretCode = Boolean(row.card_data.has_secret_code || MOCK_SECRETS[row.id]);
  const safeData = { ...row.card_data };
  delete safeData.unlock_code;

  return {
    ...row,
    card_data: {
      ...safeData,
      has_secret_code: hasSecretCode,
      unlock_question: hasSecretCode ? safeData.unlock_question || '' : '',
    },
  };
}

function normalizePaymentReference(reference: string) {
  return reference.trim().replace(/\s+/g, '').toUpperCase();
}

export async function createCardDraft(input: CreateCardInput) {
  const admin = getSupabaseAdmin();
  const id = randomUUID();
  const hasSecretCode = Boolean(input.card_data.unlock_code?.trim());
  const cardData = sanitizeCardData(input.card_data, hasSecretCode);
  const expiresAt = computeExpiresAt(input.tier_selected);
  const creatorToken = createAccessToken(id, 'creator');

  if (!admin) {
    const card: Card = {
      id,
      recipient_name: input.recipient_name,
      creator_name: input.creator_name,
      template_type: input.template_type,
      theme_selected: input.theme_selected,
      card_data: cardData,
      tier_selected: input.tier_selected,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_paid: false,
      payment_id: null,
      music_track_id: input.music_track_id || null,
    };

    if (hasSecretCode && input.card_data.unlock_code) {
      MOCK_SECRETS[id] = {
        ...hashPasscode(input.card_data.unlock_code),
        question: input.card_data.unlock_question || '',
      };
    }

    MOCK_STORE[id] = card;
    await captureServerEvent('card_draft_created', id, {
      template_type: input.template_type,
      tier_selected: input.tier_selected,
      has_secret_code: hasSecretCode,
      mock: true,
    });

    return { card: toPublicCard(card), creatorToken };
  }

  const { data: card, error } = await admin
    .from('cards')
    .insert({
      id,
      recipient_name: input.recipient_name,
      creator_name: input.creator_name,
      template_type: input.template_type,
      theme_selected: input.theme_selected,
      card_data: cardData,
      tier_selected: input.tier_selected,
      expires_at: expiresAt,
      is_paid: false,
      payment_status: 'pending',
      music_track_id: input.music_track_id || null,
    })
    .select('*')
    .single();

  if (error) throw error;

  if (hasSecretCode && input.card_data.unlock_code) {
    const secret = hashPasscode(input.card_data.unlock_code);
    const { error: secretError } = await admin.from('card_secrets').insert({
      card_id: id,
      passcode_salt: secret.salt,
      passcode_hash: secret.hash,
      unlock_question: input.card_data.unlock_question || null,
    });
    if (secretError) throw secretError;
  }

  await captureServerEvent('card_draft_created', id, {
    template_type: input.template_type,
    tier_selected: input.tier_selected,
    has_secret_code: hasSecretCode,
  });

  return { card: toPublicCard(card as Card), creatorToken };
}

export async function getPublicCard(id: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const card = MOCK_STORE[id];
    return card ? toPublicCard(card) : null;
  }

  const { data, error } = await admin.from('cards').select('*').eq('id', id).single();
  if (error || !data) return null;
  return toPublicCard(data as Card);
}

export async function getPaymentStatus(id: string) {
  const card = await getPublicCard(id);
  if (!card) return null;

  const admin = getSupabaseAdmin();
  let paymentReference: {
    payment_reference: string;
    status: string;
    submitted_at?: string | null;
  } | null = null;

  if (!admin) {
    paymentReference = MOCK_PAYMENT_REFERENCES[id] || null;
  } else {
    const { data, error } = await admin
      .from('payments')
      .select('provider_payment_id, status, created_at')
      .eq('card_id', id)
      .eq('provider', 'upi_manual')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data?.provider_payment_id) {
      paymentReference = {
        payment_reference: data.provider_payment_id,
        status: data.status,
        submitted_at: data.created_at,
      };
    }
  }

  return {
    id: card.id,
    is_paid: card.is_paid,
    payment_id: card.payment_id || null,
    payment_status: card.is_paid ? 'paid' : 'pending',
    payment_reference: paymentReference?.payment_reference || null,
    payment_reference_submitted: Boolean(paymentReference),
    payment_reference_status: paymentReference?.status || null,
    expires_at: card.expires_at || null,
  };
}

export async function submitUpiPaymentReference(id: string, reference: string) {
  const card = await getPublicCard(id);
  if (!card) return null;

  const admin = getSupabaseAdmin();
  const paymentReference = normalizePaymentReference(reference);
  const submittedAt = new Date().toISOString();

  if (!admin) {
    MOCK_PAYMENT_REFERENCES[id] = {
      payment_reference: paymentReference,
      status: 'created',
      submitted_at: submittedAt,
    };
    await captureServerEvent('payment_reference_submitted', id, {
      provider: 'upi_manual',
      payment_reference: paymentReference,
      mock: true,
    });
    return {
      id: card.id,
      is_paid: card.is_paid,
      payment_id: card.payment_id || null,
      payment_reference: paymentReference,
      payment_reference_submitted: true,
      payment_reference_status: 'created',
      expires_at: card.expires_at || null,
    };
  }

  const { data: existing, error: lookupError } = await admin
    .from('payments')
    .select('card_id, status, provider_payment_id, created_at')
    .eq('provider_payment_id', paymentReference)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing && existing.card_id !== id) {
    throw new Error('PAYMENT_REFERENCE_ALREADY_USED');
  }

  if (!existing) {
    const { error } = await admin.from('payments').insert({
      card_id: id,
      provider: 'upi_manual',
      provider_payment_id: paymentReference,
      status: 'created',
      raw_payload: {
        source: 'upi_reference_form',
        card_id: id,
        payment_reference: paymentReference,
        submitted_at: submittedAt,
      },
    });
    if (error) throw error;
  }

  await captureServerEvent('payment_reference_submitted', id, {
    provider: 'upi_manual',
    payment_reference: paymentReference,
  });

  return {
    id: card.id,
    is_paid: card.is_paid,
    payment_id: card.payment_id || null,
    payment_reference: paymentReference,
    payment_reference_submitted: true,
    payment_reference_status: existing?.status || 'created',
    expires_at: card.expires_at || null,
  };
}

export async function markCardPaymentVerified(id: string, paymentId: string, extendsAt?: string, providerOrderId?: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const card = MOCK_STORE[id];
    if (!card) return false;
    card.is_paid = true;
    card.payment_id = paymentId;
    if (extendsAt) card.expires_at = extendsAt;
    await captureServerEvent('payment_succeeded', id, { payment_id: paymentId, mock: true });
    return true;
  }

  const updates: Record<string, string | boolean | null> = {
    is_paid: true,
    payment_id: paymentId,
    payment_status: 'paid',
  };
  if (extendsAt) updates.expires_at = extendsAt;

  const { error } = await admin.from('cards').update(updates).eq('id', id);
  if (error) throw error;

  if (providerOrderId) {
    const { error: orderUpdateError } = await admin
      .from('payments')
      .update({
        provider_payment_id: paymentId,
        status: 'paid',
        verified_at: new Date().toISOString(),
      })
      .eq('provider_order_id', providerOrderId);
    if (orderUpdateError) throw orderUpdateError;
  }

  await admin.from('payments').upsert(
    {
      card_id: id,
      provider: 'razorpay',
      provider_order_id: providerOrderId || null,
      provider_payment_id: paymentId,
      status: 'paid',
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'provider_payment_id' }
  );

  await captureServerEvent('payment_succeeded', id, { payment_id: paymentId });
  return true;
}

export async function verifyCardPasscode(id: string, code: string) {
  const admin = getSupabaseAdmin();
  let secret: StoredSecret | null = null;

  if (!admin) {
    secret = MOCK_SECRETS[id] || null;
  } else {
    const { data, error } = await admin
      .from('card_secrets')
      .select('passcode_salt, passcode_hash, unlock_question')
      .eq('card_id', id)
      .single();
    if (!error && data) {
      secret = {
        salt: data.passcode_salt,
        hash: data.passcode_hash,
        question: data.unlock_question || undefined,
      };
    }
  }

  if (!secret) return { ok: true, unlockToken: createAccessToken(id, 'unlock', 60 * 60 * 6) };

  const ok = verifyPasscodeHash(code, secret.salt, secret.hash);
  await recordTrackerEvent(id, ok ? 'passcode_unlocked' : 'passcode_failed', {});
  return { ok, unlockToken: ok ? createAccessToken(id, 'unlock', 60 * 60 * 6) : null };
}

export async function recordTrackerEvent(
  cardId: string,
  eventType: CardEventType,
  metadata: Record<string, unknown>
) {
  const admin = getSupabaseAdmin();
  const event: TrackerEvent = {
    id: randomUUID(),
    card_id: cardId,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  };

  if (!admin) {
    MOCK_EVENTS.push(event);
  } else {
    const { error } = await admin.from('tracker_events').insert({
      card_id: cardId,
      event_type: eventType,
      metadata,
    });
    if (error) throw error;
  }

  await captureServerEvent(eventType, cardId, metadata);
  return event;
}

export async function getTrackerEvents(cardId: string, creatorToken: string | null) {
  if (!verifyAccessToken(creatorToken, cardId, 'creator')) return null;
  const admin = getSupabaseAdmin();

  if (!admin) {
    return MOCK_EVENTS
      .filter((event) => event.card_id === cardId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const { data, error } = await admin
    .from('tracker_events')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data || []) as TrackerEvent[];
}

export async function getMessagesForCard(cardId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return MOCK_CHATS
      .filter((message) => message.card_id === cardId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const { data, error } = await admin
    .from('messages')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data || []) as ChatMessageDTO[];
}

export async function sendCardMessage(
  cardId: string,
  sender: 'creator' | 'recipient',
  text: string,
  creatorToken: string | null
) {
  if (sender === 'creator' && !verifyAccessToken(creatorToken, cardId, 'creator')) return null;
  const admin = getSupabaseAdmin();
  const message: ChatMessageDTO = {
    id: randomUUID(),
    card_id: cardId,
    sender,
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  if (!admin) {
    MOCK_CHATS.push(message);
  } else {
    const { data, error } = await admin.from('messages').insert({
      card_id: cardId,
      sender,
      text: text.trim(),
    }).select('*').single();
    if (error) throw error;
    return data as ChatMessageDTO;
  }

  await captureServerEvent('message_sent', cardId, { sender });
  return message;
}
