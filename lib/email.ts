import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { headers } from 'next/headers';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { prisma } from '@/lib/prisma';
import { upsertVerifiedEmail } from '@/lib/verified-email';
import { VerifyEmail } from '@/emails/verify-email';
import { ResetPasswordEmail } from '@/emails/reset-password';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export function missingEmailCredentials() {
  const missing: string[] = [];
  if (!process.env.SMTP_HOST?.trim()) missing.push('SMTP_HOST');
  if (!process.env.SMTP_USER?.trim()) missing.push('SMTP_USER');
  if (!process.env.SMTP_PASSWORD?.trim()) missing.push('SMTP_PASSWORD');
  if (!process.env.EMAIL_FROM?.trim()) missing.push('EMAIL_FROM');
  return missing;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function appOrigin() {
  if (process.env.APP_URL?.trim()) return process.env.APP_URL.trim().replace(/\/$/, '');
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function issueEmailVerificationToken(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const verifyUrl = `${await appOrigin()}/verify-email?token=${token}`;
  console.log('[email verification token]', { userId, token, verifyUrl });

  return { token, verifyUrl };
}

export async function sendVerificationEmail(userId: string, email: string) {
  const { verifyUrl } = await issueEmailVerificationToken(userId);

  const missing = missingEmailCredentials();
  if (missing.length > 0) {
    return { error: `Email is not configured. Set ${missing.join(' and ')} in .env.` };
  }

  try {
    await sendMail(email, 'Verify your email', await render(VerifyEmail({ verifyUrl })));
  } catch (error) {
    console.error('Verification email failed:', error);
    return { error: 'Could not send the verification email. Try again.' };
  }
  return { ok: true as const };
}

/** Resend flow: always issues a token (logged to the server console) and sends email when SMTP is configured. */
export async function resendVerificationEmail(userId: string, email: string) {
  const { verifyUrl } = await issueEmailVerificationToken(userId);

  const missing = missingEmailCredentials();
  if (missing.length > 0) {
    return {
      ok: true as const,
      message: 'A new verification link was generated. Check the server console for the token.',
    };
  }

  try {
    await sendMail(email, 'Verify your email', await render(VerifyEmail({ verifyUrl })));
  } catch (error) {
    console.error('Verification email failed:', error);
    return {
      ok: true as const,
      message:
        'A new verification link was generated (see server console). Email delivery failed — try again later.',
    };
  }

  return { ok: true as const, message: 'Verification email sent. Check your inbox.' };
}

async function sendMail(to: string, subject: string, html: string) {
  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string) {
  const missing = missingEmailCredentials();
  if (missing.length > 0) {
    return { error: `Email is not configured. Set ${missing.join(' and ')} in .env.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true as const };

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
  });

  const resetUrl = `${await appOrigin()}/reset-password?token=${token}`;
  try {
    await sendMail(email, 'Reset your password', await render(ResetPasswordEmail({ resetUrl })));
  } catch (error) {
    console.error('Password reset email failed:', error);
    return { error: 'Could not send the reset email. Try again.' };
  }
  return { ok: true as const };
}

export async function findPasswordResetToken(token: string | undefined) {
  if (!token) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

export async function consumeVerificationToken(token: string | undefined) {
  if (!token) return { error: 'This verification link is invalid.' };

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return { error: 'This verification link is invalid or has expired.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { email: true },
  });
  if (!user) {
    return { error: 'This verification link is invalid.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await upsertVerifiedEmail(record.userId, user.email, true, tx);
    await tx.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
  });

  return { ok: true as const };
}
