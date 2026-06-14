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
  unlock_code?: string;
  unlock_question?: string;
  cover_image_url?: string;
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
  created_at: string;
  expires_at?: string | null;
  is_paid: boolean;
  payment_id?: string | null;
  music_track_id?: string | null;
}

export interface ChatMessage {
  id: string;
  card_id: string;
  sender: 'creator' | 'recipient';
  text: string;
  created_at: string;
}

// ── In-memory mock store (used when Supabase is not configured) ──
const globalStore = globalThis as unknown as { 
  __MOCK_STORE: Record<string, Card>;
  __MOCK_CHATS: ChatMessage[];
};
const MOCK_STORE: Record<string, Card> = globalStore.__MOCK_STORE || (globalStore.__MOCK_STORE = {});
const MOCK_CHATS: ChatMessage[] = globalStore.__MOCK_CHATS || (globalStore.__MOCK_CHATS = []);

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

export async function getMessages(cardId: string): Promise<ChatMessage[]> {
  if (isMock) {
    return MOCK_CHATS.filter(m => m.card_id === cardId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });
    
  if (error) return [];
  return data || [];
}

export async function sendMessage(payload: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
  if (isMock) {
    const { v4: uuidv4 } = await import('uuid');
    const msg: ChatMessage = {
      ...payload,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    MOCK_CHATS.push(msg);
    return msg;
  }

  const { data, error } = await supabase.from('messages').insert(payload).select().single();
  if (error) throw error;
  return data;
}
