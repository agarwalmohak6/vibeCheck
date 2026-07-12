import { NextRequest, NextResponse } from 'next/server';
import { getCreatorAccount, getCreatorSessionFromRequest } from '@/services/server/creator-auth';
import { listCreatorCards } from '@/services/server/card-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = getCreatorSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Login required.' }, { status: 401 });
    }

    const account = await getCreatorAccount(session.accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
    }

    const cards = await listCreatorCards(account.id);
    return NextResponse.json({ success: true, account, cards });
  } catch (error) {
    console.error('Creator account load error:', error);
    return NextResponse.json({ error: 'Could not load account.' }, { status: 500 });
  }
}
