import { MAX_IMAGE_DATA_URL_LENGTH } from './imageLimits';
import { isOfficialMusicLink } from './musicLinks';
import { z } from 'zod';

const trimString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

function normalizePaymentReferenceInput(value: unknown) {
  const raw = typeof value === 'string' ? value : '';
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(
      /\b(?:UPI|UTR|RRN|REF|REFERENCE|TRANSACTION|TXN|TXNID|TRN|ID|NO|NUMBER)\b\s*[:#-]*/gi,
      ' ',
    )
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ''))
    .filter((token) => token.length >= 6 && token.length <= 40);
  const tokensWithDigits = tokens.filter((token) => /\d/.test(token));
  if (tokensWithDigits.length) return tokensWithDigits[tokensWithDigits.length - 1];

  const compact = cleaned.replace(/[\s-]+/g, '');
  if (compact.length >= 6 && compact.length <= 40) return compact;

  return cleaned.replace(/\s+/g, '');
}

const paymentReferenceValueSchema = z.preprocess(
  normalizePaymentReferenceInput,
  z.string()
    .trim()
    .min(6, 'Enter the 6+ character UPI UTR or transaction reference.')
    .max(40, 'UPI reference should be 40 characters or less.')
    .regex(/^[A-Z0-9-]+$/, 'Use the UPI UTR/reference number only.'),
);

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
  music_link: z.string().max(2048).refine(isOfficialMusicLink, 'Use an official Apple Music link.').optional().or(z.literal('')),
  cover_image_url: z.string().max(MAX_IMAGE_DATA_URL_LENGTH, 'One photo is too large. Please upload it again so we can resize it.').optional().or(z.literal('')),
  cover_image_urls: z.array(z.string().max(MAX_IMAGE_DATA_URL_LENGTH, 'One photo is too large. Please upload it again so we can resize it.')).max(8).optional().default([]),
  creator_email: z.string().trim().email().max(160).optional().or(z.literal('')),
  creator_whatsapp: z.string()
    .trim()
    .min(8)
    .max(24)
    .regex(/^[0-9+\-\s()]+$/, 'Use a valid WhatsApp number.')
    .optional()
    .or(z.literal('')),
  order_id: z.string().trim().max(40).optional().or(z.literal('')),
  unlock_code: z.string().trim().min(1, 'Private lock answer is required when privacy is enabled.').max(80).optional().or(z.literal('')),
  unlock_question: z.string().trim().max(160).optional().or(z.literal('')),
  yes_btn_text: z.string().trim().min(1).max(36).optional(),
  no_btn_text: z.string().trim().min(1).max(36).optional(),
  story_questions: z.array(storyQuestionSchema).max(5).optional().default([]),
});

export const createCardSchema = z.object({
  recipient_name: trimString(1, 80),
  creator_name: trimString(1, 80),
  template_type: trimString(1, 60),
  theme_selected: trimString(1, 60).default('soft_coquette'),
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
    'story_answered',
    'runaway_dodged',
    'cta_accepted',
  ]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const sendMessageSchema = z.object({
  message_id: z.string().uuid().optional(),
  card_id: z.string().uuid(),
  sender: z.enum(['creator', 'recipient']),
  text: z.string().trim().min(1).max(500),
});

export const paymentWebhookSchema = z.object({
  card_id: z.string().uuid(),
  payment_id: z.string().trim().min(1).max(160).optional(),
  order_id: z.string().trim().min(1).max(120).optional(),
  amount: z.coerce.number().int().positive().optional(),
  currency: z.string().trim().length(3).optional(),
  status: z.string().trim().max(40).optional(),
  extends_at: z.string().datetime().optional(),
});

export const paymentReferenceSchema = z.object({
  card_id: z.string().uuid(),
  utr: paymentReferenceValueSchema,
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

export const cashfreeOrderSchema = z.object({
  card_id: z.string().uuid(),
});

export const cashfreeVerifySchema = z.object({
  card_id: z.string().uuid(),
  order_id: z.string().trim().min(1).max(120),
});

export const manualPaymentVerifySchema = z.object({
  utr: paymentReferenceValueSchema,
});

export const testPaymentModeSchema = z.object({
  card_id: z.string().uuid(),
  reason: z.string().trim().max(120).optional().or(z.literal('')),
});

export const adminOtpRequestSchema = z.object({
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
});

export const adminLoginSchema = z.object({
  otp: z.string()
    .trim()
    .length(6)
    .regex(/^\d{6}$/, 'Enter the 6-digit OTP.'),
});

export const creatorAuthSchema = z.object({
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string()
    .trim()
    .max(24)
    .regex(/^[0-9+\-\s()]*$/, 'Use a valid phone number.')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6).max(120),
  name: z.string().trim().max(80).optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  const hasEmail = Boolean(value.email?.trim());
  const hasPhone = Boolean(value.phone?.trim());
  if (!hasEmail && !hasPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'Add an email or mobile number.',
    });
  }
});

export const creatorCardClaimSchema = z.object({
  card_id: z.string().uuid(),
  creator_token: z.string().trim().min(20).max(600),
});

export const adminCleanupSchema = z.object({
  confirm: z.literal('CLEAR_TEST_DATA'),
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
export type TestPaymentModeInput = z.infer<typeof testPaymentModeSchema>;
export type AdminOtpRequestInput = z.infer<typeof adminOtpRequestSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CreatorAuthInput = z.infer<typeof creatorAuthSchema>;
export type CreatorCardClaimInput = z.infer<typeof creatorCardClaimSchema>;
export type CashfreeOrderInput = z.infer<typeof cashfreeOrderSchema>;
export type CashfreeVerifyInput = z.infer<typeof cashfreeVerifySchema>;

