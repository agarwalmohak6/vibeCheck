/** Page long letters without losing whitespace or splitting joined emoji. */
export function paginateLetter(text: string, limit = 420): string[] {
  const size = Number.isFinite(limit) ? Math.max(32, Math.floor(limit)) : 420;
  const pages: string[] = [];
  let remaining = text;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  while (remaining.length > size) {
    let split = remaining.lastIndexOf('\n', size - 1);
    if (split < size / 2) split = remaining.lastIndexOf(' ', size - 1);
    if (split >= size / 2) split += 1;
    else {
      split = 0;
      for (const part of segmenter.segment(remaining)) {
        const end = part.index + part.segment.length;
        if (end > size && split) break;
        split = end;
        if (end >= size) break;
      }
    }
    pages.push(remaining.slice(0, split));
    remaining = remaining.slice(split);
  }
  if (remaining || !pages.length) pages.push(remaining);
  return pages;
}

/** Present a keepsake as prose even when an older draft used a list. */
export function letterParagraphs(text: string): string[] {
  return text.split(/\n+/).map(line => line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, '').trim()).filter(Boolean);
}
