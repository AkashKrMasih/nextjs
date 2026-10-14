import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { LogoutButton } from '@/app/components/LogoutButton';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ResendForm } from './ResendForm';

export default async function VerifyEmailPendingPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    redirect('/login');
  }

  if (user.emailVerified) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <PageHeader
          title="Verify your email"
          description={
            <>
              We need to confirm <span className="font-medium text-gray-900">{user.email}</span>{' '}
              before you can continue shopping.
            </>
          }
          variant="auth"
          embedded
        />

        <ResendForm />

        <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
          <p>
            Wrong address?{' '}
            <Link
              href={`/users/${session.userId}/profile`}
              className="font-medium text-blue-600 hover:underline"
            >
              Update it on your profile
            </Link>
          </p>
          <div className="mt-3">
            <LogoutButton className="text-sm font-medium text-blue-600 hover:underline">
              Log out
            </LogoutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
