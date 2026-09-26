'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleWishlist } from '@/app/wishlist/actions';

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
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-60',
        wishlisted
          ? 'border-red-300 bg-red-50 text-red-500'
          : 'border-stone-200 text-stone-500 hover:border-stone-900/40 hover:text-stone-900',
      ].join(' ')}
    >
      <Heart className={['size-4', wishlisted ? 'fill-red-500' : ''].join(' ')} />
    </button>
  );
}
