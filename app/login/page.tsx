// app/login/page.tsx
'use client';

import { Suspense, useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from '@/app/users/actions';

function VerifiedBanner() {
  const verified = useSearchParams().get('verified') === '1';
  if (!verified) return null;
  return (
    <p className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
      Email verified. You can log in now.
    </p>
  );
}

export default function LoginPage() {
  const [emailError, setEmailError] = useState('');
  const [state, formAction, pending] = useActionState(login, undefined);

  function validateEmail(value: string) {
    if (value.length === 0) return '';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return valid ? '' : 'Enter a valid email address';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Log in to pick up right where you left off.
        </p>
        <Suspense fallback={null}>
          <VerifiedBanner />
        </Suspense>

        <form action={formAction} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
              onBlur={(e) => setEmailError(validateEmail(e.target.value))}
              onChange={(e) => emailError && setEmailError(validateEmail(e.target.value))}
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end -mt-2">
            <a href="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="font-medium text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}