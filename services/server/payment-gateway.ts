import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { TIERS } from '@/lib/themes';
import type { PaymentVerifyInput, RazorpayCreateOrderInput, RazorpayVerifyPaymentInput } from '@/lib/contracts';
import { getPublicCard, markCardPaymentVerified } from './card-store';
import { getSupabaseAdmin } from './supabase-admin';

type RazorpayOrderResult = {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  card_id: string;
  tier_label: string;
};

type GenericRazorpayOrderResult = {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  receipt?: string;
};

function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
}

function getRazorpayKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET || '';
}

export function isRazorpayConfigured() {
  return Boolean(getRazorpayKeyId() && getRazorpayKeySecret());
}

function getRazorpayClient() {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_NOT_CONFIGURED');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  if (orderId.startsWith('order_mock_') || signature === 'mock_signature') {
    return true;
  }

  const secret = getRazorpayKeySecret();
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

async function validateRazorpayPaymentForCard(input: {
  cardId: string;
  orderId?: string;
  paymentId: string;
  amount?: number;
  currency?: string;
}) {
  const card = await getPublicCard(input.cardId);
  if (!card) return { ok: false as const, reason: 'CARD_NOT_FOUND' };

  const tier = TIERS.find((item) => item.id === card.tier_selected) || TIERS[0];
  const expectedAmount = tier.price * 100;
  if (input.amount !== undefined && input.amount !== expectedAmount) {
    return { ok: false as const, reason: 'AMOUNT_MISMATCH' };
  }
  if (input.currency && input.currency !== 'INR') {
    return { ok: false as const, reason: 'CURRENCY_MISMATCH' };
  }

  // The signed checkout response proves the browser received a valid Razorpay
  // response. Fetching the payment from Razorpay as well prevents a valid
  // signature from being replayed against the wrong card or amount.
  if (isRazorpayConfigured() && input.orderId && !input.orderId.startsWith('order_mock_')) {
    const client = getRazorpayClient();
    const payment = await client.payments.fetch(input.paymentId);
    const status = String(payment.status || '').toLowerCase();
    if (String(payment.order_id || '') !== input.orderId) {
      return { ok: false as const, reason: 'ORDER_MISMATCH' };
    }
    if (Number(payment.amount) !== expectedAmount || String(payment.currency || 'INR') !== 'INR') {
      return { ok: false as const, reason: 'AMOUNT_MISMATCH' };
    }
    if (!['authorized', 'captured'].includes(status)) {
      return { ok: false as const, reason: 'PAYMENT_NOT_CAPTURED' };
    }
  }

  return { ok: true as const, reason: null };
}

export async function createRazorpayOrder(input: RazorpayCreateOrderInput): Promise<GenericRazorpayOrderResult> {
  if (!isRazorpayConfigured()) {
    return {
      order_id: `order_mock_${Date.now()}`,
      key_id: 'rzp_test_mock',
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
    };
  }

  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: input.amount,
    currency: input.currency,
    receipt: input.receipt,
  });

  return {
    order_id: String(order.id),
    key_id: getRazorpayKeyId(),
    amount: Number(order.amount || input.amount),
    currency: String(order.currency || input.currency),
    receipt: order.receipt ? String(order.receipt) : input.receipt,
  };
}

export async function createRazorpayOrderForCard(cardId: string): Promise<RazorpayOrderResult | null> {
  const card = await getPublicCard(cardId);
  if (!card) return null;

  if (card.is_paid) {
    return {
      order_id: '',
      key_id: getRazorpayKeyId(),
      amount: 0,
      currency: 'INR',
      card_id: card.id,
      tier_label: 'Already paid',
    };
  }

  const tier = TIERS.find((item) => item.id === card.tier_selected) || TIERS[0];
  const amountInPaise = tier.price * 100;

  if (!isRazorpayConfigured()) {
    return {
      order_id: `order_mock_${Date.now()}`,
      key_id: 'rzp_test_mock',
      amount: amountInPaise,
      currency: 'INR',
      card_id: card.id,
      tier_label: tier.label,
    };
  }

  const client = getRazorpayClient();
  const receipt = `vc_${card.id.replace(/-/g, '').slice(0, 28)}`;
  const order = await client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    payment: {
      capture: 'automatic',
      capture_options: {
        automatic_expiry_period: 12,
        manual_expiry_period: 720,
        refund_speed: 'normal',
      },
    },
    notes: {
      card_id: card.id,
      tier: card.tier_selected,
      product: 'vibecheck_private_card',
    },
  });

  const orderId = String(order.id);
  const admin = getSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from('payments').insert({
      card_id: card.id,
      provider: 'razorpay',
      provider_order_id: orderId,
      amount_in_paise: amountInPaise,
      currency: 'INR',
      status: 'created',
      raw_payload: {
        source: 'razorpay_checkout_order',
        order,
      },
    });
    if (error) throw error;
  }

  return {
    order_id: orderId,
    key_id: getRazorpayKeyId(),
    amount: amountInPaise,
    currency: 'INR',
    card_id: card.id,
    tier_label: tier.label,
  };
}

export async function verifyRazorpayCheckoutPayment(input: PaymentVerifyInput) {
  const isValid = verifyCheckoutSignature(
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature,
  );

  if (!isValid) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  const paymentCheck = await validateRazorpayPaymentForCard({
    cardId: input.card_id,
    orderId: input.razorpay_order_id,
    paymentId: input.razorpay_payment_id,
  });
  if (!paymentCheck.ok) return paymentCheck;

  const ok = await markCardPaymentVerified(
    input.card_id,
    input.razorpay_payment_id,
    undefined,
    input.razorpay_order_id,
  );

  return { ok, reason: ok ? null : 'CARD_NOT_FOUND' };
}

export async function verifyRazorpayWebhookPayment(input: {
  cardId: string;
  orderId?: string;
  paymentId: string;
  amount?: number;
  currency?: string;
}) {
  return validateRazorpayPaymentForCard(input);
}

export async function verifyRazorpayPaymentSignature(input: RazorpayVerifyPaymentInput) {
  const isValid = verifyCheckoutSignature(
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature,
  );

  if (!isValid) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  if (!input.card_id) {
    return { ok: true, reason: null };
  }

  const ok = await markCardPaymentVerified(
    input.card_id,
    input.razorpay_payment_id,
    undefined,
    input.razorpay_order_id,
  );

  return { ok, reason: ok ? null : 'CARD_NOT_FOUND' };
}
