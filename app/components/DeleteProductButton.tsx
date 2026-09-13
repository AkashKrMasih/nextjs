'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setDeleting(true);
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setDeleting(false);
      window.alert('Could not delete this product.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded border border-red-300 px-4 py-2 text-red-800 disabled:opacity-60"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
