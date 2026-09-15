'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cartCount, CART_EVENT } from '@/lib/cart';

export function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = async () => setCount(await cartCount());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <Link href="/cart" className="hover:text-[#1E1B16]">
      Cart{count > 0 ? ` (${count})` : ''}
    </Link>
  );
}
