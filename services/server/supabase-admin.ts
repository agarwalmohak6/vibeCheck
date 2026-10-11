import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './config';

let adminClient: SupabaseClient | null = null;
let supabaseDisabledForRuntime = false;

function readErrorValue(error: unknown, key: 'code' | 'message') {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : null;
  return typeof record?.[key] === 'string'
    ? record[key]
    : '';
}

export function isSupabaseConnectivityError(error: unknown): boolean {
  const code = readErrorValue(error, 'code');
  const message = readErrorValue(error, 'message');
  if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|fetch failed|network/i.test(`${code} ${message}`)) {
    return true;
  }

  const cause = error && typeof error === 'object' && 'cause' in error ? error.cause : null;
  if (cause && isSupabaseConnectivityError(cause)) return true;

  const errors = error && typeof error === 'object' && 'errors' in error ? error.errors : null;
  return Array.isArray(errors) && errors.some(isSupabaseConnectivityError);
}

export function disableSupabaseForRuntime(error: unknown) {
  if (!supabaseDisabledForRuntime) {
    console.error('Supabase is unreachable; using in-memory fallback for this server process.', {
      code: readErrorValue(error, 'code') || undefined,
      message: readErrorValue(error, 'message') || undefined,
    });
  }
  supabaseDisabledForRuntime = true;
  adminClient = null;
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  if (supabaseDisabledForRuntime) return null;
  if (adminClient) return adminClient;

  adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return adminClient;
}
