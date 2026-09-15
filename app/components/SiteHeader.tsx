import Link from 'next/link';
import { getSession } from '@/lib/session';
import { LogoutButton } from './LogoutButton';
import { CartLink } from './CartLink';

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-[#D8D2C4] bg-[#FAF8F3]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl tracking-tight">
          Shop
        </Link>

        <nav className="flex items-center gap-5 text-sm text-[#55624A]">
          <Link href="/" className="hover:text-[#1E1B16]">
            Catalog
          </Link>
          <Link href="/admin/products/new" className="hover:text-[#1E1B16]">
            Add product
          </Link>
          <CartLink />

          {session ? (
            <div className="group relative">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE9DC] text-[#55624A] transition-colors hover:bg-[#E3DCC9] hover:text-[#1E1B16]"
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
                className="invisible absolute right-0 top-full z-10 w-56 translate-y-1 rounded-lg border border-[#D8D2C4] bg-[#FAF8F3] p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-y-2 group-hover:opacity-100"
                role="menu"
              >
                <div className="mb-2 flex flex-col leading-tight">
                  <span className="text-sm font-medium text-[#1E1B16]">
                    {session.name}
                  </span>
                  <span className="text-xs text-[#55624A]">
                    {session.email}
                  </span>
                </div>
                <div className="border-t border-[#D8D2C4] pt-2">
                  <LogoutButton className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#55624A] transition-colors hover:bg-[#EFE9DC] hover:text-[#1E1B16]">
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
          ) : (
            <Link href="/login" className="hover:text-[#1E1B16]">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}