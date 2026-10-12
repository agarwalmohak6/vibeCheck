import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatMessageDTO } from '@/types/vibecheck';
vi.mock('server-only', () => ({}));
import { readStoredReplies, writeStoredReply } from '@/services/server/reply-store';

function database(missing = true) {
  let card: Record<string, unknown> = { main_body: 'Keep this note', cover_image_urls: ['keep-this-photo'] };
  const messages: ChatMessageDTO[] = [];
  let failures = 0;
  const missingError = { code: 'PGRST205', message: "Could not find the table 'public.messages' in the schema cache" };
  const admin = {
    from(table: string) {
      let selection = '';
      let next: Record<string, unknown> | null = null;
      let revision: unknown;
      let message: ChatMessageDTO | null = null;
      const query = {
        select(value: string) { selection = value; return query; }, order() { return query; },
        eq(field: string, value: unknown) { if (field.includes('reply_version')) revision = Number(value); return query; },
        is() { revision = null; return query; },
        update(value: { card_data: Record<string, unknown> }) { next = value.card_data; return query; },
        upsert(value: ChatMessageDTO) { message = value; return query; },
        async limit() { return { data: missing ? null : messages, error: missing ? missingError : null }; },
        async single() { return { data: selection.startsWith('reply_messages:') ? { reply_messages: structuredClone(card.reply_messages || []) } : { card_data: structuredClone(card) }, error: null }; },
        async maybeSingle() {
          if (table === 'messages') {
            if (missing) return { data: null, error: missingError };
            if (message && !messages.some(row => row.id === message?.id)) messages.push(message);
            return { data: message, error: null };
          }
          if (next && (card.reply_version ?? null) === revision) { card = next; return { data: { id: 'card' }, error: null }; }
          failures++;
          return { data: null, error: null };
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
  return { admin, state: () => card, conflicts: () => failures };
}
const reply = (id: string, sender: 'creator' | 'recipient' = 'recipient'): ChatMessageDTO => ({ id, card_id: 'card', sender, text: `Words from ${sender}`, created_at: `2026-10-12T20:00:0${id}Z` });

describe('persistent chat on older database installations', () => {
  it('reads and writes replies without a messages table while preserving the card', async () => {
    const db = database();
    await writeStoredReply(db.admin, reply('1'));
    expect(await readStoredReplies(db.admin, 'card')).toEqual([reply('1')]);
    expect(db.state()).toMatchObject({ main_body: 'Keep this note', cover_image_urls: ['keep-this-photo'], reply_version: 1 });
  });
  it('does not lose simultaneous creator and recipient messages', async () => {
    const db = database();
    await Promise.all([writeStoredReply(db.admin, reply('1')), writeStoredReply(db.admin, reply('2', 'creator'))]);
    expect(db.conflicts()).toBeGreaterThan(0);
    expect(await readStoredReplies(db.admin, 'card')).toEqual([reply('1'), reply('2', 'creator')]);
  });
  it('does not duplicate a retried message', async () => {
    const db = database();
    await writeStoredReply(db.admin, reply('1'));
    await writeStoredReply(db.admin, reply('1'));
    expect(await readStoredReplies(db.admin, 'card')).toHaveLength(1);
    expect(db.state().reply_version).toBe(1);
  });
  it('continues to use the messages table when it exists', async () => {
    const db = database(false);
    await writeStoredReply(db.admin, reply('1'));
    expect(await readStoredReplies(db.admin, 'card')).toEqual([reply('1')]);
    expect(db.state().reply_version).toBeUndefined();
  });
});
