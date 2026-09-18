"use client";

import { useTransition } from "react";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({
  id,
  name,
  disabled,
  disabledReason,
}: {
  id: number;
  name: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (disabled) {
    return (
      <span className="text-sm text-gray-400" title={disabledReason}>
        Delete
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm(`Delete category "${name}"? This cannot be undone.`)) {
          startTransition(() => {
            deleteCategory(id);
          });
        }
      }}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
