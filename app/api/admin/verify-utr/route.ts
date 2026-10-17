// Both approval entry points must use the same authenticated verification and notification flow.
export { POST } from '@/app/api/payment/manual-verify/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
