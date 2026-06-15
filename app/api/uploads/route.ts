import { NextRequest, NextResponse } from 'next/server';
import { signedUploadSchema } from '@/lib/contracts';
import { createSignedUpload } from '@/services/server/uploads';
import { checkRateLimit, getClientIp } from '@/services/server/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`uploads:${ip}`, 40, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many upload attempts. Please try again later.' }, { status: 429 });
    }

    const parsed = signedUploadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid upload payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await createSignedUpload(parsed.data);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Signed upload error:', err);
    return NextResponse.json({ error: 'Failed to create signed upload' }, { status: 500 });
  }
}
