import { describe, expect, it } from 'vitest';
import { buildCreatorEmail } from '@/services/server/creator-email-template';

const details = {
  orderId: 'VC-123', creatorName: 'Mohak', recipientName: 'Priya',
  recipientUrl: 'https://cards.example.com/card/123',
  trackingUrl: 'https://cards.example.com/card/123?ct=private-token',
};

describe('creator emails', () => {
  it('clearly labels test-mode cards without claiming a payment was verified', () => {
    const email = buildCreatorEmail({ ...details, testMode: true }, 'ready');
    expect(email.subject).toContain('[Test]');
    expect(email.html).toContain('TEST CARD - PAYMENT SKIPPED');
    expect(email.html).not.toContain('PAYMENT VERIFIED');
  });
  it('makes a ready email personal and separates public and private buttons', () => {
    const email = buildCreatorEmail({ ...details, templateType: 'shoot_shot' }, 'ready');
    expect(email.subject).toBe('Your VibeCheck for Priya is ready');
    expect(email.html).toContain('Hey Mohak');
    expect(email.html).toContain('Here is to your next chapter.');
    expect(email.html).toContain(`href="${details.recipientUrl}"`);
    expect(email.html).toContain(`href="${details.trackingUrl}"`);
    expect(email.html).toContain('PAYMENT VERIFIED');
    expect(email.html.replace(/<[^>]*>/g, '')).not.toContain('private-token');
    expect(email.text).toContain(details.trackingUrl);
  });

  it('does not announce that an unpaid card is ready or offer its recipient link', () => {
    const email = buildCreatorEmail(details, 'pending');
    expect(email.subject).toContain('saved');
    expect(email.html).toContain('AWAITING PAYMENT VERIFICATION');
    expect(email.html).not.toContain('Open recipient card');
    expect(email.text).not.toContain('Recipient link to share:');
  });

  it.each(['bestie_check', 'shoot_shot', 'maan_jao', 'birthday_roast', 'netflix_chill', 'unknown', '__proto__'])('renders a safe mood template for %s', templateType => {
    const email = buildCreatorEmail({ ...details, templateType }, 'ready');
    expect(email.html).toContain('max-width:560px');
    expect(email.html).not.toContain('undefined');
    expect(email.html).not.toContain('<script');
  });

  it('escapes personal fields and rejects unsafe action links', () => {
    const email = buildCreatorEmail({ ...details, creatorName: '<script>bad</script>', recipientName: 'A & B' }, 'ready');
    expect(email.html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(email.html).toContain('A &amp; B');
    expect(() => buildCreatorEmail({ ...details, recipientUrl: 'javascript:alert(1)' }, 'ready')).toThrow();
  });
});
