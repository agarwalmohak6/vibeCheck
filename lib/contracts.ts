import { z } from 'zod';

const trimString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const cardDataSchema = z.object({
  message_title: trimString(1, 120),
  main_body: trimString(1, 2500),
  media_url: z.string().url().optional().or(z.literal('')),
  compressed_media_url: z.string().url().optional().or(z.literal('')),
  gif_url: z.string().url().optional().or(z.literal('')),
  music_url: z.string().url().optional().or(z.literal('')),
  cover_image_url: z.string().max(400_000).optional().or(z.literal('')),
  unlock_code: z.string().trim().min(2).max(80).optional().or(z.literal('')),
  unlock_question: z.string().trim().max(160).optional().or(z.literal('')),
  yes_btn_text: z.string().trim().min(1).max(36).optional(),
  no_btn_text: z.string().trim().min(1).max(36).optional(),
});

export const createCardSchema = z.object({
  recipient_name: trimString(1, 80),
  creator_name: trimString(1, 80),
  template_type: trimString(1, 60),
  theme_selected: trimString(1, 60).default('midnight_romance'),
  tier_selected: trimString(1, 40),
  music_track_id: z.string().trim().max(80).optional().nullable(),
  card_data: cardDataSchema,
});

export const unlockCardSchema = z.object({
  code: z.string().trim().min(1).max(120),
});

export const trackerEventSchema = z.object({
  event_type: z.enum([
    'card_viewed',
    'envelope_opened',
    'passcode_failed',
    'passcode_unlocked',
    'runaway_dodged',
    'cta_accepted',
  ]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const sendMessageSchema = z.object({
  card_id: z.string().uuid(),
  sender: z.enum(['creator', 'recipient']),
  text: z.string().trim().min(1).max(500),
});

export const paymentWebhookSchema = z.object({
  card_id: z.string().uuid(),
  payment_id: z.string().trim().min(1).max(160).optional(),
  status: z.string().trim().max(40).optional(),
  extends_at: z.string().datetime().optional(),
});

export const signedUploadSchema = z.object({
  card_id: z.string().uuid(),
  file_name: z.string().trim().min(1).max(160),
  content_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  byte_size: z.number().int().positive().max(8 * 1024 * 1024),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
