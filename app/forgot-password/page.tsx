import Link from 'next/link';
import { missingEmailCredentials } from '@/lib/email';
import { ForgotPasswordForm } from './forgot-password-form';

export default function ForgotPasswordPage() {
  const missing = missingEmailCredentials();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Forgot password</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Enter your email and we will send a link to choose a new password.
        </p>

        {missing.length > 0 && (
          <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Email is not configured. Set {missing.join(' and ')} in .env before a reset link can be sent.
          </p>
        )}

        <ForgotPasswordForm emailConfigured={missing.length === 0} />

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
