'use client';

import { useActionState, useState } from 'react';
import { requestPasswordReset } from '@/app/users/actions';
import { validateEmail } from '@/lib/utils';

export function ForgotPasswordForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [emailError, setEmailError] = useState('');
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return <p className="text-sm text-green-800">{state.success}</p>;
  }

  return (
    <form
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        const email = (event.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
        const error = email.trim().length === 0 ? 'Email is required' : validateEmail(email);
        setEmailError(error);
        if (error) event.preventDefault();
      }}
    >
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
          className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            emailError ? 'border-red-500' : 'border-gray-300'
          }`}
          onBlur={(event) => {
            const value = event.target.value;
            setEmailError(value.trim().length === 0 ? 'Email is required' : validateEmail(value));
          }}
        />
        {emailError ? <p className="mt-1 text-xs text-red-600">{emailError}</p> : null}
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || !emailConfigured}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
