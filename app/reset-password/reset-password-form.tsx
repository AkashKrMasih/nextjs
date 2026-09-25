'use client';

import { useActionState, useState } from 'react';
import { resetPassword } from '@/app/users/actions';

export function ResetPasswordForm({ token }: { token: string }) {
  const [passwordError, setPasswordError] = useState('');
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <form
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        const password = (event.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
        const error = password.length >= 8 ? '' : 'Password must be at least 8 characters';
        setPasswordError(error);
        if (error) event.preventDefault();
      }}
    >
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          New password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            passwordError ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {passwordError ? <p className="mt-1 text-xs text-red-600">{passwordError}</p> : null}
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
      >
        {pending ? 'Saving…' : 'Save password'}
      </button>
    </form>
  );
}
