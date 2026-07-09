import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

type ITunesTrack = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
  primaryGenreName?: string;
};

type ITunesResponse = {
  results?: ITunesTrack[];
};

type SongResult = {
  id: string;
  label: string;
  artist: string;
  album?: string;
  previewUrl: string;
  artworkUrl?: string;
  sourceUrl?: string;
  provider: 'itunes';
};

const DEFAULT_COUNTRIES = ['US', 'IN'];

function isCountryCode(value: string | null) {
  return Boolean(value && /^[A-Z]{2}$/.test(value));
}

async function searchITunes(term: string, country: string, limit: number) {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', term);
  url.searchParams.set('country', country);
  url.searchParams.set('media', 'music');
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data = (await res.json()) as ITunesResponse;
  return data.results || [];
}

function normalizeTrack(track: ITunesTrack): SongResult | null {
  if (!track.trackId || !track.trackName || !track.artistName || !track.previewUrl) {
    return null;
  }

  return {
    id: `itunes:${track.trackId}`,
    label: track.trackName,
    artist: track.artistName,
    album: track.collectionName,
    previewUrl: track.previewUrl,
    artworkUrl: track.artworkUrl100?.replace('100x100bb', '300x300bb'),
    sourceUrl: track.trackViewUrl,
    provider: 'itunes',
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`music:search:${ip}`, 90, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many song searches. Please slow down.' }, { status: 429 });
  }

  const query = (req.nextUrl.searchParams.get('q') || '').trim();
  if (query.length < 2) return NextResponse.json({ results: [] });
  if (query.length > 80) {
    return NextResponse.json({ error: 'Search is too long.' }, { status: 400 });
  }

  const country = req.nextUrl.searchParams.get('country')?.toUpperCase() || null;
  const countries = isCountryCode(country) ? [country as string] : DEFAULT_COUNTRIES;

  try {
    const responses = await Promise.all(countries.map((code) => searchITunes(query, code, 10)));
    const seen = new Set<string>();
    const results: SongResult[] = [];

    for (const track of responses.flat()) {
      const normalized = normalizeTrack(track);
      if (!normalized || seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      results.push(normalized);
    }

    return NextResponse.json({
      provider: 'itunes',
      results: results.slice(0, 16),
    });
  } catch (err) {
    console.error('Music search failed:', err);
    return NextResponse.json({ error: 'Song search failed. Try again in a moment.' }, { status: 502 });
  }
}
