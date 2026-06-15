import 'server-only';

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isMockPaymentsEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';
}

export function getTokenSecret() {
  const secret =
    process.env.VIBECHECK_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.RAZORPAY_KEY_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('VIBECHECK_TOKEN_SECRET is required in production');
  }

  return secret || 'dev-vibecheck-token-secret-change-before-launch';
}
