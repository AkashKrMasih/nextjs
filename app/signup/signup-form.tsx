'use client';

import { useState, useActionState } from 'react';
import { signup } from '@/app/users/actions';

export function SignupForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [state, formAction, pending] = useActionState(signup, undefined);

  function validateEmail(value: string) {
    if (value.length === 0) return 'Email is required';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return valid ? '' : 'Enter a valid email address';
  }

  function validatePassword(value: string) {
    if (value.length === 0) return 'Password is required';
    return value.length >= 8 ? '' : 'Password must be at least 8 characters';
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      e.preventDefault();
    }
  }

  if (state?.success) {
    return <p className="text-sm text-green-800">{state.success}</p>;
  }

  return (
    <>
      <form action={formAction} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
            disabled={!emailConfigured}
            className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            onBlur={(e) => setEmailError(validateEmail(e.target.value))}
            onChange={(e) => emailError && setEmailError(validateEmail(e.target.value))}
          />
          {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
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
            minLength={8}
            autoComplete="new-password"
            disabled={!emailConfigured}
            className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              passwordError ? 'border-red-500' : 'border-gray-300'
            }`}
            onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
            onChange={(e) => passwordError && setPasswordError(validatePassword(e.target.value))}
          />
          <p className={`mt-1 text-xs ${passwordError ? 'text-red-600' : 'text-gray-500'}`}>
            {passwordError || 'Use 8 or more characters'}
          </p>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || !emailConfigured}
          className="mt-2 w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-blue-600 hover:underline">
          Log in
        </a>
      </p>
    </>
  );
}
