'use client';

import { logout } from '@/app/actions/user';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="logout-button">
        Log out
      </button>
    </form>
  );
}
