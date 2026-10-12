import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatMessageDTO } from '@/types/vibecheck';

type ReplyData = Record<string, unknown> & { reply_messages?: ChatMessageDTO[]; reply_version?: number };

function missingMessageTable(error: { code?: string; message?: string } | null) {
  return !!error && ['PGRST205', '42P01'].includes(error.code || '') && /messages/.test(error.message || '');
}

function ordered(messages: ChatMessageDTO[]) {
  return [...new Map(messages.map(message => [message.id, message])).values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function legacyReplies(admin: SupabaseClient, cardId: string) {
  const { data, error } = await admin.from('cards').select('card_data').eq('id', cardId).single();
  if (error) throw error;
  return (data.card_data || {}) as ReplyData;
}

/** Old installations may have cards but no messages table. Replies must still persist. */
export async function readStoredReplies(admin: SupabaseClient, cardId: string): Promise<ChatMessageDTO[]> {
  const { data, error } = await admin.from('messages').select('*').eq('card_id', cardId)
    .order('created_at', { ascending: false }).limit(200);
  if (error && !missingMessageTable(error)) throw error;
  const legacy = await admin.from('cards').select('reply_messages:card_data->reply_messages').eq('id', cardId).single();
  if (legacy.error) throw legacy.error;
  const compatibilityReplies = Array.isArray(legacy.data.reply_messages) ? legacy.data.reply_messages as unknown as ChatMessageDTO[] : [];
  return ordered([...(error ? [] : data || []), ...compatibilityReplies]).slice(-200);
}

export async function writeStoredReply(admin: SupabaseClient, message: ChatMessageDTO): Promise<ChatMessageDTO> {
  const { data, error } = await admin.from('messages').upsert(message, { onConflict: 'id', ignoreDuplicates: true }).select('*').maybeSingle();
  if (!error) return data || message;
  if (!missingMessageTable(error)) throw error;

  // Compare a small revision field, rather than putting the large photo JSON in a URL.
  // A losing writer reloads and retries, preserving both messages and every card field.
  for (let attempt = 0; attempt < 6; attempt++) {
    const previous = await legacyReplies(admin, message.card_id);
    const replies = previous.reply_messages || [];
    const existing = replies.find(reply => reply.id === message.id);
    if (existing) return existing;
    const next = { ...previous, reply_messages: ordered([...replies, message]).slice(-200), reply_version: (previous.reply_version || 0) + 1 };
    let query = admin.from('cards').update({ card_data: next }).eq('id', message.card_id);
    query = previous.reply_version == null ? query.is('card_data->reply_version', null) : query.eq('card_data->>reply_version', String(previous.reply_version));
    const result = await query.select('id').maybeSingle();
    if (result.error) throw result.error;
    if (result.data) return message;
  }
  throw new Error('Reply room is busy. Please try sending again.');
}
