import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE_NAME = 'vc_admin';
export const ADMIN_OTP_COOKIE_NAME = 'vc_admin_otp';

type AdminTokenPayload = {
  email: string;
  exp: number;
};

type AdminOtpPayload = {
  email: string;
  otpHash: string;
  exp: number;
};

function base64url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function getAdminSecret() {
  return process.env.VIBECHECK_ADMIN_SESSION_SECRET ||
    process.env.VIBECHECK_TOKEN_SECRET ||
    '';
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

export function createAdminToken(email: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const payload: AdminTokenPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `adm1.${encoded}.${sign(encoded)}`;
}

export function generateAdminOtp() {
  return String(randomInt(100000, 1000000));
}

function hashAdminOtp(email: string, otp: string) {
  return createHmac('sha256', getAdminSecret())
    .update(`${email.trim().toLowerCase()}:${otp.trim()}`)
    .digest('base64url');
}

export function createAdminOtpToken(email: string, otp: string, maxAgeSeconds = 60 * 10) {
  const normalizedEmail = email.trim().toLowerCase();
  const payload: AdminOtpPayload = {
    email: normalizedEmail,
    otpHash: hashAdminOtp(normalizedEmail, otp),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `aotp1.${encoded}.${sign(encoded)}`;
}

export function verifyAdminOtp(token: string | null | undefined, otp: string) {
  if (!token || !getAdminSecret()) return null;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'aotp1') return null;

  const [, encoded, signature] = parts;
  if (!safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminOtpPayload;
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (normalizedEmail !== getConfiguredAdminEmail()) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!safeEqual(payload.otpHash, hashAdminOtp(normalizedEmail, otp))) return null;
    return { email: normalizedEmail };
  } catch {
    return null;
  }
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

export function verifyAdminSecret(value: string | null | undefined) {
  const configuredSecret = getAdminSecret();
  const suppliedSecret = value?.trim();
  if (!configuredSecret || !suppliedSecret) return null;
  if (!safeEqual(suppliedSecret, configuredSecret)) return null;
  return { email: getConfiguredAdminEmail(), source: 'secret' as const };
}

export function getAdminFromRequest(req: NextRequest) {
  const cookieAdmin = verifyAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (cookieAdmin) return cookieAdmin;

  const bearerToken = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return verifyAdminSecret(req.headers.get('x-vibecheck-admin-secret')) ||
    verifyAdminSecret(bearerToken);
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

export function setAdminOtpCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_OTP_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
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

export function clearAdminOtpCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_OTP_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
