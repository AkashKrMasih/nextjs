'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeletePriceRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    const confirmed = window.confirm('Delete this price request?');
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    const response = await fetch(`/api/price-requests/${id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));
    setDeleting(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not delete this request');
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={deleting}
        className="text-sm text-red-700 hover:underline disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
      {error ? <p className="mt-1 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
