'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  cartTotal,
  clearCart,
  readCart,
  removeFromCart,
  updateQuantity,
  type CartItem,
} from '@/lib/cart';
import { formatPrice } from '@/lib/money';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  function refresh() {
    setItems(readCart());
  }

  useEffect(() => {
    refresh();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-[#8A8375]">Loading cart…</p>
      </main>
    );
  }

  const total = cartTotal();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl tracking-tight">Cart</h1>
      <p className="mt-1 text-sm text-[#8A8375]">
        Stored in this browser only. Checkout and accounts are not enabled yet.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-[#8A8375]">
          Your cart is empty.{' '}
          <Link href="/" className="text-[#55624A] underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 border-b border-[#D8D2C4] pb-4"
            >
              <div>
                <Link href={`/products/${item.id}`} className="hover:text-[#55624A]">
                  {item.name}
                </Link>
                <p className="text-sm text-[#8A8375]">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  className="w-16 rounded border border-[#D8D2C4] bg-white p-1 text-center"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    updateQuantity(item.id, Number(e.target.value));
                    refresh();
                  }}
                />
                <button
                  type="button"
                  className="text-sm text-red-800"
                  onClick={() => {
                    removeFromCart(item.id);
                    refresh();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <p className="text-lg">Total {formatPrice(total)}</p>
            <button
              type="button"
              className="text-sm text-[#8A8375] underline"
              onClick={() => {
                clearCart();
                refresh();
              }}
            >
              Clear cart
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
