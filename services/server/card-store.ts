import 'server-only';

import { randomUUID } from 'crypto';
import type { CreateCardInput } from '@/lib/contracts';
import type { Card } from '@/lib/supabase';
import { computeExpiresAt, isExpired } from '@/lib/utils';
import type { CardEventType, PublicCard, TrackerEvent } from '@/types/vibecheck';
import { captureServerEvent } from './analytics';
import {
  createAccessToken,
  hashAccessToken,
  hashPasscode,
  verifyAccessToken,
  verifyPasscodeHash,
} from './security';
import { getSupabaseAdmin } from './supabase-admin';

type StoredSecret = { salt: string; hash: string; question?: string };
type PrivateCard = Card & {
  customer_email?: string;
  confirmation_email_sent_at?: string | null;
  recipient_claim_hash?: string | null;
  recipient_claimed_at?: string | null;
};
type MockState = {
  __MOCK_STORE?: Record<string, PrivateCard>;
  __MOCK_SECRETS?: Record<string, StoredSecret>;
  __MOCK_EVENTS?: TrackerEvent[];
};

const globalStore = globalThis as unknown as MockState;
const MOCK_STORE = globalStore.__MOCK_STORE || (globalStore.__MOCK_STORE = {});
const MOCK_SECRETS = globalStore.__MOCK_SECRETS || (globalStore.__MOCK_SECRETS = {});
const MOCK_EVENTS = globalStore.__MOCK_EVENTS || (globalStore.__MOCK_EVENTS = []);

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

function toPublicCard(row: PrivateCard): PublicCard {
  const {
    customer_email: _customerEmail,
    confirmation_email_sent_at: _emailSentAt,
    recipient_claim_hash: _claimHash,
    recipient_claimed_at: _claimedAt,
    ...safeRow
  } = row;
  void _customerEmail;
  void _emailSentAt;
  void _claimHash;
  void _claimedAt;
  const hasSecretCode = Boolean(row.card_data.has_secret_code || MOCK_SECRETS[row.id]);
  const safeData = { ...row.card_data };
  delete safeData.unlock_code;
  return {
    ...safeRow,
    card_data: {
      ...safeData,
      has_secret_code: hasSecretCode,
      unlock_question: hasSecretCode ? safeData.unlock_question || '' : '',
    },
  };
}

export function accessMaxAgeSeconds(expiresAt?: string | null) {
  if (!expiresAt) return 60 * 60 * 24 * 365 * 10;
  return Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function createReceiptAccess(card: Pick<PrivateCard, 'id' | 'expires_at'>) {
  const token = createAccessToken(card.id, 'receipt', accessMaxAgeSeconds(card.expires_at));
  return { token, url: `/receipt/${card.id}?token=${encodeURIComponent(token)}` };
}

export async function createCardDraft(input: CreateCardInput) {
  const admin = getSupabaseAdmin();
  const id = randomUUID();
  const hasSecretCode = Boolean(input.card_data.unlock_code?.trim());
  const cardData = sanitizeCardData(input.card_data, hasSecretCode);
  const expiresAt = computeExpiresAt(input.tier_selected);

  if (!admin) {
    const card: PrivateCard = {
      id,
      customer_email: input.customer_email.toLowerCase(),
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
      confirmation_email_sent_at: null,
      recipient_claim_hash: null,
      recipient_claimed_at: null,
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
    return { card: toPublicCard(card), receipt: createReceiptAccess(card) };
  }

  const { data, error } = await admin.from('cards').insert({
    id,
    customer_email: input.customer_email.toLowerCase(),
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
  }).select('*').single();
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
  const card = data as PrivateCard;
  return { card: toPublicCard(card), receipt: createReceiptAccess(card) };
}

export async function getPrivateCard(id: string): Promise<PrivateCard | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return MOCK_STORE[id] || null;
  const { data, error } = await admin.from('cards').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as PrivateCard;
}

export async function getPublicCard(id: string) {
  const card = await getPrivateCard(id);
  return card ? toPublicCard(card) : null;
}

export async function getPaymentStatus(id: string) {
  const card = await getPrivateCard(id);
  if (!card) return null;
  return {
    id: card.id,
    is_paid: card.is_paid,
    payment_status: card.is_paid ? 'paid' : 'pending',
    expires_at: card.expires_at || null,
  };
}

export async function markCardPaymentVerified(
  id: string,
  paymentId: string,
  extendsAt?: string,
  providerOrderId?: string,
) {
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
  const updates: Record<string, string | boolean> = {
    is_paid: true,
    payment_id: paymentId,
    payment_status: 'paid',
  };
  if (extendsAt) updates.expires_at = extendsAt;
  const { data, error } = await admin.from('cards').update(updates).eq('id', id).select('id').maybeSingle();
  if (error) throw error;
  if (!data) return false;

  if (providerOrderId) {
    const { error: orderError } = await admin.from('payments').update({
      provider_payment_id: paymentId,
      status: 'paid',
      verified_at: new Date().toISOString(),
    }).eq('provider_order_id', providerOrderId).eq('card_id', id);
    if (orderError) throw orderError;
  }
  await admin.from('payments').upsert({
    card_id: id,
    provider: 'razorpay',
    provider_order_id: providerOrderId || null,
    provider_payment_id: paymentId,
    status: 'paid',
    verified_at: new Date().toISOString(),
  }, { onConflict: 'provider_payment_id' });
  await captureServerEvent('payment_succeeded', id, { payment_id: paymentId });
  return true;
}

export async function markConfirmationEmailSent(id: string) {
  const sentAt = new Date().toISOString();
  const admin = getSupabaseAdmin();
  if (!admin) {
    if (MOCK_STORE[id]) MOCK_STORE[id].confirmation_email_sent_at = sentAt;
    return;
  }
  await admin.from('cards').update({ confirmation_email_sent_at: sentAt }).eq('id', id);
}

export type RecipientAccessState = 'available' | 'granted' | 'claimed' | 'expired' | 'unpaid' | 'missing';

export async function getRecipientAccessState(id: string, token?: string | null): Promise<RecipientAccessState> {
  const card = await getPrivateCard(id);
  if (!card) return 'missing';
  if (!card.is_paid) return 'unpaid';
  if (isExpired(card.expires_at)) return 'expired';
  if (!card.recipient_claim_hash) return 'available';
  if (
    token &&
    verifyAccessToken(token, id, 'recipient') &&
    hashAccessToken(token) === card.recipient_claim_hash
  ) return 'granted';
  return 'claimed';
}

export async function claimRecipientAccess(id: string) {
  const card = await getPrivateCard(id);
  if (!card || !card.is_paid || isExpired(card.expires_at)) return null;
  const token = createAccessToken(id, 'recipient', accessMaxAgeSeconds(card.expires_at));
  const claimHash = hashAccessToken(token);
  const claimedAt = new Date().toISOString();
  const admin = getSupabaseAdmin();

  if (!admin) {
    if (card.recipient_claim_hash) return null;
    card.recipient_claim_hash = claimHash;
    card.recipient_claimed_at = claimedAt;
  } else {
    const { data, error } = await admin.from('cards').update({
      recipient_claim_hash: claimHash,
      recipient_claimed_at: claimedAt,
    }).eq('id', id).is('recipient_claim_hash', null).select('id').maybeSingle();
    if (error || !data) return null;
  }
  await recordTrackerEvent(id, 'card_viewed', { access: 'first_device_claim' });
  return { token, maxAge: accessMaxAgeSeconds(card.expires_at) };
}

export async function verifyCardPasscode(id: string, code: string) {
  const admin = getSupabaseAdmin();
  let secret: StoredSecret | null = null;
  if (!admin) {
    secret = MOCK_SECRETS[id] || null;
  } else {
    const { data } = await admin.from('card_secrets')
      .select('passcode_salt, passcode_hash, unlock_question').eq('card_id', id).maybeSingle();
    if (data) {
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
  metadata: Record<string, unknown>,
) {
  const event: TrackerEvent = {
    id: randomUUID(),
    card_id: cardId,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  };
  const admin = getSupabaseAdmin();
  if (!admin) MOCK_EVENTS.push(event);
  else {
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
