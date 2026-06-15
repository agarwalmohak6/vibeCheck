import { NextRequest, NextResponse } from 'next/server';
import { trackerEventSchema } from '@/lib/contracts';
import { getTrackerEvents, recordTrackerEvent } from '@/services/server/card-store';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const creatorToken = req.headers.get('x-vibecheck-creator-token') || req.nextUrl.searchParams.get('ct');
  const events = await getTrackerEvents(id, creatorToken);

  if (!events) return NextResponse.json({ error: 'Creator token required' }, { status: 403 });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ip = getClientIp(req);

  if (!checkRateLimit(`events:${id}:${ip}`, 120, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many events. Please slow down.' }, { status: 429 });
  }

  const parsed = trackerEventSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const event = await recordTrackerEvent(id, parsed.data.event_type, parsed.data.metadata);
  return NextResponse.json(event);
}
