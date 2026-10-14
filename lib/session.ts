// lib/session.ts
import 'server-only';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  type SessionPayload,
  verifySessionToken,
} from '@/lib/session-token';

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Add it to your .env.local file (e.g. JWT_SECRET=<a long random string>) and restart the dev server.'
  );
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type { SessionPayload };

/**
 * Call this from your login server action after verifyPassword() succeeds.
 */
export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime(`${MAX_AGE_SECONDS}s`)
  .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Read + verify the session cookie. Returns null if missing/invalid/expired.
 * Safe to call from Server Components, Server Actions, and Route Handlers.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}