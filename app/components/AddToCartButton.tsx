'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/cart';

export function AddToCartButton({
  id,
  name,
  price,
  quantity = 1,
  disabled,
}: {
  id: number;
  name: string;
  price: string;
  quantity?: number;
  disabled?: boolean;
}) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      await addToCart({ id, name, price }, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to cart');
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="rounded bg-green-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
