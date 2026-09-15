'use client';

import { logout } from '@/app/users/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="logout-button">
        Log out
      </button>
    </form>
  );
}
