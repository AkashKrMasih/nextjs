'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateUser(userId: string, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();

  if (!email) {
    throw new Error('Email is required.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      email,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath('/admin/users');
  redirect('/admin/users');
}