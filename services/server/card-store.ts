import 'server-only';
import { randomUUID } from 'crypto';
import type { CreateCardInput } from '@/lib/contracts';
import { computeExpiresAt } from '@/lib/utils';
import type { Card } from '@/lib/supabase';
import type { CardEventType, ChatMessageDTO, PublicCard, TrackerEvent } from '@/types/vibecheck';
import { readStoredReplies, writeStoredReply } from './reply-store';
import { captureServerEvent } from './analytics';
import { createAccessToken, hashPasscode, verifyAccessToken, verifyPasscodeHash } from './security';
import { disableSupabaseForRuntime, getSupabaseAdmin, isSupabaseConnectivityError } from './supabase-admin';

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

export type ManualPaymentSubmission = {
  id: string;
  card_id: string;
  payment_reference: string;
  status: string;
  created_at: string;
  verified_at: string | null;
  raw_payload: Record<string, unknown> | null;
  card: {
    recipient_name: string;
    creator_name: string;
    template_type: string;
    tier_selected: string;
    is_paid: boolean;
    expires_at?: string | null;
  } | null;
};

export type CreatorCardSummary = {
  id: string;
  recipient_name: string;
  creator_name: string;
  template_type: string;
  tier_selected: string;
  is_paid: boolean;
  payment_status: string;
  payment_id: string | null;
  payment_reference: string | null;
  expires_at?: string | null;
  created_at: string;
  creator_token: string;
};

export type AdminCardSummary = CreatorCardSummary & {
  account_id: string | null;
};

function createOrderId(cardId: string) {
  const timePart = Date.now().toString(36).toUpperCase();
  const idPart = cardId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `VC-${timePart}-${idPart}`;
}

function sanitizeCardData(input: CreateCardInput['card_data'], hasSecretCode: boolean, orderId: string) {
  const { unlock_question, cover_image_url, ...rest } = input;
  delete rest.unlock_code;

  return {
    ...rest,
    cover_image_url,
    creator_email: input.creator_email?.trim().toLowerCase() || '',
    creator_whatsapp: input.creator_whatsapp?.trim() || '',
    order_id: input.order_id?.trim() || orderId,
    unlock_question: hasSecretCode ? unlock_question || '' : '',
    has_secret_code: hasSecretCode,
  };
}

function toPublicCard(row: Card): PublicCard {
  const hasSecretCode = Boolean(row.card_data.has_secret_code || MOCK_SECRETS[row.id]);
  const safeData = { ...row.card_data };
  delete safeData.unlock_code;
  delete safeData.reply_messages;
  delete safeData.reply_version;

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

async function createMockCardDraft(
  input: CreateCardInput,
  accountId: string | null | undefined,
  id: string,
  orderId: string,
  hasSecretCode: boolean,
  cardData: ReturnType<typeof sanitizeCardData>,
  expiresAt: string | null,
  creatorToken: string,
  fallbackReason?: string,
) {
  const card: Card = {
    id,
    recipient_name: input.recipient_name,
    creator_name: input.creator_name,
    template_type: input.template_type,
    theme_selected: input.theme_selected,
    card_data: cardData,
    tier_selected: input.tier_selected,
    account_id: accountId || null,
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
    order_id: cardData.order_id,
    mock: true,
    fallback_reason: fallbackReason,
  });

  return { card: toPublicCard(card), creatorToken };
}

export async function createCardDraft(input: CreateCardInput, accountId?: string | null) {
  const admin = getSupabaseAdmin();
  const id = randomUUID();
  const orderId = createOrderId(id);
  const hasSecretCode = Boolean(input.card_data.unlock_code?.trim());
  const cardData = sanitizeCardData(input.card_data, hasSecretCode, orderId);
  const expiresAt = computeExpiresAt(input.tier_selected);
  const creatorToken = createAccessToken(id, 'creator');

  if (!admin) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Persistent Supabase storage is required for production card creation.');
    }
    return createMockCardDraft(input, accountId, id, orderId, hasSecretCode, cardData, expiresAt, creatorToken);
  }

  try {
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
        payment_id: null,
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
      order_id: cardData.order_id,
    });

    return { card: toPublicCard(card as Card), creatorToken };
  } catch (error) {
    if (!isSupabaseConnectivityError(error)) throw error;

    disableSupabaseForRuntime(error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Persistent Supabase storage is unavailable; card was not saved.');
    }
    return createMockCardDraft(
      input,
      accountId,
      id,
      orderId,
      hasSecretCode,
      cardData,
      expiresAt,
      creatorToken,
      'supabase_unreachable',
    );
  }
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
      .in('provider', ['upi_manual', 'test_mode'])
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
    order_id: card.card_data.order_id || null,
    expires_at: card.expires_at || null,
  };
}

export async function getCardIdForProviderOrder(providerOrderId: string, provider?: string) {
  const admin = getSupabaseAdmin();
  if (!admin || !providerOrderId) return null;

  let query = admin
    .from('payments')
    .select('card_id')
    .eq('provider_order_id', providerOrderId);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.card_id || null;
}

export async function submitUpiPaymentReference(id: string, reference: string) {
  const card = await getPublicCard(id);
  if (!card) return null;

  const admin = getSupabaseAdmin();
  const paymentReference = normalizePaymentReference(reference);
  const submittedAt = new Date().toISOString();

  if (!admin) {
    if (process.env.NODE_ENV === 'production') throw new Error('Persistent payment storage is required in production.');
    if (Object.entries(MOCK_PAYMENT_REFERENCES).some(([cardId, proof]) => cardId !== id && proof.payment_reference === paymentReference)) {
      throw new Error('PAYMENT_REFERENCE_ALREADY_USED');
    }
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

export async function verifyUpiPaymentReference(reference: string) {
  const admin = getSupabaseAdmin();
  const paymentReference = normalizePaymentReference(reference);
  const verifiedAt = new Date().toISOString();
  const paymentId = `upi_manual_${paymentReference}`;

  if (!admin) {
    if (process.env.NODE_ENV === 'production') throw new Error('Persistent payment storage is required in production.');
    const entry = Object.entries(MOCK_PAYMENT_REFERENCES)
      .find(([, value]) => value.payment_reference === paymentReference);
    if (!entry) return null;

    const [cardId, proof] = entry;
    const card = MOCK_STORE[cardId];
    if (!card) return null;

    proof.status = 'paid';
    card.is_paid = true;
    card.payment_id = paymentId;
    await captureServerEvent('payment_succeeded', cardId, {
      provider: 'upi_manual',
      payment_reference: paymentReference,
      mock: true,
    });
    return {
      card_id: cardId,
      payment_id: paymentId,
      payment_reference: paymentReference,
      status: 'paid',
    };
  }

  const { data: proof, error: lookupError } = await admin
    .from('payments')
    .select('card_id, status, provider_payment_id')
    .eq('provider', 'upi_manual')
    .eq('provider_payment_id', paymentReference)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!proof?.card_id) return null;

  const { error: cardError } = await admin
    .from('cards')
    .update({
      is_paid: true,
      payment_id: paymentId,
      payment_status: 'paid',
    })
    .eq('id', proof.card_id);
  if (cardError) throw cardError;

  const { error: proofError } = await admin
    .from('payments')
    .update({
      status: 'paid',
      verified_at: verifiedAt,
    })
    .eq('provider', 'upi_manual')
    .eq('provider_payment_id', paymentReference);
  if (proofError) throw proofError;

  await captureServerEvent('payment_succeeded', proof.card_id, {
    provider: 'upi_manual',
    payment_reference: paymentReference,
  });

  return {
    card_id: proof.card_id,
    payment_id: paymentId,
    payment_reference: paymentReference,
    status: 'paid',
  };
}

export async function markCardPaymentTestMode(id: string, reason?: string) {
  const card = await getPublicCard(id);
  if (!card) return null;

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const paymentId = `test_mode_${id.replace(/-/g, '').slice(0, 18)}_${Date.now()}`;
  const payload = {
    source: 'test_mode_toggle',
    test_mode: true,
    skipped_payment: true,
    reason: reason || 'creator_checkout_toggle',
    card_id: id,
    created_at: now,
  };

  if (!admin) {
    const mockCard = MOCK_STORE[id];
    if (!mockCard) return null;
    mockCard.is_paid = true;
    mockCard.payment_id = paymentId;
    MOCK_PAYMENT_REFERENCES[id] = {
      payment_reference: paymentId,
      status: 'paid',
      submitted_at: now,
    };
    await captureServerEvent('payment_succeeded', id, {
      provider: 'test_mode',
      payment_id: paymentId,
      test_mode: true,
      skipped_payment: true,
      mock: true,
    });
    return {
      card_id: id,
      payment_id: paymentId,
      payment_reference: paymentId,
      status: 'paid',
      test_mode: true,
    };
  }

  const { error: cardError } = await admin
    .from('cards')
    .update({
      is_paid: true,
      payment_id: paymentId,
      payment_status: 'paid',
    })
    .eq('id', id);
  if (cardError) throw cardError;

  const { error: paymentError } = await admin.from('payments').insert({
    card_id: id,
    provider: 'test_mode',
    provider_payment_id: paymentId,
    status: 'paid',
    verified_at: now,
    raw_payload: payload,
  });
  if (paymentError) throw paymentError;

  await captureServerEvent('payment_succeeded', id, {
    provider: 'test_mode',
    payment_id: paymentId,
    test_mode: true,
    skipped_payment: true,
  });

  return {
    card_id: id,
    payment_id: paymentId,
    payment_reference: paymentId,
    status: 'paid',
    test_mode: true,
  };
}

export async function listManualPaymentReferences(limit = 75): Promise<ManualPaymentSubmission[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), 150);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return Object.entries(MOCK_PAYMENT_REFERENCES)
      .map(([cardId, proof]) => {
        const card = MOCK_STORE[cardId];
        return {
          id: `mock-${cardId}`,
          card_id: cardId,
          payment_reference: proof.payment_reference,
          status: proof.status,
          created_at: proof.submitted_at,
          verified_at: proof.status === 'paid' ? proof.submitted_at : null,
          raw_payload: { mock: true },
          card: card
            ? {
                recipient_name: card.recipient_name,
                creator_name: card.creator_name,
                template_type: card.template_type,
                tier_selected: card.tier_selected,
                is_paid: card.is_paid,
                expires_at: card.expires_at || null,
              }
            : null,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, cappedLimit);
  }

  const { data: payments, error } = await admin
    .from('payments')
    .select('id, card_id, provider_payment_id, status, created_at, verified_at, raw_payload')
    .in('provider', ['upi_manual', 'test_mode'])
    .order('created_at', { ascending: false })
    .limit(cappedLimit);

  if (error) throw error;

  const rows = (payments || []) as Array<{
    id: string;
    card_id: string;
    provider_payment_id: string | null;
    status: string;
    created_at: string;
    verified_at: string | null;
    raw_payload: Record<string, unknown> | null;
  }>;
  const cardIds = Array.from(new Set(rows.map((row) => row.card_id).filter(Boolean)));

  const cardsById = new Map<string, ManualPaymentSubmission['card']>();
  if (cardIds.length > 0) {
    const { data: cards, error: cardsError } = await admin
      .from('cards')
      .select('id, recipient_name, creator_name, template_type, tier_selected, is_paid, expires_at')
      .in('id', cardIds);

    if (cardsError) throw cardsError;

    for (const card of cards || []) {
      const typedCard = card as {
        id: string;
        recipient_name: string;
        creator_name: string;
        template_type: string;
        tier_selected: string;
        is_paid: boolean;
        expires_at?: string | null;
      };
      cardsById.set(typedCard.id, {
        recipient_name: typedCard.recipient_name,
        creator_name: typedCard.creator_name,
        template_type: typedCard.template_type,
        tier_selected: typedCard.tier_selected,
        is_paid: typedCard.is_paid,
        expires_at: typedCard.expires_at || null,
      });
    }
  }

  return rows.map((row) => ({
    id: row.id,
    card_id: row.card_id,
    payment_reference: row.provider_payment_id || '',
    status: row.status,
    created_at: row.created_at,
    verified_at: row.verified_at,
    raw_payload: row.raw_payload,
    card: cardsById.get(row.card_id) || null,
  }));
}

export async function listCreatorCards(accountId: string): Promise<CreatorCardSummary[]> {
  const admin = getSupabaseAdmin();

  if (!admin) {
    return Object.values(MOCK_STORE)
      .filter((card) => card.account_id === accountId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((card) => ({
        id: card.id,
        recipient_name: card.recipient_name,
        creator_name: card.creator_name,
        template_type: card.template_type,
        tier_selected: card.tier_selected,
        is_paid: card.is_paid,
        payment_status: card.is_paid ? 'paid' : 'pending',
        payment_id: card.payment_id || null,
        payment_reference: MOCK_PAYMENT_REFERENCES[card.id]?.payment_reference || null,
        expires_at: card.expires_at || null,
        created_at: card.created_at,
        creator_token: createAccessToken(card.id, 'creator'),
      }));
  }

  // Creator account ownership was retired in the latest production schema.
  // Keep the endpoint non-fatal for older UI sessions without querying a dropped column.
  void admin;
  void accountId;
  return [];
}

export async function listAdminCards(limit = 200): Promise<AdminCardSummary[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), 500);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return Object.values(MOCK_STORE)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, cappedLimit)
      .map((card) => ({
        id: card.id,
        recipient_name: card.recipient_name,
        creator_name: card.creator_name,
        template_type: card.template_type,
        tier_selected: card.tier_selected,
        is_paid: card.is_paid,
        payment_status: card.is_paid ? 'paid' : 'pending',
        payment_id: card.payment_id || null,
        payment_reference: MOCK_PAYMENT_REFERENCES[card.id]?.payment_reference || null,
        expires_at: card.expires_at || null,
        created_at: card.created_at,
        creator_token: createAccessToken(card.id, 'creator'),
        account_id: card.account_id || null,
      }));
  }

  const { data: cards, error } = await admin
    .from('cards')
    .select('id, recipient_name, creator_name, template_type, tier_selected, is_paid, payment_status, payment_id, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(cappedLimit);

  if (error) throw error;

  const typedCards = (cards || []) as Array<{
    id: string;
    recipient_name: string;
    creator_name: string;
    template_type: string;
    tier_selected: string;
    is_paid: boolean;
    payment_status: string;
    payment_id: string | null;
    expires_at?: string | null;
    created_at: string;
  }>;
  const cardIds = typedCards.map((card) => card.id);
  const paymentReferencesByCardId = new Map<string, string>();

  if (cardIds.length > 0) {
    const { data: payments, error: paymentsError } = await admin
      .from('payments')
      .select('card_id, provider_payment_id')
      .in('provider', ['upi_manual', 'test_mode'])
      .in('card_id', cardIds)
      .order('created_at', { ascending: false });

    if (paymentsError) throw paymentsError;

    for (const payment of payments || []) {
      const row = payment as { card_id: string; provider_payment_id: string | null };
      if (!paymentReferencesByCardId.has(row.card_id) && row.provider_payment_id) {
        paymentReferencesByCardId.set(row.card_id, row.provider_payment_id);
      }
    }
  }

  return typedCards.map((card) => ({
    ...card,
    account_id: null,
    payment_reference: paymentReferencesByCardId.get(card.id) || null,
    creator_token: createAccessToken(card.id, 'creator'),
  }));
}

export async function claimCreatorCard(cardId: string, creatorToken: string, accountId: string) {
  if (!verifyAccessToken(creatorToken, cardId, 'creator')) return null;

  const admin = getSupabaseAdmin();
  if (!admin) {
    const card = MOCK_STORE[cardId];
    if (!card) return null;
    card.account_id = accountId;
    return card;
  }

  void admin;
  void accountId;
  return getPublicCard(cardId);
}

export async function clearAllCardsAndPayments() {
  const admin = getSupabaseAdmin();

  if (!admin) {
    const cardCount = Object.keys(MOCK_STORE).length;
    const paymentCount = Object.keys(MOCK_PAYMENT_REFERENCES).length;
    for (const key of Object.keys(MOCK_STORE)) delete MOCK_STORE[key];
    for (const key of Object.keys(MOCK_PAYMENT_REFERENCES)) delete MOCK_PAYMENT_REFERENCES[key];
    for (const key of Object.keys(MOCK_SECRETS)) delete MOCK_SECRETS[key];
    MOCK_CHATS.splice(0, MOCK_CHATS.length);
    MOCK_EVENTS.splice(0, MOCK_EVENTS.length);
    return { cards_deleted: cardCount, payments_deleted: paymentCount };
  }

  const zeroUuid = '00000000-0000-0000-0000-000000000000';
  const supabaseAdmin = admin;

  async function deleteTableRows(table: string, idColumn = 'id') {
    const { count, error } = await supabaseAdmin
      .from(table)
      .delete({ count: 'exact' })
      .neq(idColumn, zeroUuid);

    if (error) {
      const code = 'code' in error ? error.code : '';
      if (code === '42P01') return 0;
      throw error;
    }

    return count || 0;
  }

  const paymentsDeleted = await deleteTableRows('payments');
  const secretsDeleted = await deleteTableRows('card_secrets', 'card_id');
  const trackerEventsDeleted = await deleteTableRows('tracker_events');
  const uploadsDeleted = await deleteTableRows('uploads');
  const messagesDeleted = await deleteTableRows('messages');
  const cardsDeleted = await deleteTableRows('cards');

  return {
    cards_deleted: cardsDeleted,
    payments_deleted: paymentsDeleted,
    card_secrets_deleted: secretsDeleted,
    tracker_events_deleted: trackerEventsDeleted,
    uploads_deleted: uploadsDeleted,
    messages_deleted: messagesDeleted,
  };
}

export async function markCardPaymentVerified(
  id: string,
  paymentId: string,
  extendsAt?: string,
  providerOrderId?: string,
  provider: 'cashfree' | 'razorpay' | 'upi' = 'cashfree',
) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const card = MOCK_STORE[id];
    if (!card) return false;
    card.is_paid = true;
    card.payment_id = paymentId;
    if (extendsAt) card.expires_at = extendsAt;
    await captureServerEvent('payment_succeeded', id, { payment_id: paymentId, mock: true, provider });
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
      provider: provider,
      provider_order_id: providerOrderId || null,
      provider_payment_id: paymentId,
      status: 'paid',
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'provider_payment_id' }
  );

  await captureServerEvent('payment_succeeded', id, { payment_id: paymentId, provider });
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

  return readStoredReplies(admin, cardId);
}

export async function sendCardMessage(
  cardId: string,
  sender: 'creator' | 'recipient',
  text: string,
  creatorToken: string | null,
  messageId?: string
) {
  if (sender === 'creator' && !verifyAccessToken(creatorToken, cardId, 'creator')) return null;
  const admin = getSupabaseAdmin();
  const message: ChatMessageDTO = {
    id: messageId || randomUUID(),
    card_id: cardId,
    sender,
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  if (!admin) {
    if (!MOCK_CHATS.some(reply => reply.id === message.id)) MOCK_CHATS.push(message);
  } else {
    return writeStoredReply(admin, message);
  }

  await captureServerEvent('message_sent', cardId, { sender });
  return message;
}
