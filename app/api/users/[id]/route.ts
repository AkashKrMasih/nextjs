import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ROLES = ['CUSTOMER', 'ADMIN'] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? existing.role);

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return NextResponse.json({ error: 'Role must be customer or admin.' }, { status: 400 });
  }

  const emailOwner = await prisma.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== id) {
    return NextResponse.json({ error: 'That email is already in use.' }, { status: 400 });
  }

  const passwordUpdate = password ? await hashPassword(password) : {};

  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role: role as (typeof ROLES)[number],
      ...passwordUpdate,
    },
    select: publicUser,
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'This user has orders and cannot be deleted.' },
        { status: 400 }
      );
    }
    throw error;
  }

  return NextResponse.json({ success: true });
}
