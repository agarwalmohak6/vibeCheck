import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnvelopeReveal from '@/components/EnvelopeReveal';
import MoodTypewriter from '@/components/MoodTypewriter';
import { PRIMARY_TEMPLATE_TYPES } from '@/lib/themes';

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock('framer-motion', () => ({ useReducedMotion: () => motion.reduced }));

beforeEach(() => { motion.reduced = false; });

describe('creator phone opening preview', () => {
  it.each(PRIMARY_TEMPLATE_TYPES.map(template => template.id))('keeps %s on the sealed opening screen', templateType => {
    const html = renderToStaticMarkup(createElement(EnvelopeReveal, {
      preview: true,
      creatorName: 'Mohak',
      recipientName: 'Priyanshi',
      templateType,
    }));
    expect(html).toContain('vc-romance-opening-preview');
    expect(html).not.toContain('vc-romance-overlay');
    expect(html).not.toContain('is-opening');
    expect(html).toContain('Something just for you.');
    expect(html).toContain('From Mohak, with a little love.');
    expect(html).toContain('For Priyanshi');
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });

  it('leaves the recipient opening interactive', () => {
    const html = renderToStaticMarkup(createElement(EnvelopeReveal, {
      creatorName: 'Mohak', recipientName: 'Priyanshi', onOpen: () => {},
    }));
    expect(html).toContain('vc-romance-overlay');
    expect(html).not.toMatch(/<button[^>]*disabled/);
  });

  it('updates the opening when the creator changes names', () => {
    const html = renderToStaticMarkup(createElement(EnvelopeReveal, {
      preview: true, creatorName: 'Aarav', recipientName: 'Aditi',
    }));
    expect(html).toContain('From Aarav, with a little love.');
    expect(html).toContain('For Aditi');
  });
});

describe('letter reveal', () => {
  it('has no read-at-once action while typing and preserves screen-reader text', () => {
    const html = renderToStaticMarkup(createElement(MoodTypewriter, {
      text: 'A little note for you.', templateType: 'maan_jao',
    }));
    expect(html).not.toContain('<button');
    expect(html).not.toContain('Read at once');
    expect(html).toContain('vc-mood-typewriter__cursor');
    expect(html).toContain('<span class="sr-only">A little note for you.</span>');
  });

  it('still reveals the complete text for reduced-motion users', () => {
    motion.reduced = true;
    const html = renderToStaticMarkup(createElement(MoodTypewriter, {
      text: 'A little note for you.', templateType: 'maan_jao',
    }));
    expect(html).toContain('<span class="vc-mood-typewriter__words">A little note for you.</span>');
    expect(html).not.toContain('vc-mood-typewriter__cursor');
  });
});
