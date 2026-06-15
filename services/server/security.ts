import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getTokenSecret } from './config';

type TokenPurpose = 'creator' | 'unlock';

function base64url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', getTokenSecret()).update(value).digest('base64url');
}

export function createAccessToken(cardId: string, purpose: TokenPurpose, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const payload = {
    cardId,
    purpose,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    nonce: randomBytes(10).toString('base64url'),
  };
  const encoded = base64url(JSON.stringify(payload));
  return `vc1.${encoded}.${sign(encoded)}`;
}

export function verifyAccessToken(token: string | null | undefined, cardId: string, purpose: TokenPurpose) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'vc1') return false;

  const [, encoded, signature] = parts;
  const expected = sign(encoded);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      cardId: string;
      purpose: TokenPurpose;
      exp: number;
    };
    return payload.cardId === cardId && payload.purpose === purpose && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function hashPasscode(passcode: string, salt = randomBytes(16).toString('hex')) {
  const normalized = passcode.trim().toLowerCase();
  const hash = createHmac('sha256', `${getTokenSecret()}:${salt}`).update(normalized).digest('hex');
  return { salt, hash };
}

export function verifyPasscodeHash(passcode: string, salt: string, hash: string) {
  const computed = hashPasscode(passcode, salt).hash;
  const provided = Buffer.from(hash);
  const expected = Buffer.from(computed);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer);
}
