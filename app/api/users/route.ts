import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUser } from '@/lib/auth';

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: publicUser,
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'That email is already in use.' }, { status: 400 });
  }

  const user = await createUser(email, password, { name });
  const saved = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicUser,
  });
  return NextResponse.json(saved, { status: 201 });
}
