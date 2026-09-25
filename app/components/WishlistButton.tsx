'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleWishlist } from '@/app/actions/wishlist';

export function WishlistButton({
  productId,
  initialWishlisted,
}: {
  productId: number;
  initialWishlisted: boolean;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !wishlisted;
    setWishlisted(next);
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (!result.ok) {
        setWishlisted(!next);
        if (result.error === 'UNAUTHENTICATED') {
          router.push('/login');
        }
        return;
      }
      setWishlisted(result.wishlisted);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={wishlisted}
      className="text-sm text-green-800 underline hover:text-stone-900 disabled:opacity-60"
    >
      {wishlisted ? 'In wishlist' : 'Add to wishlist'}
    </button>
  );
}
