import Link from 'next/link';
import { findPasswordResetToken } from '@/lib/email';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const record = await findPasswordResetToken(token);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Choose a new password</h1>
        {record && token ? (
          <>
            <p className="mt-1 mb-6 text-sm text-gray-500">Use 8 or more characters.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="mt-2 text-sm text-red-600">
            This reset link is invalid or has expired.{' '}
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
              Request a new one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
