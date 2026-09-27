import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { consumeVerificationToken } from '@/lib/email';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await consumeVerificationToken(token);
  if ('ok' in result) {
    redirect('/login?verified=1');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <PageHeader
          title="Email not verified"
          description={<span className="text-red-600">{result.error}</span>}
          variant="auth"
          embedded
        />
        <p className="mt-4 text-sm text-gray-600">
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            Create your account
          </Link>{' '}
          again to get a new link.
        </p>
      </div>
    </div>
  );
}
