import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const GUEST_COOKIE = 'guest_cart_id';

/**
 * Returns the guest cart session id, creating + setting the cookie if it
 * doesn't exist yet. Call this from Server Components / Route Handlers only.
 */
export async function getOrCreateGuestSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return id;
}

export async function getGuestSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

export async function clearGuestSessionId() {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}