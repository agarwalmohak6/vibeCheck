import { describe, expect, it } from 'vitest';
import { paginateLetter } from '@/lib/letterPages';
import { existsSync } from 'node:fs';
import { cardDataSchema } from '@/lib/contracts';
import { getMoodStory, MOOD_STORIES } from '@/lib/moodStories';
import { PRIMARY_TEMPLATE_TYPES, THEMES } from '@/lib/themes';
import { scratchCoverage, scratchPoint, SCRATCH_REVEAL_PERCENT, splitGraphemes, typingDelay } from '@/lib/revealEffects';

function foil(cleared: number, total = 10000) {
  const pixels = new Uint8ClampedArray(total * 4).fill(255);
  for (let index = 0; index < cleared; index++) pixels[index * 4 + 3] = 0;
  return pixels;
}

describe('scratch area rather than movement count', () => {
  it('unlocks at 35% and keeps 34.99% locked', () => {
    expect(scratchCoverage(foil(3499))).toBeLessThan(SCRATCH_REVEAL_PERCENT);
    expect(scratchCoverage(foil(3500))).toBe(SCRATCH_REVEAL_PERCENT);
  });
  it('repeatedly inspecting the same scratched patch does not increase progress', () => {
    const pixels = foil(200);
    for (let repeat = 0; repeat < 100; repeat++) expect(scratchCoverage(pixels)).toBe(2);
  });
  it('does not count translucent foil as removed', () => {
    const pixels = foil(0);
    for (let index = 3; index < pixels.length; index += 4) pixels[index] = 235;
    expect(scratchCoverage(pixels)).toBe(0);
    expect(scratchCoverage(foil(10000))).toBe(100);
    expect(scratchCoverage(new Uint8ClampedArray())).toBe(0);
  });
});

describe('emoji-aware typing', () => {
  it('does not split joined emoji, skin tones, flags, or accented letters', () => {
    expect(splitGraphemes('🤍👩🏽‍❤️‍👩🏻🇮🇳e\u0301')).toEqual(['🤍', '👩🏽‍❤️‍👩🏻', '🇮🇳', 'e\u0301']);
  });
  it('pauses on punctuation, new lines, and mood emoji', () => {
    for (const token of ['.', ',', '\n', '🎂']) expect(typingDelay(token)).toBeGreaterThan(typingDelay('a'));
  });
});

describe('ready-to-send mood defaults', () => {
  for (const template of PRIMARY_TEMPLATE_TYPES) {
    it(`${template.id} is accepted by the card API for every writing style`, () => {
      for (const preset of template.messagePresets) {
        expect(() => cardDataSchema.parse({
          message_title: preset.title, main_body: preset.body,
          yes_btn_text: template.defaultYesText, no_btn_text: template.defaultNoText,
          story_questions: template.storyQuestions,
        })).not.toThrow();
      }
      expect(THEMES.some(theme => theme.id === template.recommendedTheme)).toBe(true);
      expect(existsSync(`public${template.defaultCoverImage}`)).toBe(true);
      expect(getMoodStory(template.id).narrative.scratchBody).not.toBe(template.messagePresets[0].body);
    });
  }
  it('offers all moods and safely falls back for old or unknown identifiers', () => {
    expect(PRIMARY_TEMPLATE_TYPES.map(template => template.id).sort()).toEqual(Object.keys(MOOD_STORIES).sort());
    expect(getMoodStory('old_card')).toBe(MOOD_STORIES.bestie_check);
    expect(getMoodStory('constructor')).toBe(MOOD_STORIES.bestie_check);
  });
});


describe('letters and scratch interaction in fitted screens', () => {
  it('preserves every character of a maximum-length custom letter', () => {
    const letter = ('A memory, a promise.  \n\n' + '👩🏽‍❤️‍👩🏻').repeat(90).slice(0, 2500);
    const pages = paginateLetter(letter);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.join('')).toBe(letter);
    expect(pages.every(page => page.length <= 420)).toBe(true);
  });
  it('keeps joined emoji intact at page boundaries even without spaces', () => {
    const emoji = '👩🏽‍❤️‍👩🏻';
    const pages = paginateLetter(emoji.repeat(90), 43);
    expect(pages.join('')).toBe(emoji.repeat(90));
    for (const page of pages) expect(splitGraphemes(page).every(part => part === emoji)).toBe(true);
  });
  it('handles empty, unbroken and invalid-limit input without losing text', () => {
    expect(paginateLetter('')).toEqual(['']);
    for (const limit of [0, -1, NaN, Infinity, 420]) {
      const pages = paginateLetter('a'.repeat(2500), limit);
      expect(pages.join('')).toBe('a'.repeat(2500));
    }
  });
  it.each([1, 0.75, 0.4])('scratches the same note position at scale %s', scale => {
    const rect = { left: 10, top: 20, width: 400 * scale, height: 240 * scale };
    expect(scratchPoint(10 + 200 * scale, 20 + 120 * scale, rect, 400, 240)).toEqual({ x: 200, y: 120 });
  });
});

describe('unhurried reveal controls', () => {
  it('uses a readable typing pace with longer pauses for punctuation', () => {
    expect(typingDelay('a')).toBeGreaterThanOrEqual(45);
    expect(typingDelay('.')).toBeGreaterThanOrEqual(400);
  });
});
