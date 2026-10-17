import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildUpiIntent } from '@/lib/upi';
import { startPaymentPolling } from '@/lib/paymentPolling';
import QRCheckout from '@/components/QRCheckout';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('UPI checkout', () => {
  it('preserves the receiving ID and encodes spaces compatibly with UPI apps', () => {
    const link = buildUpiIntent(' owner@okaxis ', 'VibeCheck', 'VC123', 199, 'VibeCheck order 123');
    const url = new URL(link);
    expect(url.protocol).toBe('upi:'); expect(url.hostname).toBe('pay');
    expect(url.searchParams.get('pa')).toBe('owner@okaxis');
    expect(url.searchParams.get('am')).toBe('199.00');
    expect(url.searchParams.get('tn')).toBe('VibeCheck order 123');
    expect(url.searchParams.get('tr')).toBe('VC123');
    expect(link).not.toContain('+');
    expect(link).toContain('%20');
    expect(url.searchParams.has('mc')).toBe(false);
  });
  it.each([NaN, Infinity, 0, -1, 0.001])('rejects invalid payment amount %s', amount => {
    expect(() => buildUpiIntent('owner@okaxis', 'VibeCheck', '123', amount)).toThrow();
  });
  it('rejects malformed or injected receiving IDs', () => {
    expect(() => buildUpiIntent('owner@okaxis&pa=someone@bank', 'VibeCheck', '123', 199)).toThrow();
  });
  it('offers a visible manual Paytm fallback without claiming app launch means paid', () => {
    const html = renderToStaticMarkup(createElement(QRCheckout, { cardId: '123', amount: 199, vpa: 'owner@okaxis', onPaid: () => {} }));
    expect(html).toContain('Copy UPI ID');
    expect(html).toContain('To UPI ID');
    expect(html).toContain('owner@okaxis');
    expect(html).not.toContain('QR expired');
  });
});

describe('payment polling', () => {
  it('checks immediately, repeats at three seconds, and stops after verified approval', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ is_paid: false }))
      .mockResolvedValueOnce(Response.json({ is_paid: false, payment_reference_submitted: true }))
      .mockResolvedValueOnce(Response.json({ is_paid: true }));
    vi.stubGlobal('fetch', fetchMock);
    const onStatus = vi.fn();
    const poller = startPaymentPolling('card-123', onStatus);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onStatus).toHaveBeenLastCalledWith({ is_paid: false, payment_reference_submitted: true });
    await vi.advanceTimersByTimeAsync(3000);
    expect(onStatus).toHaveBeenLastCalledWith({ is_paid: true });
    await vi.advanceTimersByTimeAsync(300_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    poller.stop();
  });
  it('continues beyond the old five-minute timer and recovers after a network failure', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(async () => Response.json({ is_paid: false }));
    vi.stubGlobal('fetch', fetchMock);
    const poller = startPaymentPolling('card-123', vi.fn());
    await vi.advanceTimersByTimeAsync(310_000);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(100);
    poller.stop();
    const count = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(count);
  });
});
