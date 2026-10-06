'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/app/components/PageHeader';
import {
  Heart,
  Share2,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/money';
import { AddToCartButton } from '@/app/components/AddToCartButton';
import { DeleteProductButton } from '@/app/components/DeleteProductButton';
import { toggleWishlist } from '@/app/wishlist/actions';
import { ProductReportDialog } from '@/app/components/ProductReportDialog';
import { ProductDiscountPanel } from '@/app/components/ProductDiscountPanel';
import { ProductReviews } from '@/app/components/ProductReviews';
import { minAllowedQuantity } from '@/lib/order-quantity';

type ProductImage = {
  id: string;
  url: string;
};

type ProductAttribute = {
  id: string;
  title: string;
  value: string | null;
};

type Product = {
  id: number;
  friendlyId: string;
  name: string;
  price: number | string;
  minOrderQuantity: number | null;
  maxOrderQuantity: number | null;
  returnInDays: number | null;
  stock: number;
  description: string | null;
  images: ProductImage[];
  attributes?: ProductAttribute[];
  reviewsEnabled?: boolean;
  avgRating?: number;
  reviewCount?: number;
};

function ProductImageCarousel({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-100">
        <div className="flex h-full items-center justify-center text-sm text-stone-500">
          No image
        </div>
      </div>
    );
  }

  const goTo = (index: number) => {
    setActive(((index % images.length) + images.length) % images.length);
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="group relative aspect-square overflow-hidden rounded-3xl bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[active].id}
          src={images[active].url}
          alt={`${name} — image ${active + 1} of ${images.length}`}
          className="h-full w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo(active - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-stone-900 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => goTo(active + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-stone-900 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => goTo(index)}
                  aria-label={`Go to image ${index + 1}`}
                  className={[
                    'h-1.5 rounded-full transition-all',
                    index === active ? 'w-4 bg-white' : 'w-1.5 bg-white/60',
                  ].join(' ')}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => goTo(index)}
              aria-label={`View image ${index + 1}`}
              className={[
                'relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                index === active ? 'border-green-800' : 'border-transparent hover:border-stone-200',
              ].join(' ')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({
                                product,
                                related,
                                initialWishlisted = false,
                                isLoggedIn = false,
                                hasPincodeRestriction = false,
                                currentUserId = null,
                                userHasReview = false,
                              }: {
  product: Product;
  related: Product[];
  initialWishlisted?: boolean;
  isLoggedIn?: boolean;
  hasPincodeRestriction?: boolean;
  currentUserId?: string | null;
  userHasReview?: boolean;
}) {
  const router = useRouter();
  const minQuantity = minAllowedQuantity(product);
  const maxQuantity = product.maxOrderQuantity;
  const [quantity, setQuantity] = useState(minQuantity);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isWishlistPending, startWishlistTransition] = useTransition();
  const inStock = product.stock > 0;

  const trustBadges = [
    { icon: Truck, label: 'Free delivery', sub: '2–4 days' },
    { icon: ShieldCheck, label: 'Secure checkout', sub: 'Encrypted' },
    ...(product.returnInDays != null
      ? [
          {
            icon: RotateCcw,
            label: 'Easy returns',
            sub: `${product.returnInDays} ${product.returnInDays === 1 ? 'day' : 'days'}`,
          },
        ]
      : []),
  ];

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  function handleWishlistToggle() {
    const next = !wishlisted;
    setWishlisted(next); // optimistic

    startWishlistTransition(async () => {
      const result = await toggleWishlist(product.id);

      if (!result.ok) {
        setWishlisted(!next); // revert on failure
        if (result.error === 'UNAUTHENTICATED') {
          router.push(`/login?next=/products/${product.friendlyId}`);
        }
        return;
      }

      setWishlisted(result.wishlisted);
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <PageHeader
        title={product.name}
        backHref="/"
        backLabel="Catalog"
        variant="store"
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image carousel */}
        <div className="relative">
          <ProductImageCarousel images={product.images} name={product.name} />
          <span
            className={[
              'absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-medium',
              inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            ].join(' ')}
          >
            {inStock ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-6 lg:pt-2">
          <p className="text-3xl font-light text-green-800">{formatPrice(product.price)}</p>

          <ProductDiscountPanel
            productId={product.id}
            basePrice={product.price.toString()}
            quantity={quantity}
          />

          {product.description && (
            <p className="whitespace-pre-wrap leading-relaxed text-stone-500">
              {product.description}
            </p>
          )}

          {product.attributes && product.attributes.length > 0 && (
            <dl className="divide-y divide-stone-200 border-y border-stone-200">
              {product.attributes.map((attribute) => (
                <div key={attribute.id} className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 text-sm">
                  <dt className="text-stone-500">{attribute.title}</dt>
                  <dd className="text-stone-900">{attribute.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <div className="flex items-center overflow-hidden rounded-full border border-stone-200 w-fit">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
                disabled={quantity <= minQuantity}
                className="flex h-11 w-11 items-center justify-center text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 select-none text-center text-sm font-medium text-stone-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => (maxQuantity != null ? Math.min(maxQuantity, q + 1) : q + 1))
                }
                disabled={maxQuantity != null && quantity >= maxQuantity}
                className="flex h-11 w-11 items-center justify-center text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {product.minOrderQuantity != null || product.maxOrderQuantity != null ? (
              <p className="text-sm text-stone-500">
                {product.minOrderQuantity != null ? `Min ${product.minOrderQuantity}` : null}
                {product.minOrderQuantity != null && product.maxOrderQuantity != null ? ' · ' : null}
                {product.maxOrderQuantity != null ? `Max ${product.maxOrderQuantity}` : null}
                {' per order'}
              </p>
            ) : null}
          </div>

          {hasPincodeRestriction ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Delivery is limited to selected pincodes. You can only checkout if your delivery
              postal code is eligible for this product.
            </p>
          ) : null}

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <AddToCartButton
              id={product.id}
              name={product.name}
              price={product.price.toString()}
              quantity={quantity}
              disabled={!inStock}
            />

            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistPending}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={wishlisted}
              className={[
                'flex h-12 w-12 items-center justify-center rounded-full border transition-all disabled:opacity-60',
                wishlisted
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-stone-200 text-stone-500 hover:border-stone-900/40 hover:text-stone-900',
              ].join(' ')}
            >
              <Heart className={['size-5', wishlisted ? 'fill-red-500' : ''].join(' ')} />
            </button>

            <button
              onClick={handleShare}
              aria-label="Share"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-all hover:border-stone-900/40 hover:text-stone-900"
            >
              <Share2 className="size-5" />
            </button>

            <ProductReportDialog productId={product.id} isLoggedIn={isLoggedIn} />
          </div>

          {/* Trust badges */}
          <div
            className={[
              'grid gap-2 pt-4',
              trustBadges.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
            ].join(' ')}
          >
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-stone-100/60 p-3 text-center">
                <Icon className="size-5 text-green-800" />
                <p className="text-xs font-medium leading-tight text-stone-900">{label}</p>
                <p className="text-xs text-stone-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        friendlyId={product.friendlyId}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        reviewsEnabled={product.reviewsEnabled ?? true}
        initialAvgRating={product.avgRating ?? 0}
        initialReviewCount={product.reviewCount ?? 0}
        userHasReview={userHasReview}
      />

      {/* Related products (real Prisma data) */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-normal text-stone-900">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => {
              const thumb = item.images[0]?.url ?? null;
              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:shadow-md"
                >
                  <Link href={`/products/${item.friendlyId}`}>
                    <div className="aspect-square overflow-hidden bg-stone-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-stone-500">
                          No image
                        </div>
                      )}
                    </div>
                    <p className="line-clamp-2 px-4 pt-4 text-sm font-medium leading-tight text-stone-900">
                      {item.name}
                    </p>
                  </Link>
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-sm text-stone-900">{formatPrice(item.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
