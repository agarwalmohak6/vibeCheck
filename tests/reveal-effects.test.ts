import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { cardDataSchema } from '@/lib/contracts';
import { getMoodStory, MOOD_STORIES } from '@/lib/moodStories';
import { PRIMARY_TEMPLATE_TYPES, THEMES } from '@/lib/themes';
import { scratchCoverage, SCRATCH_REVEAL_PERCENT, splitGraphemes, typingDelay } from '@/lib/revealEffects';

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
