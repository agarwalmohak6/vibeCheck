import { NextRequest, NextResponse } from 'next/server';
import { createCardSchema } from '@/lib/contracts';
import { createCardDraft, getPaymentStatus, getPublicCard } from '@/services/server/card-store';
import { getCreatorSessionFromRequest } from '@/services/server/creator-auth';
import { sendCreatorOrderNotifications } from '@/services/server/notifications';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';
import { isSupabaseConnectivityError } from '@/services/server/supabase-admin';
import { tryAxisAutoApproval } from '@/services/server/axis-auto-approval';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

function getSafeCreateCardDetail(error: unknown) {
  if (!error || typeof error !== 'object') return undefined;

  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const message = 'message' in error && typeof error.message === 'string' ? error.message : undefined;
  const details = 'details' in error && typeof error.details === 'string' ? error.details : undefined;
  const hint = 'hint' in error && typeof error.hint === 'string' ? error.hint : undefined;

  if (message?.includes('VIBECHECK_TOKEN_SECRET')) {
    return { code: 'server_token_secret_missing', message: 'Server token signing is not configured.' };
  }

  if (isSupabaseConnectivityError(error)) {
    return { code: 'storage_unreachable', message: 'Card storage is not reachable from the server.' };
  }

  if (!code && !message && !details && !hint) return undefined;
  return { code, message, details, hint };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`cards:create:${ip}`, 12, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many card attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = createCardSchema.safeParse(await req.json());
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json({
        error: firstIssue?.message || 'Invalid card payload',
        issues: parsed.error.flatten(),
      }, { status: 400 });
    }

    const creatorSession = getCreatorSessionFromRequest(req);
    const { card, creatorToken } = await createCardDraft(parsed.data, creatorSession?.accountId);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL?.trim() || req.nextUrl.origin).replace(/\/+$/, '');
    const creatorUrl = `${baseUrl}/card/${card.id}?ct=${encodeURIComponent(creatorToken)}`;
    const creatorEmail = card.card_data.creator_email?.trim();
    const creatorWhatsapp = card.card_data.creator_whatsapp?.trim();
    const notifications = await sendCreatorOrderNotifications({
      creatorEmail,
      creatorWhatsapp,
      orderId: card.card_data.order_id || card.id,
      recipientName: card.recipient_name,
      creatorName: card.creator_name,
      trackingUrl: creatorUrl,
      templateType: card.template_type,
      themeId: card.theme_selected,
    });

    return NextResponse.json({
      id: card.id,
      url: `/card/${card.id}`,
      creator_token: creatorToken,
      creator_url: `/card/${card.id}?ct=${encodeURIComponent(creatorToken)}`,
      notifications,
      card,
    });
  } catch (err) {
    console.error('Card creation error:', err);
    return NextResponse.json({
      error: 'Failed to create card',
      detail: getSafeCreateCardDetail(err),
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const statusOnly = req.nextUrl.searchParams.get('status') === 'payment';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (statusOnly) {
    const status = await getPaymentStatus(id);
    if (!status) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    if (!status.is_paid && status.payment_reference && checkRateLimit(`bank-check:${id}`, 4, 60_000)) {
      const card = await getPublicCard(id);
      if (card && await tryAxisAutoApproval(card, status.payment_reference, process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin) === 'verified') {
        return NextResponse.json(await getPaymentStatus(id));
      }
    }
    return NextResponse.json(status);
  }

  const card = await getPublicCard(id);
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  return NextResponse.json(card);
}
