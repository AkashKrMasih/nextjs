import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
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
      <PageHeader
        title="Edit user"
        description={user.email}
        backHref="/admin/users"
        backLabel="Back to users"
        variant="admin"
        actions={<DeleteUserButton userId={user.id} />}
        className="mb-6"
      />
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
