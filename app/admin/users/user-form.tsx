'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type UserFormProps = {
  userId?: string;
  defaultValues?: {
    name: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN';
  };
};

export function UserForm({ userId, defaultValues }: UserFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(userId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const response = await fetch(userId ? `/api/users/${userId}` : '/api/users', {
      method: userId ? 'PUT' : 'POST',
      body: new FormData(event.currentTarget),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save user');
      return;
    }

    router.push('/admin/users');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
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
          required
          defaultValue={defaultValues?.name}
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
          defaultValue={defaultValues?.email}
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-900">
          Password
          {editing ? (
            <span className="font-normal text-stone-500"> (leave blank to keep the current one)</span>
          ) : null}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required={!editing}
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-stone-900">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={defaultValues?.role ?? 'CUSTOMER'}
          className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        >
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Create user'}
        </button>
        <a href="/admin/users" className="text-sm text-stone-500 hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}
