import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { TIERS } from '@/lib/themes';
import type { PaymentVerifyInput, RazorpayVerifyPaymentInput } from '@/lib/contracts';
import { getPublicCard, markCardPaymentVerified } from './card-store';
import { isMockPaymentsEnabled } from './config';
import { getSupabaseAdmin } from './supabase-admin';

type RazorpayOrderResult = {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  card_id: string;
  tier_label: string;
};

function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || '';
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
  if (
    isMockPaymentsEnabled() &&
    orderId.startsWith('order_mock_') &&
    signature === 'mock_signature'
  ) {
    return true;
  }

  const secret = getRazorpayKeySecret();
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
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

  const isValidPayment = await validateCapturedRazorpayPayment(
    input.card_id,
    input.razorpay_order_id,
    input.razorpay_payment_id,
  );
  if (!isValidPayment) {
    return { ok: false, reason: 'PAYMENT_MISMATCH' };
  }

  const ok = await markCardPaymentVerified(
    input.card_id,
    input.razorpay_payment_id,
    undefined,
    input.razorpay_order_id,
  );

  return { ok, reason: ok ? null : 'CARD_NOT_FOUND' };
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

  const isValidPayment = await validateCapturedRazorpayPayment(
    input.card_id,
    input.razorpay_order_id,
    input.razorpay_payment_id,
  );
  if (!isValidPayment) {
    return { ok: false, reason: 'PAYMENT_MISMATCH' };
  }

  const ok = await markCardPaymentVerified(
    input.card_id,
    input.razorpay_payment_id,
    undefined,
    input.razorpay_order_id,
  );

  return { ok, reason: ok ? null : 'CARD_NOT_FOUND' };
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
}

export async function validateCapturedRazorpayPayment(
  cardId: string,
  orderId: string,
  paymentId: string,
) {
  if (
    isMockPaymentsEnabled() &&
    orderId.startsWith('order_mock_') &&
    paymentId.startsWith('pay_sim_')
  ) {
    return true;
  }

  if (!isRazorpayConfigured()) return false;

  const card = await getPublicCard(cardId);
  if (!card) return false;

  const tier = TIERS.find((item) => item.id === card.tier_selected);
  if (!tier) return false;

  const expectedAmount = tier.price * 100;
  const client = getRazorpayClient();
  const [orderResult, paymentResult] = await Promise.all([
    client.orders.fetch(orderId),
    client.payments.fetch(paymentId),
  ]);
  const order = getRecord(orderResult);
  const payment = getRecord(paymentResult);
  const notes = getRecord(order.notes);

  return (
    String(order.id || '') === orderId &&
    String(notes.card_id || '') === cardId &&
    Number(order.amount) === expectedAmount &&
    String(order.currency || '').toUpperCase() === 'INR' &&
    String(payment.id || '') === paymentId &&
    String(payment.order_id || '') === orderId &&
    Number(payment.amount) === expectedAmount &&
    String(payment.currency || '').toUpperCase() === 'INR' &&
    String(payment.status || '').toLowerCase() === 'captured'
  );
}
