import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { CreatorAuthInput } from '@/lib/contracts';
import { getTokenSecret } from './config';
import { getSupabaseAdmin } from './supabase-admin';

export const CREATOR_COOKIE_NAME = 'vc_creator';

export type CreatorAccount = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  created_at: string;
};

type StoredCreatorAccount = CreatorAccount & {
  password_salt: string;
  password_hash: string;
};

type CreatorTokenPayload = {
  accountId: string;
  exp: number;
};

type CreatorMockState = {
  __MOCK_CREATOR_ACCOUNTS?: Record<string, StoredCreatorAccount>;
};

const globalStore = globalThis as unknown as CreatorMockState;
const MOCK_CREATOR_ACCOUNTS =
  globalStore.__MOCK_CREATOR_ACCOUNTS || (globalStore.__MOCK_CREATOR_ACCOUNTS = {});

function base64url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string) {
  return createHmac('sha256', getTokenSecret()).update(value).digest('base64url');
}

function publicAccount(account: StoredCreatorAccount): CreatorAccount {
  return {
    id: account.id,
    email: account.email,
    phone: account.phone,
    display_name: account.display_name,
    created_at: account.created_at,
  };
}

export function normalizeCreatorEmail(email: string | null | undefined) {
  const cleaned = email?.trim().toLowerCase() || '';
  return cleaned || null;
}

export function normalizeCreatorPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') || '';
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, hash: string) {
  const computed = hashPassword(password, salt).hash;
  return safeEqual(computed, hash);
}

function createCreatorToken(accountId: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const payload: CreatorTokenPayload = {
    accountId,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `vca1.${encoded}.${sign(encoded)}`;
}

export function verifyCreatorToken(token: string | null | undefined) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'vca1') return null;

  const [, encoded, signature] = parts;
  if (!safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as CreatorTokenPayload;
    if (!payload.accountId || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { accountId: payload.accountId };
  } catch {
    return null;
  }
}

export function getCreatorSessionFromRequest(req: NextRequest) {
  return verifyCreatorToken(req.cookies.get(CREATOR_COOKIE_NAME)?.value);
}

export function setCreatorCookie(response: NextResponse, accountId: string) {
  response.cookies.set({
    name: CREATOR_COOKIE_NAME,
    value: createCreatorToken(accountId),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCreatorCookie(response: NextResponse) {
  response.cookies.set({
    name: CREATOR_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

async function findCreatorAccount(email: string | null, phone: string | null) {
  const admin = getSupabaseAdmin();

  if (!admin) {
    const account = Object.values(MOCK_CREATOR_ACCOUNTS).find((item) =>
      Boolean((email && item.email === email) || (phone && item.phone === phone))
    );
    return account || null;
  }

  if (email) {
    const { data, error } = await admin
      .from('creator_accounts')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as StoredCreatorAccount;
  }

  if (phone) {
    const { data, error } = await admin
      .from('creator_accounts')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as StoredCreatorAccount;
  }

  return null;
}

export async function registerCreator(input: CreatorAuthInput) {
  const email = normalizeCreatorEmail(input.email);
  const phone = normalizeCreatorPhone(input.phone);
  const displayName = input.name?.trim() || null;
  const existing = await findCreatorAccount(email, phone);

  if (existing) {
    if (!verifyPassword(input.password, existing.password_salt, existing.password_hash)) {
      return { ok: false as const, reason: 'ACCOUNT_EXISTS' };
    }
    return { ok: true as const, account: publicAccount(existing), existing: true };
  }

  const password = hashPassword(input.password);
  const createdAt = new Date().toISOString();
  const admin = getSupabaseAdmin();

  if (!admin) {
    const id = randomBytes(16).toString('hex');
    const account: StoredCreatorAccount = {
      id,
      email,
      phone,
      display_name: displayName,
      password_salt: password.salt,
      password_hash: password.hash,
      created_at: createdAt,
    };
    MOCK_CREATOR_ACCOUNTS[id] = account;
    return { ok: true as const, account: publicAccount(account), existing: false };
  }

  const { data, error } = await admin
    .from('creator_accounts')
    .insert({
      email,
      phone,
      display_name: displayName,
      password_salt: password.salt,
      password_hash: password.hash,
    })
    .select('*')
    .single();

  if (error) throw error;
  return { ok: true as const, account: publicAccount(data as StoredCreatorAccount), existing: false };
}

export async function loginCreator(input: CreatorAuthInput) {
  const email = normalizeCreatorEmail(input.email);
  const phone = normalizeCreatorPhone(input.phone);
  const account = await findCreatorAccount(email, phone);

  if (!account || !verifyPassword(input.password, account.password_salt, account.password_hash)) {
    return { ok: false as const, reason: 'INVALID_LOGIN' };
  }

  return { ok: true as const, account: publicAccount(account) };
}

export async function getCreatorAccount(accountId: string) {
  const admin = getSupabaseAdmin();

  if (!admin) {
    const account = MOCK_CREATOR_ACCOUNTS[accountId];
    return account ? publicAccount(account) : null;
  }

  const { data, error } = await admin
    .from('creator_accounts')
    .select('id, email, phone, display_name, created_at')
    .eq('id', accountId)
    .maybeSingle();

  if (error) throw error;
  return data ? data as CreatorAccount : null;
}
