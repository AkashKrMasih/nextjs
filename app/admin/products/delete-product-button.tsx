'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteProduct } from './actions';

export function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <button
      aria-label="Delete product"
      onClick={handleClick}
      disabled={isPending}
      className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
