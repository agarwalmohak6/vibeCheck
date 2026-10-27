import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/services/server/supabase-admin';
import { getPublicCard } from '@/services/server/card-store';
import { isAxisAutoApprovalConfigured } from '@/services/server/axis-mailbox';
import { tryAxisAutoApproval } from '@/services/server/axis-auto-approval';
import { checkRateLimit } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Private, bounded reconciliation batches for an owner's scheduler; never a public approval API. */
export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_RECONCILE_SECRET || '';
  const supplied = req.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const expectedBytes = Buffer.from(secret), suppliedBytes = Buffer.from(supplied);
  if (secret.length < 32 || suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAxisAutoApprovalConfigured()) return NextResponse.json({ enabled: false });
  if (!checkRateLimit('axis-reconciliation', 2, 60_000)) return NextResponse.json({ error: 'Please retry later' }, { status: 429 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Payment storage unavailable' }, { status: 503 });
  try {
    const cursor = req.nextUrl.searchParams.get('cursor');
    if (cursor && !/^[0-9a-f-]{36}$/i.test(cursor)) return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
    let query = admin.from('payments').select('id,card_id,provider_payment_id')
      .eq('provider', 'upi_manual').eq('status', 'created').eq('currency', 'INR')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString())
      .order('id', { ascending: true }).limit(3);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query;
    if (error) throw error;
    const results = await Promise.all((data || []).map(async proof => {
      const card = await getPublicCard(proof.card_id);
      return card ? tryAxisAutoApproval(card, proof.provider_payment_id, process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin) : 'pending';
    }));
    return NextResponse.json({ enabled: true, checked: results.length, verified: results.filter(result => result === 'verified').length, next_cursor: data?.length === 3 ? data[2].id : null });
  } catch {
    return NextResponse.json({ error: 'Reconciliation temporarily unavailable; pending payments were not approved.' }, { status: 503 });
  }
}
