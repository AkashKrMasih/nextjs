import { missingEmailCredentials } from '@/lib/email';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  const missing = missingEmailCredentials();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Sign up to start saving your work and picking up where you left off.
        </p>

        {missing.length > 0 && (
          <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Email verification is not configured. Set {missing.join(' and ')} in .env before accounts can be created.
          </p>
        )}

        <SignupForm emailConfigured={missing.length === 0} />
      </div>
    </div>
  );
}
