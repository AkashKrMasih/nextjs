import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { UserForm } from '../user-form';
import { DeleteUserButton } from '../delete-user-button';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to users
      </Link>
      <div className="mt-4 mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl tracking-tight text-stone-900">Edit user</h1>
        <DeleteUserButton userId={user.id} />
      </div>
      <UserForm
        userId={user.id}
        defaultValues={{
          name: user.name ?? '',
          email: user.email,
          role: user.role,
        }}
      />
    </main>
  );
}
