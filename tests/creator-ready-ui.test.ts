import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import SuccessHub from '@/components/SuccessHub';
import MusicSelector from '@/components/MusicSelector';
import { RecipientFinalReveal } from '@/components/RecipientView';
import { isOfficialMusicLink, RECOMMENDED_SONGS } from '@/lib/musicLinks';
import { cardDataSchema } from '@/lib/contracts';

describe('compact ready screen', () => {
  const props = { cardId: 'card-123', recipientName: 'Priya', creatorName: 'Mohak', creatorToken: 'private-token', orderId: 'VC-123' };
  it('hides raw links, moves make-another first, and keeps activity collapsed', () => {
    const html = renderToStaticMarkup(createElement(SuccessHub, props));
    const visible = html.replace(/<[^>]*>/g, '');
    expect(visible).not.toMatch(/https?:|private-token/);
    expect(visible).toContain('Share on WhatsApp');
    expect(visible).toContain('Copy tracking link');
    expect(visible.indexOf('Make another')).toBeLessThan(visible.indexOf('Ready to share'));
    expect(html).toContain('<details');
    expect(html).not.toMatch(/<details[^>]* open/);
    expect(visible).not.toContain('Tracking armed');
  });
  it('does not expose sharing actions before payment is approved', () => {
    const html = renderToStaticMarkup(createElement(SuccessHub, { ...props, isPaid: false }));
    expect(html).toContain('Payment pending');
    expect(html).not.toContain('Share on WhatsApp');
    expect(html).not.toContain('Open their card');
  });
});

describe('official song dedications', () => {
  it('offers both requested songs without a hosted recording or preview player', () => {
    const html = renderToStaticMarkup(createElement(MusicSelector, { selectedTrackId: '', onSelectTrack: () => {} }));
    for (const song of RECOMMENDED_SONGS) {
      expect(isOfficialMusicLink(song.sourceUrl)).toBe(true);
      expect(html).toContain(song.label);
      expect(html).toContain(song.sourceUrl);
    }
    expect(html).not.toContain('<audio');
  });
  it.each(['javascript:alert(1)', 'https://music.apple.com.evil.test/song/1', 'https://attacker@music.apple.com/song/1', 'http://music.apple.com/song/1'])('rejects unsafe listening links: %s', url => {
    expect(isOfficialMusicLink(url)).toBe(false);
    expect(cardDataSchema.safeParse({ message_title: 'Hello', main_body: 'For you', music_link: url }).success).toBe(false);
  });
  it('preserves a listening link in the card payload and final image-free keepsake', () => {
    const song = RECOMMENDED_SONGS[0];
    const data = cardDataSchema.parse({ message_title: 'For you', main_body: 'A little note', music_link: song.sourceUrl });
    expect(data.music_link).toBe(song.sourceUrl);
    const html = renderToStaticMarkup(createElement(RecipientFinalReveal, {
      creatorName: 'Mohak', recipientName: 'Priya', displayMessageTitle: 'For you', displayMainBody: 'A little note',
      successHeading: 'Yours to keep', successSubtext: '', musicLink: song.sourceUrl, musicLabel: song.label,
      onReply: () => {}, onReplay: () => {},
    }));
    expect(html).toContain(song.sourceUrl);
    expect(html).not.toMatch(/<img|<audio|<iframe/);
  });
});
