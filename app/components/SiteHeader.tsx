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
          <Link href="/products/new" className="hover:text-[#1E1B16]">
            Add product
          </Link>
          <CartLink />

          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col leading-tight text-right">
                <span className="text-sm font-medium text-[#1E1B16]">
                  {session.name}
                </span>
                <span className="text-xs text-[#55624A]">
                  {session.email}
                </span>
              </div>
              <LogoutButton />
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