'use client';

import { useTransition, type ReactNode } from 'react';
import { logout } from '@/app/users/actions';

type LogoutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
      className={className ?? 'logout-button'}
    >
      {children ?? 'Log out'}
    </button>
  );
}