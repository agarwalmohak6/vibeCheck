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
  const secret = getRazorpayKeySecret();
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function createRazorpayOrder(input: RazorpayCreateOrderInput): Promise<GenericRazorpayOrderResult> {
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
  const client = getRazorpayClient();
  const receipt = `vc_${card.id.replace(/-/g, '').slice(0, 28)}`;
  const order = await client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    method: 'upi',
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
