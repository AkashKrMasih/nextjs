'use server';

import { resendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export type ResendState = { error?: string; success?: string } | undefined;

export async function resendVerification(
  _prevState: ResendState,
  _formData: FormData,
): Promise<ResendState> {
  const session = await getSession();
  if (!session) {
    return { error: 'You must be logged in to resend verification.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    return { error: 'Account not found.' };
  }

  if (user.emailVerified) {
    return { success: 'Your email is already verified.' };
  }

  const result = await resendVerificationEmail(session.userId, user.email);
  if ('error' in result) {
    return { error: result.error };
  }

  return { success: result.message };
}
