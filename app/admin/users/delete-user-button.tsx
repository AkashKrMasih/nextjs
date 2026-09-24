'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) return;

    setDeleting(true);
    const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));
    setDeleting(false);

    if (!response.ok) {
      window.alert(payload.error ?? 'Could not delete user');
      return;
    }

    router.push('/admin/users');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
