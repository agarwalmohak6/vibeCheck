import { z } from 'zod';

const trimString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const storyQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  eyebrow: z.string().trim().min(1).max(60),
  question: z.string().trim().min(1).max(160),
  options: z.array(z.string().trim().min(1).max(60)).min(2).max(3),
});

export const cardDataSchema = z.object({
  message_title: trimString(1, 120),
  main_body: trimString(1, 2500),
  media_url: z.string().url().optional().or(z.literal('')),
  compressed_media_url: z.string().url().optional().or(z.literal('')),
  gif_url: z.string().url().optional().or(z.literal('')),
  music_url: z.string().url().optional().or(z.literal('')),
  music_label: z.string().trim().max(160).optional().or(z.literal('')),
  cover_image_url: z.string().max(400_000).optional().or(z.literal('')),
  unlock_code: z.string().trim().min(2).max(80).optional().or(z.literal('')),
  unlock_question: z.string().trim().max(160).optional().or(z.literal('')),
  yes_btn_text: z.string().trim().min(1).max(36).optional(),
  no_btn_text: z.string().trim().min(1).max(36).optional(),
  story_questions: z.array(storyQuestionSchema).min(3).max(5),
});

export const createCardSchema = z.object({
  recipient_name: trimString(1, 80),
  creator_name: trimString(1, 80),
  template_type: trimString(1, 60),
  theme_selected: trimString(1, 60).default('soft_coquette'),
  tier_selected: trimString(1, 40),
  music_track_id: z.string().trim().max(80).optional().nullable(),
  card_data: cardDataSchema,
}).superRefine((value, ctx) => {
  const hasSong = Boolean(value.music_track_id?.trim() || value.card_data.music_url?.trim());
  if (!hasSong) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['music_track_id'],
      message: 'A song is required before creating a card.',
    });
  }
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
    'story_answered',
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

export const paymentReferenceSchema = z.object({
  card_id: z.string().uuid(),
  utr: z.string()
    .trim()
    .min(6)
    .max(40)
    .regex(/^[A-Za-z0-9\s-]+$/, 'Use only letters, numbers, spaces, or hyphens.'),
});

export const paymentOrderSchema = z.object({
  card_id: z.string().uuid(),
});

export const paymentVerifySchema = z.object({
  card_id: z.string().uuid(),
  razorpay_order_id: z.string().trim().min(1).max(120),
  razorpay_payment_id: z.string().trim().min(1).max(120),
  razorpay_signature: z.string().trim().min(1).max(240),
});

export const razorpayCreateOrderSchema = z.object({
  amount: z.coerce.number().int().min(100),
  currency: z.string().trim().min(3).max(3).default('INR'),
  receipt: z.string().trim().min(1).max(40).optional(),
});

export const razorpayVerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(120),
  razorpay_payment_id: z.string().trim().min(1).max(120),
  razorpay_signature: z.string().trim().min(1).max(240),
  card_id: z.string().uuid().optional(),
});

export const manualPaymentVerifySchema = z.object({
  utr: z.string()
    .trim()
    .min(6)
    .max(40)
    .regex(/^[A-Za-z0-9\s-]+$/, 'Use only letters, numbers, spaces, or hyphens.'),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(160),
  secret: z.string().trim().min(12).max(240),
});

export const signedUploadSchema = z.object({
  card_id: z.string().uuid(),
  file_name: z.string().trim().min(1).max(160),
  content_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  byte_size: z.number().int().positive().max(8 * 1024 * 1024),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type PaymentReferenceInput = z.infer<typeof paymentReferenceSchema>;
export type PaymentOrderInput = z.infer<typeof paymentOrderSchema>;
export type PaymentVerifyInput = z.infer<typeof paymentVerifySchema>;
export type RazorpayCreateOrderInput = z.infer<typeof razorpayCreateOrderSchema>;
export type RazorpayVerifyPaymentInput = z.infer<typeof razorpayVerifyPaymentSchema>;
export type ManualPaymentVerifyInput = z.infer<typeof manualPaymentVerifySchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
