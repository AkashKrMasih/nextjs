'use client';

import { useTransition } from 'react';
import { deleteUser } from './actions';

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      'Delete this user? This action cannot be undone.'
    );
    if (!confirmed) return;

    startTransition(() => {
      deleteUser(userId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete user'}
    </button>
  );
}