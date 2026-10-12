export const SCRATCH_REVEAL_PERCENT = 35;

/** Count cleared pixels, not pointer events. Semi-transparent foil is not a scratch. */
export function scratchCoverage(pixels: Uint8ClampedArray): number {
  if (!pixels.length) return 0;
  let cleared = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 32) cleared++;
  }
  return Math.floor((cleared / (pixels.length / 4)) * 100);
}

/** Keep joined emoji, skin tones, and combining characters together while typing. */
export function splitGraphemes(text: string): string[] {
  return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment);
}

export function typingDelay(character: string): number {
  if (/\n/.test(character)) return 240;
  if (/[.!?]/.test(character)) return 210;
  if (/[,;:]/.test(character)) return 110;
  if (/\p{Extended_Pictographic}/u.test(character)) return 160;
  return 22;
}
