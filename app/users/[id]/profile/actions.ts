'use server';

import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { createSession, getSession } from '@/lib/session';
import { upsertVerifiedEmail } from '@/lib/verified-email';

export type ProfileFormState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

async function requireOwner(userId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  if (session.userId !== userId) {
    throw new Error('Not authorized');
  }

  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    throw new Error('Your session is out of date. Please log out and log back in.');
  }

  return session;
}

export async function updateProfile(
  userId: string,
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireOwner(userId);

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const emailConfigured = formData.get('emailConfigured') === 'true';

  if (!email) {
    return { error: 'Email is required.' };
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return { error: 'Account not found.' };
  }

  const emailOwner = await prisma.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== userId) {
    return { error: 'That email is already in use.' };
  }

  if (password && password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const emailChanged = email !== existing.email;
  const passwordUpdate = password ? await hashPassword(password) : {};

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: name || null,
          email,
          ...(emailChanged ? { emailVerified: false } : {}),
          ...passwordUpdate,
        },
      });

      if (emailChanged) {
        await upsertVerifiedEmail(userId, email, false, tx);
      }
    });
  } catch (err) {
    console.error('Profile update failed:', err);
    return { error: 'Could not save your profile. Try again.' };
  }

  if (emailChanged) {
    if (!emailConfigured) {
      return {
        error:
          'Your email was updated, but verification email could not be sent. Ask an administrator to configure SMTP.',
      };
    }
    const sent = await sendVerificationEmail(userId, email);
    if ('error' in sent) {
      return { error: sent.error };
    }
  }

  await createSession({
    userId,
    email,
    name: name || '',
    role: session.role,
  });

  revalidatePath(`/users/${userId}/profile`);

  if (emailChanged) {
    return {
      success: `Profile saved. Check ${email} for a verification link before your new address is fully active.`,
    };
  }

  return { success: 'Profile saved.' };
}
