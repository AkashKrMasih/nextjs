import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { headers } from 'next/headers';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { prisma } from '@/lib/prisma';
import { VerifyEmail } from '@/emails/verify-email';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

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

export async function sendVerificationEmail(userId: string, email: string) {
  const missing = missingEmailCredentials();
  if (missing.length > 0) {
    return { error: `Email is not configured. Set ${missing.join(' and ')} in .env.` };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const verifyUrl = `${await appOrigin()}/verify-email?token=${token}`;
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

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your email',
      html: await render(VerifyEmail({ verifyUrl })),
    });
  } catch (error) {
    console.error('Verification email failed:', error);
    return { error: 'Could not send the verification email. Try again.' };
  }
  return { ok: true as const };
}

export async function consumeVerificationToken(token: string | undefined) {
  if (!token) return { error: 'This verification link is invalid.' };

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return { error: 'This verification link is invalid or has expired.' };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true as const };
}
