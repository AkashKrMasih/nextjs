import 'server-only';
import { getSession } from '@/lib/session';

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}
