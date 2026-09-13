import Link from 'next/link';
import { CartLink } from './CartLink';

export function SiteHeader() {
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
        </nav>
      </div>
    </header>
  );
}
