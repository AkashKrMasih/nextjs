'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeletePromotionButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm('Delete this home page promotion?')) return;
    setDeleting(true);
    const response = await fetch(`/api/home-page-promotions/${id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));
    setDeleting(false);
    if (!response.ok) {
      window.alert(payload.error ?? 'Could not delete promotion');
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className="text-sm text-red-700 hover:underline disabled:opacity-50"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
