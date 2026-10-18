import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import {
  getCashfreeBaseUrl,
  getCashfreeEnv,
  isCashfreeConfigured,
  verifyCashfreeWebhookSignature,
} from '@/services/server/cashfree';
import CashfreeCheckout from '@/components/CashfreeCheckout';
import PaymentCheckout from '@/components/PaymentCheckout';
import { createHmac } from 'crypto';

describe('Cashfree Gateway Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects when Cashfree is configured', () => {
    process.env.CASHFREE_APP_ID = 'test_app_id';
    process.env.CASHFREE_SECRET_KEY = 'test_secret_key';
    expect(isCashfreeConfigured()).toBe(true);
  });

  it('detects when Cashfree is not configured', () => {
    delete process.env.CASHFREE_APP_ID;
    delete process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    delete process.env.CASHFREE_SECRET_KEY;
    expect(isCashfreeConfigured()).toBe(false);
  });

  it('returns sandbox base URL by default', () => {
    process.env.CASHFREE_ENV = 'sandbox';
    expect(getCashfreeEnv()).toBe('sandbox');
    expect(getCashfreeBaseUrl()).toBe('https://sandbox.cashfree.com/pg');
  });

  it('returns production base URL when env is PROD', () => {
    process.env.CASHFREE_ENV = 'production';
    expect(getCashfreeEnv()).toBe('production');
    expect(getCashfreeBaseUrl()).toBe('https://api.cashfree.com/pg');
  });
});

describe('Cashfree Webhook Signature Verification', () => {
  const originalEnv = process.env;
  const secretKey = 'test_secret_key_123';

  beforeEach(() => {
    process.env = { ...originalEnv, CASHFREE_SECRET_KEY: secretKey };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validates a correct webhook signature', () => {
    const rawBody = JSON.stringify({ data: { order: { order_id: 'cf_123', order_status: 'PAID' } } });
    const timestamp = '1729200000';
    const payload = `${timestamp}${rawBody}`;
    const validSignature = createHmac('sha256', secretKey).update(payload).digest('base64');

    expect(verifyCashfreeWebhookSignature(rawBody, validSignature, timestamp)).toBe(true);
  });

  it('rejects an invalid or tampered webhook signature', () => {
    const rawBody = JSON.stringify({ data: { order: { order_id: 'cf_123' } } });
    const timestamp = '1729200000';
    const forgedSignature = 'forged_signature_base64_string==';

    expect(verifyCashfreeWebhookSignature(rawBody, forgedSignature, timestamp)).toBe(false);
  });

  it('rejects when timestamp or signature is missing', () => {
    const rawBody = '{}';
    expect(verifyCashfreeWebhookSignature(rawBody, null, '123')).toBe(false);
    expect(verifyCashfreeWebhookSignature(rawBody, 'sig', null)).toBe(false);
  });
});

describe('CashfreeCheckout component', () => {
  it('hides Cashfree checkout by default, even if credentials are configured', () => {
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', undefined);
    vi.stubEnv('CASHFREE_APP_ID', 'configured-app');
    vi.stubEnv('CASHFREE_SECRET_KEY', 'configured-secret');
    const html = renderToStaticMarkup(
      createElement(PaymentCheckout, {
        cardId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 99,
        vpa: 'merchant@upi',
        onPaid: () => {},
      }),
    );

    expect(html).not.toContain('via Cashfree');
    expect(html).toContain('Scan to pay with UPI');
    expect(html).toContain('UTR / ref no.');
    expect(html).toContain('one business day');
    expect(html).not.toContain('<details');
  });

  it('renders explicitly enabled checkout with accurate payment copy and policy links', () => {
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', 'true');
    const html = renderToStaticMarkup(
      createElement(CashfreeCheckout, {
        cardId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 99,
        orderId: 'VC123456',
        onPaid: () => {},
      }),
    );

    expect(html).toContain('₹99.00');
    expect(html).toContain('Pay ₹99.00 via Cashfree');
    expect(html).toContain('Available payment methods are shown by Cashfree');
    expect(html).toContain('Delivery after payment verification');
    expect(html).not.toMatch(/Instant Automated Payment|Instant delivery|256-bit|GPay|PhonePe|Paytm UPI|>Cards<|NetBanking/);
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refund-policy"');
  });

  it('keeps the direct UPI QR and UTR form visible when Cashfree is enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED', 'true');
    const html = renderToStaticMarkup(
      createElement(PaymentCheckout, {
        cardId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 99,
        vpa: 'merchant@upi',
        onPaid: () => {},
      }),
    );

    expect(html).toContain('Pay ₹99.00 via Cashfree');
    expect(html).toContain('Scan to pay with UPI');
    expect(html).toContain('UTR / ref no.');
    expect(html).not.toContain('<details');
  });
});
