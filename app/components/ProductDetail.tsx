'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Share2,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { formatPrice } from '@/lib/money';
import { AddToCartButton } from '@/app/components/AddToCartButton';
import { DeleteProductButton } from '@/app/components/DeleteProductButton';

type Product = {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  description: string | null;
  imageUrl: string | null;
};

export function ProductDetail({
                                product,
                                related,
                              }: {
  product: Product;
  related: Product[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const inStock = product.stock > 0;

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Catalog
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-[28px] bg-muted">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
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
          <h1 className="text-3xl md:text-4xl leading-tight tracking-tight text-foreground">
            {product.name}
          </h1>

          <p className="text-3xl font-light text-primary">{formatPrice(product.price)}</p>

          {product.description && (
            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Quantity */}
          <div className="flex items-center overflow-hidden rounded-full border border-border w-fit">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-muted"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-10 select-none text-center text-sm font-medium text-foreground">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-muted"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <AddToCartButton
              id={product.id}
              name={product.name}
              price={product.price.toString()}
              disabled={!inStock}
            />

            <button
              onClick={() => setWishlist((w) => !w)}
              aria-label="Add to wishlist"
              className={[
                'flex h-12 w-12 items-center justify-center rounded-full border transition-all',
                wishlist
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              ].join(' ')}
            >
              <Heart className={['size-5', wishlist ? 'fill-red-500' : ''].join(' ')} />
            </button>

            <button
              onClick={handleShare}
              aria-label="Share"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-foreground/40 hover:text-foreground"
            >
              <Share2 className="size-5" />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/products/${product.id}/edit`}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Edit
            </Link>
            <DeleteProductButton id={product.id} name={product.name} />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            {[
              { icon: Truck, label: 'Free delivery', sub: '2–4 days' },
              { icon: ShieldCheck, label: 'Secure checkout', sub: 'Encrypted' },
              { icon: RotateCcw, label: 'Easy returns', sub: '30 days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-muted/60 p-3 text-center">
                <Icon className="size-5 text-primary" />
                <p className="text-xs font-medium leading-tight text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products (real Prisma data) */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-normal text-foreground">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="group overflow-hidden rounded-[20px] border border-border bg-card transition-all hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{item.name}</p>
                  <p className="text-sm text-foreground">{formatPrice(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}