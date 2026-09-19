"use client";

import { useState, useTransition } from "react";
import { deleteVariant } from "./actions";

export function DeleteVariantButton({
  variantId,
  productId,
}: {
  variantId: string;
  productId: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("Delete this variant? This can't be undone.")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteVariant(variantId, productId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
