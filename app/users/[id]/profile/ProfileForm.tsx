'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, type ProfileFormState } from './actions';

type ProfileFormProps = {
  userId: string;
  defaultValues: {
    name: string;
    email: string;
    emailVerified: boolean;
  };
  emailConfigured: boolean;
};

export function ProfileForm({ userId, defaultValues, emailConfigured }: ProfileFormProps) {
  const router = useRouter();
  const boundAction = (prev: ProfileFormState, formData: FormData) =>
    updateProfile(userId, prev, formData);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="mt-6 max-w-lg space-y-4">
      <input type="hidden" name="emailConfigured" value={emailConfigured ? 'true' : 'false'} />

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

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-900">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={defaultValues.name}
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultValues.email}
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        />
        <p className="mt-1 text-xs text-green-800">
          {defaultValues.emailVerified
            ? 'Your email is verified.'
            : 'Your email is not verified yet. Changing it will send a new verification link.'}
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-900">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Leave blank to keep current password"
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        />
        <p className="mt-1 text-xs text-stone-500">At least 8 characters when changing.</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
