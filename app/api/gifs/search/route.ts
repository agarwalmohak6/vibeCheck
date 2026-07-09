import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

type GiphyItem = {
  id?: string;
  title?: string;
  images?: {
    fixed_height?: { url?: string };
    original?: { url?: string };
  };
};

type GiphyResponse = {
  data?: GiphyItem[];
};

type GifResult = {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
};

const MOCK_GIFS: GifResult[] = [
  {
    id: 'mock-love',
    title: 'Love GIF',
    previewUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 'mock-hearts',
    title: 'Hearts GIF',
    previewUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200.gif',
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  },
  {
    id: 'mock-kawaii',
    title: 'Kawaii GIF',
    previewUrl: 'https://media.giphy.com/media/26FPJGjhefSJuaRhu/200.gif',
    url: 'https://media.giphy.com/media/26FPJGjhefSJuaRhu/giphy.gif',
  },
];

function normalizeGif(item: GiphyItem): GifResult | null {
  const previewUrl = item.images?.fixed_height?.url;
  const url = item.images?.original?.url || previewUrl;
  if (!item.id || !previewUrl || !url) return null;

  return {
    id: item.id,
    title: item.title || 'GIF',
    previewUrl,
    url,
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`gifs:search:${ip}`, 90, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many GIF searches. Please slow down.' }, { status: 429 });
  }

  const query = (req.nextUrl.searchParams.get('q') || '').trim();
  if (query.length < 2) return NextResponse.json({ results: [] });
  if (query.length > 80) {
    return NextResponse.json({ error: 'Search is too long.' }, { status: 400 });
  }

  const apiKey = process.env.GIPHY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ provider: 'mock', results: MOCK_GIFS });
  }

  try {
    const url = new URL('https://api.giphy.com/v1/gifs/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '15');
    url.searchParams.set('rating', 'pg-13');

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'GIF search failed.' }, { status: 502 });
    }

    const data = (await res.json()) as GiphyResponse;
    return NextResponse.json({
      provider: 'giphy',
      results: (data.data || []).map(normalizeGif).filter((gif): gif is GifResult => Boolean(gif)),
    });
  } catch (err) {
    console.error('GIF search failed:', err);
    return NextResponse.json({ error: 'GIF search failed. Try again in a moment.' }, { status: 502 });
  }
}
