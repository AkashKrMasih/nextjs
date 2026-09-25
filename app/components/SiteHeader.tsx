import Link from 'next/link';
import { getSession } from '@/lib/session';
import { LogoutButton } from './LogoutButton';
import { CartLink } from './CartLink';

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-stone-300 bg-stone-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl tracking-tight">
          Shop
        </Link>

        <nav className="flex items-center gap-5 text-sm text-green-800">
          <Link href="/" className="hover:text-stone-900">
            Catalog
          </Link>
          <CartLink />

          {session ? (
            <>

              {session.role === 'ADMIN' && (
                <>
                  <Link href="/admin/products/new" className="hover:text-stone-900">
                    Add product
                  </Link>
                  <Link href="/admin" className="hover:text-stone-900">
                    Dashboard
                  </Link>
                </>
              )}

              <div className="group relative">

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-green-800 transition-colors hover:bg-stone-300 hover:text-stone-900"
                  aria-label="Account menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                  </svg>
                </button>

                {/* Invisible bridge so the dropdown doesn't close when moving the cursor down to it */}
                <div className="absolute right-0 top-full h-2 w-full" />

                <div
                  className="invisible absolute right-0 top-full z-10 w-56 translate-y-1 rounded-lg border border-stone-300 bg-stone-50 p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-y-2 group-hover:opacity-100"
                  role="menu"
                >
                  <div className="mb-2 flex flex-col leading-tight">
                  <span className="text-sm font-medium text-stone-900">
                    {session.name}
                  </span>
                    <span className="text-xs text-green-800">
                    {session.email}
                  </span>
                  </div>
                  <div className="border-t border-stone-300 pt-2">
                    <Link
                      href={`/users/${session.userId}/address`}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-green-800 transition-colors hover:bg-stone-200 hover:text-stone-900"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Addresses
                    </Link>
                    <Link
                      href="/wishlist"
                      className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-green-800 transition-colors hover:bg-stone-200 hover:text-stone-900"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      Wishlists
                    </Link>
                    <Link
                      href="/price-requests"
                      className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-green-800 transition-colors hover:bg-stone-200 hover:text-stone-900"
                      role="menuitem"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      Price requests
                    </Link>
                  </div>
                  <div className="mt-2 border-t border-stone-300 pt-2">
                    <LogoutButton className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-green-800 transition-colors hover:bg-stone-200 hover:text-stone-900">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </LogoutButton>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link href="/login" className="hover:text-stone-900">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}