import { describe, expect, it } from 'vitest';
import { dodgePosition, ENVELOPE_OPEN_MS, PHOTO_HOLD_MS } from '@/lib/romanceMotion';
import { letterParagraphs } from '@/lib/letterPages';

describe('moving No button', () => {
  it.each([220, 300, 560])('keeps moving after repeated attempts inside a %spx lane', width => {
    const positions = Array.from({ length: 24 }, (_, i) => dodgePosition(width, 104, 140, 44, i + 1));
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0);
      expect(x + 140).toBeLessThanOrEqual(width); expect(y + 44).toBeLessThanOrEqual(104);
      if (i) expect(positions[i]).not.toEqual(positions[i - 1]);
    }
  });
  it('gives the opening and each photo time to breathe', () => {
    expect(ENVELOPE_OPEN_MS).toBeGreaterThanOrEqual(4000);
    expect(PHOTO_HOLD_MS).toBeGreaterThanOrEqual(6000);
  });
});

describe('keepsake letter prose', () => {
  it('removes old list markers without dropping the words', () => {
    expect(letterParagraphs('• A small plan\n- Good company\n1. A little courage\n\nJust us.')).toEqual(['A small plan', 'Good company', 'A little courage', 'Just us.']);
  });
});
