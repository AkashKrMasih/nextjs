// lib/session.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Add it to your .env.local file (e.g. JWT_SECRET=<a long random string>) and restart the dev server.'
  );
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

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
  cookieStore.set(COOKIE_NAME, token, {
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
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    // expired, tampered, or wrong secret
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}