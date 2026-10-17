import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import About from '@/app/about/page';
import Contact from '@/app/contact/page';
import Pricing from '@/app/pricing/page';
import Terms from '@/app/terms/page';
import Privacy from '@/app/privacy/page';
import Refund from '@/app/refund-policy/page';
import Delivery from '@/app/shipping-policy/page';
import ComplianceFooter from '@/components/ComplianceFooter';
import { PUBLIC_SEO_ROUTES } from '@/lib/site';
import { BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_OPERATOR, BUSINESS_PHONE_HREF } from '@/lib/business';
import { TIERS } from '@/lib/themes';

const pages = [
  ['/about', About], ['/contact', Contact], ['/pricing', Pricing],
  ['/terms', Terms], ['/privacy', Privacy], ['/refund-policy', Refund],
  ['/shipping-policy', Delivery],
] as const;

describe('merchant website disclosures', () => {
  it.each(pages)('%s renders publicly with policy navigation and a sitemap entry', (path, Page) => {
    const html = renderToStaticMarkup(createElement(Page));
    expect(html).toContain('<h1');
    for (const [href] of pages) expect(html).toContain(`href="${href}"`);
    expect(PUBLIC_SEO_ROUTES.some(route => route.path === path)).toBe(true);
    expect(html).not.toContain('Razorpay');
  });

  it('publishes only confirmed contact details in the public footer', () => {
    const html = renderToStaticMarkup(createElement(ComplianceFooter));
    expect(html).toContain(BUSINESS_ADDRESS);
    expect(html).toContain(BUSINESS_OPERATOR);
    expect(html).toContain(`mailto:${BUSINESS_EMAIL}`);
    expect(html).toContain(`tel:${BUSINESS_PHONE_HREF}`);
    expect(html).toContain('payment verification');
  });

  it('matches checkout pricing and explains current payment and delivery limitations', () => {
    const html = renderToStaticMarkup(createElement(Pricing));
    for (const tier of TIERS) expect(html).toContain(`₹${tier.price}`);
    expect(html).toContain('manual payment verification');
    expect(html).toContain('Debit/credit-card checkout is not yet available');
    expect(html).toContain('one business day');
    expect(html).toContain('total payable');
  });

  it('does not advertise discontinued delivery plans or instant approval', () => {
    const html = renderToStaticMarkup(createElement(Delivery));
    expect(html).not.toMatch(/15 minutes|1 Day|2 Days|Razorpay/);
    expect(html).toContain('business day');
  });
});
