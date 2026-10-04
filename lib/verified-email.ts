import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/app/generated/prisma/client';

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function upsertVerifiedEmail(
  userId: string,
  email: string,
  verified: boolean,
  client: DbClient = prisma,
) {
  const normalized = email.trim();
  return client.verifiedEmail.upsert({
    where: { userId_email: { userId, email: normalized } },
    create: { userId, email: normalized, verified },
    update: { verified },
  });
}
