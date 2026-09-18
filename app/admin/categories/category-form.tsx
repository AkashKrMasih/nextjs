"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CategoryFormState } from "./actions";

type CategoryOption = {
  id: number;
  name: string;
};

type CategoryFormProps = {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  parentOptions: CategoryOption[];
  defaultValues?: {
    name: string;
    slug: string;
    description: string;
    parentId: number | null;
  };
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function CategoryForm({
  action,
  parentOptions,
  defaultValues,
  submitLabel,
}: CategoryFormProps) {
  const [state, formAction] = useActionState<CategoryFormState, FormData>(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

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
          defaultValue={defaultValues?.parentId ?? ""}
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
        <SubmitButton label={submitLabel} />
        <a href="/admin/categories" className="text-sm text-gray-500 hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}
