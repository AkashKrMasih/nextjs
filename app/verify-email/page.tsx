import Link from 'next/link';
import { redirect } from 'next/navigation';
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
        <h1 className="text-2xl font-semibold text-gray-900">Email not verified</h1>
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
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
