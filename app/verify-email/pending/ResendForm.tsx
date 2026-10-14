'use client';

import { useActionState } from 'react';
import { resendVerification, type ResendState } from './actions';

export function ResendForm() {
  const [state, formAction, pending] = useActionState(
    resendVerification,
    undefined as ResendState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state?.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {state.success}
        </div>
      ) : null}

      <p className="text-sm text-gray-600">
        For development, the verification token is printed in the server console when you request a
        link.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {pending ? 'Sending…' : 'Send verification email'}
      </button>
    </form>
  );
}
