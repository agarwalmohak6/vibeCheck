// lib/supabase.ts
// Mock Supabase client — swap NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// in .env.local to connect to real Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────
export interface CardData {
  message_title: string;
  main_body: string;
  media_url?: string;
  compressed_media_url?: string;
  gif_url?: string;
  music_url?: string;
  music_label?: string;
  unlock_code?: string;
  unlock_question?: string;
  cover_image_url?: string;
  yes_btn_text?: string;
  no_btn_text?: string;
  has_secret_code?: boolean;
  story_questions?: Array<{
    id: string;
    eyebrow: string;
    question: string;
    options: string[];
  }>;
}

export interface Card {
  id: string;
  creator_id?: string;
  recipient_name: string;
  creator_name: string;
  template_type: string;
  theme_selected: string;
  card_data: CardData;
  tier_selected: string;
  customer_email?: string;
  confirmation_email_sent_at?: string | null;
  recipient_claim_hash?: string | null;
  recipient_claimed_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  is_paid: boolean;
  payment_id?: string | null;
  music_track_id?: string | null;
}

// ── In-memory mock store (used when Supabase is not configured) ──
const globalStore = globalThis as unknown as { 
  __MOCK_STORE: Record<string, Card>;
};
const MOCK_STORE: Record<string, Card> = globalStore.__MOCK_STORE || (globalStore.__MOCK_STORE = {});

const isMock = supabaseUrl === 'https://mock.supabase.co';

export async function createCard(payload: Omit<Card, 'id' | 'created_at' | 'is_paid' | 'payment_id'>): Promise<Card> {
  if (isMock) {
    const { v4: uuidv4 } = await import('uuid');
    const card: Card = {
      ...payload,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      is_paid: false,
      payment_id: null,
    };
    MOCK_STORE[card.id] = card;
    return card;
  }

  const { data, error } = await supabase.from('cards').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function getCard(id: string): Promise<Card | null> {
  if (isMock) {
    return MOCK_STORE[id] || null;
  }

  const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function markCardPaid(id: string, paymentId: string): Promise<void> {
  if (isMock) {
    if (MOCK_STORE[id]) {
      MOCK_STORE[id].is_paid = true;
      MOCK_STORE[id].payment_id = paymentId;
    }
    return;
  }
  await supabase.from('cards').update({ is_paid: true, payment_id: paymentId }).eq('id', id);
}

export async function extendCard(id: string, newExpiresAt: string): Promise<void> {
  if (isMock) {
    if (MOCK_STORE[id]) {
      MOCK_STORE[id].expires_at = newExpiresAt;
      MOCK_STORE[id].is_paid = true;
    }
    return;
  }
  await supabase.from('cards').update({ expires_at: newExpiresAt, is_paid: true }).eq('id', id);
}
