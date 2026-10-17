import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SecretCodeGate from '@/components/SecretCodeGate';
import { RecipientFinalReveal } from '@/components/RecipientView';

describe('private lock presentation', () => {
  it('offers a keyboard-accessible PIN field and a disabled initial submit', () => {
    const html = renderToStaticMarkup(createElement(SecretCodeGate, {
      cardId: 'id', creatorName: 'Mohak', recipientName: 'Priyanshi', onUnlock: () => {},
    }));
    expect(html).toContain('Mohak left you the key.');
    expect(html).toContain('Priyanshi, this');
    expect(html).toMatch(/<input[^>]*inputMode="numeric"/);
    expect(html).toContain('maxLength="4"');
    expect(html).toContain('aria-label="Delete last digit"');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
    expect(html).toContain('aria-live="polite"');
  });

  it('uses a full answer input instead of the numeric keypad for a question', () => {
    const html = renderToStaticMarkup(createElement(SecretCodeGate, {
      cardId: 'id', unlockQuestion: 'Where did we first meet?', onUnlock: () => {},
    }));
    expect(html).toContain('Where did we first meet?');
    expect(html).toContain('aria-label="Your secret answer"');
    expect(html).not.toContain('Code keypad');
    expect(html).toContain('maxLength="80"');
  });
});

describe('image-free final keepsake', () => {
  it('retains the message and reply/replay controls without any image element or image background', () => {
    const html = renderToStaticMarkup(createElement(RecipientFinalReveal, {
      creatorName: 'Mohak', recipientName: 'Priyanshi', displayMessageTitle: 'You and me.',
      displayMainBody: 'A memory worth keeping.\nA little promise.',
      successHeading: 'Here is to the next chapter.', successSubtext: 'Yours to keep.',
      onReply: () => {}, onReplay: () => {},
    }));
    expect(html).not.toMatch(/<img|<picture|background-image|vc-final-reveal__media|vc-final-reveal__thumbs/);
    expect(html).toContain('A memory worth keeping.');
    expect(html).toContain('A little promise.');
    expect(html).toContain('Send a reply');
    expect(html).toContain('See the moments again');
  });

  it('keeps long notes paginated instead of introducing a tall final page', () => {
    const html = renderToStaticMarkup(createElement(RecipientFinalReveal, {
      creatorName: 'Mohak', recipientName: 'Priyanshi', displayMessageTitle: 'For you',
      displayMainBody: 'A beautiful memory. '.repeat(100), successHeading: 'Yours to keep.', successSubtext: '',
      onReply: () => {}, onReplay: () => {},
    }));
    expect(html).toContain('aria-label="Saved letter pages"');
  });
});
