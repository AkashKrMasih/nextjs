import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { missingEmailCredentials } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.userId !== id) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, emailVerified: true },
  });

  if (!user) {
    notFound();
  }

  const emailConfigured = missingEmailCredentials().length === 0;

  return (
    <main className="max-w-6xl px-6 py-10">
      <PageHeader
        title="Profile"
        description="Update your name, email, and password."
        variant="store"
      />

      <ProfileForm
        userId={id}
        defaultValues={{
          name: user.name ?? '',
          email: user.email,
          emailVerified: user.emailVerified,
        }}
        emailConfigured={emailConfigured}
      />
    </main>
  );
}
