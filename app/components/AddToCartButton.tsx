'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/cart';

export function AddToCartButton({
  id,
  name,
  price,
  disabled,
}: {
  id: number;
  name: string;
  price: string;
  disabled?: boolean;
}) {
  const [added, setAdded] = useState(false);

  function handleClick() {
    addToCart({ id, name, price });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="rounded bg-[#55624A] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {disabled ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
    </button>
  );
}
