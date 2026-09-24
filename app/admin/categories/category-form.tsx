'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CategoryOption = {
  id: number;
  name: string;
};

type CategoryFormProps = {
  categoryId?: number;
  parentOptions: CategoryOption[];
  defaultValues?: {
    name: string;
    slug: string;
    description: string;
    parentId: number | null;
  };
  submitLabel: string;
};

export function CategoryForm({
  categoryId,
  parentOptions,
  defaultValues,
  submitLabel,
}: CategoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const response = await fetch(
      categoryId ? `/api/categories/${categoryId}` : '/api/categories',
      {
        method: categoryId ? 'PUT' : 'POST',
        body: new FormData(event.currentTarget),
      }
    );
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save category');
      return;
    }

    router.push('/admin/categories');
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
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug <span className="text-gray-400">(optional — derived from name if blank)</span>
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={defaultValues?.slug}
          placeholder="e.g. mens-shoes"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="parentId" className="block text-sm font-medium">
          Parent category
        </label>
        <select
          id="parentId"
          name="parentId"
          defaultValue={defaultValues?.parentId ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">— None (top-level) —</option>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
        <a href="/admin/categories" className="text-sm text-gray-500 hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}
