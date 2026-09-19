"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
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

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      title={disabled ? disabledReason : `Delete ${name}`}
      aria-label={`Delete ${name}`}
      onClick={() => {
        if (disabled) return;
        if (confirm(`Delete category "${name}"? This cannot be undone.`)) {
          startTransition(() => {
            deleteCategory(id);
          });
        }
      }}
      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}