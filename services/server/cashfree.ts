import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { TIERS } from '@/lib/themes';
import { getPublicCard, markCardPaymentVerified } from './card-store';
import { getSupabaseAdmin } from './supabase-admin';

export type CashfreeOrderResult = {
  payment_session_id: string;
  order_id: string;
  cf_order_id?: string;
  amount: number;
  currency: string;
  card_id: string;
  tier_label: string;
  already_paid?: boolean;
};

export function getCashfreeAppId(): string {
  return (
    process.env.CASHFREE_APP_ID ||
    process.env.NEXT_PUBLIC_CASHFREE_APP_ID ||
    ''
  ).trim();
}

export function getCashfreeSecretKey(): string {
  return (process.env.CASHFREE_SECRET_KEY || '').trim();
}

export function getCashfreeEnv(): 'sandbox' | 'production' {
  const env = (
    process.env.CASHFREE_ENV ||
    process.env.NEXT_PUBLIC_CASHFREE_ENV ||
    'sandbox'
  )
    .trim()
    .toLowerCase();
  return env === 'prod' || env === 'production' ? 'production' : 'sandbox';
}

export function getCashfreeBaseUrl(): string {
  return getCashfreeEnv() === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

export function isCashfreeConfigured(): boolean {
  return Boolean(getCashfreeAppId() && getCashfreeSecretKey());
}

function formatCustomerPhone(raw?: string | null): string {
  if (!raw) return '9565814426';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return '9565814426';
}

function formatCustomerEmail(raw?: string | null): string {
  if (raw && raw.includes('@') && raw.includes('.')) return raw.trim();
  return 'agarwalmohak6@gmail.com';
}

export async function createCashfreeOrderForCard(
  cardId: string,
  origin?: string,
): Promise<CashfreeOrderResult | null> {
  const card = await getPublicCard(cardId);
  if (!card) return null;

  if (card.is_paid) {
    return {
      payment_session_id: '',
      order_id: card.payment_id || `order_${card.id}`,
      amount: 0,
      currency: 'INR',
      card_id: card.id,
      tier_label: card.tier_selected || 'keepsake',
      already_paid: true,
    };
  }

  const tier = TIERS.find((t) => t.id === card.tier_selected) || TIERS[0];
  const amountInRupees = tier.price;

  // If Cashfree is not configured in local/test dev mode, return mock order
  if (!isCashfreeConfigured()) {
    const allowMock =
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';
    if (!allowMock) {
      throw new Error('CASHFREE_NOT_CONFIGURED');
    }
    const mockOrderId = `cf_mock_${card.id.replace(/-/g, '').slice(0, 16)}_${Date.now()}`;
    return {
      payment_session_id: `session_mock_${mockOrderId}`,
      order_id: mockOrderId,
      cf_order_id: mockOrderId,
      amount: amountInRupees,
      currency: 'INR',
      card_id: card.id,
      tier_label: tier.label,
    };
  }

  const appId = getCashfreeAppId();
  const secretKey = getCashfreeSecretKey();
  const baseUrl = getCashfreeBaseUrl();

  // Cashfree order_id max 50 chars, only alphanumeric, _ and -
  const orderId = `cf_${card.id.replace(/-/g, '').slice(0, 16)}_${Date.now().toString(36)}`;
  const customerId = `cust_${card.id.replace(/-/g, '').slice(0, 20)}`;
  const customerPhone = formatCustomerPhone(card.card_data.creator_whatsapp);
  const customerEmail = formatCustomerEmail(card.card_data.creator_email);
  const baseDomain = (
    origin ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://vibecheck-gh7u.onrender.com'
  ).replace(/\/+$/, '');

  const payload = {
    order_id: orderId,
    order_amount: amountInRupees,
    order_currency: 'INR',
    customer_details: {
      customer_id: customerId,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_name: card.creator_name || 'VibeCheck Creator',
    },
    order_meta: {
      return_url: `${baseDomain}/card/${card.id}?cf_order_id={order_id}`,
    },
    order_note: `VibeCheck ${tier.label} - ${card.recipient_name}`,
  };

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.payment_session_id) {
    console.error('Cashfree order creation error:', data);
    throw new Error(data.message || 'CASHFREE_ORDER_CREATION_FAILED');
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    const { error: insertError } = await admin
      .from('payments')
      .insert({
        card_id: card.id,
        provider: 'cashfree',
        provider_order_id: orderId,
        amount_in_paise: Math.round(amountInRupees * 100),
        currency: 'INR',
        status: 'created',
        raw_payload: {
          source: 'cashfree_checkout_order',
          order: data,
        },
      });
    if (insertError) {
      console.warn('Failed to insert cashfree payment log:', insertError);
    }
  }

  return {
    payment_session_id: data.payment_session_id,
    order_id: orderId,
    cf_order_id: String(data.cf_order_id || ''),
    amount: amountInRupees,
    currency: 'INR',
    card_id: card.id,
    tier_label: tier.label,
  };
}

export async function verifyCashfreeOrderForCard(
  cardId: string,
  orderId: string,
): Promise<{ ok: boolean; reason?: string; paymentId?: string }> {
  const card = await getPublicCard(cardId);
  if (!card) return { ok: false, reason: 'CARD_NOT_FOUND' };

  if (card.is_paid) {
    return { ok: true, paymentId: card.payment_id || orderId };
  }

  const tier = TIERS.find((t) => t.id === card.tier_selected) || TIERS[0];
  const expectedAmount = tier.price;

  // Check mock orders
  if (orderId.startsWith('cf_mock_')) {
    const ok = await markCardPaymentVerified(cardId, orderId, undefined, orderId);
    return { ok, paymentId: orderId };
  }

  if (!isCashfreeConfigured()) {
    return { ok: false, reason: 'CASHFREE_NOT_CONFIGURED' };
  }

  const appId = getCashfreeAppId();
  const secretKey = getCashfreeSecretKey();
  const baseUrl = getCashfreeBaseUrl();

  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': '2023-08-01',
    },
  });

  const orderData = await response.json();
  if (!response.ok) {
    console.error('Cashfree order fetch failed:', orderData);
    return { ok: false, reason: orderData.message || 'ORDER_FETCH_FAILED' };
  }

  if (orderData.order_status !== 'PAID') {
    return { ok: false, reason: `PAYMENT_STATUS_${orderData.order_status || 'PENDING'}` };
  }

  const paidAmount = Number(orderData.order_amount);
  if (Math.abs(paidAmount - expectedAmount) > 0.5) {
    console.error('Cashfree amount mismatch:', { paidAmount, expectedAmount });
    return { ok: false, reason: 'AMOUNT_MISMATCH' };
  }

  let paymentId = String(orderData.cf_order_id || orderId);
  try {
    const paymentsRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });
    if (paymentsRes.ok) {
      const payments = await paymentsRes.json();
      if (Array.isArray(payments) && payments.length > 0) {
        const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS') || payments[0];
        if (successfulPayment?.cf_payment_id) {
          paymentId = String(successfulPayment.cf_payment_id);
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch Cashfree payments list:', err);
  }

  const ok = await markCardPaymentVerified(cardId, paymentId, undefined, orderId);
  return { ok, reason: ok ? undefined : 'CARD_NOT_FOUND', paymentId };
}

export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  if (!signature || !timestamp) return false;
  const secretKey = getCashfreeSecretKey();
  if (!secretKey) return false;

  try {
    const payload = `${timestamp}${rawBody}`;
    const expected = createHmac('sha256', secretKey).update(payload).digest('base64');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
