import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE_NAME = 'vc_admin';

type AdminTokenPayload = {
  email: string;
  exp: number;
};

function base64url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function getAdminSecret() {
  return process.env.VIBECHECK_ADMIN_SECRET || '';
}

export function getConfiguredAdminEmail() {
  return (process.env.VIBECHECK_ADMIN_EMAIL || 'agarwalmohak6@gmail.com').trim().toLowerCase();
}

export function isAdminConfigured() {
  return Boolean(getAdminSecret());
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string) {
  return createHmac('sha256', getAdminSecret()).update(value).digest('base64url');
}

export function validateAdminCredentials(email: string, secret: string) {
  const configuredEmail = getConfiguredAdminEmail();
  const normalizedEmail = email.trim().toLowerCase();
  const configuredSecret = getAdminSecret();

  if (!configuredSecret) return false;
  return normalizedEmail === configuredEmail && safeEqual(secret.trim(), configuredSecret);
}

export function createAdminToken(email: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const payload: AdminTokenPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `adm1.${encoded}.${sign(encoded)}`;
}

export function verifyAdminToken(token: string | null | undefined) {
  if (!token || !getAdminSecret()) return null;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'adm1') return null;

  const [, encoded, signature] = parts;
  if (!safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminTokenPayload;
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (normalizedEmail !== getConfiguredAdminEmail()) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { email: normalizedEmail };
  } catch {
    return null;
  }
}

export function getAdminFromRequest(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
