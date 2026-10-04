import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Add it to your .env.local file (e.g. JWT_SECRET=<a long random string>) and restart the dev server.',
  );
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const SESSION_COOKIE_NAME = 'session';

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
};

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const data = payload as Record<string, unknown>;
    if (
      typeof data.userId !== 'string' ||
      typeof data.email !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.role !== 'string'
    ) {
      return null;
    }
    return {
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: data.role,
      emailVerified:
        typeof data.emailVerified === 'boolean' ? data.emailVerified : true,
    };
  } catch {
    return null;
  }
}
