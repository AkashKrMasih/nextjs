'use client';

import { formatPrice } from '@/lib/money';
import type { HomeCatalogProductDto } from '@/lib/home-catalog-serialize';
import type { HomeCatalogFilterValues, HomeCatalogSort } from '@/lib/home-catalog-query';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { HomeCatalogFilters } from '@/app/components/HomeCatalogFilters';
import { WishlistButton } from '@/app/components/WishlistButton';

type CategoryOption = { id: number; name: string };

function catalogSearchParams(values: HomeCatalogFilterValues) {
  const params = new URLSearchParams();
  const trimmedQ = values.q.trim();
  if (trimmedQ) params.set('q', trimmedQ);
  if (values.category) params.set('category', values.category);
  const min = values.min.trim();
  const max = values.max.trim();
  if (min) params.set('min', min);
  if (max) params.set('max', max);
  if (values.sort) params.set('sort', values.sort);
  return params;
}

export function HomeCatalogClient({
  initialProducts,
  initialHasFilters,
  query,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  categories,
}: {
  initialProducts: HomeCatalogProductDto[];
  initialHasFilters: boolean;
  query: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: HomeCatalogSort;
  categories: CategoryOption[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [hasFilters, setHasFilters] = useState(initialHasFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async (values: HomeCatalogFilterValues) => {
    setLoading(true);
    setError(null);
    try {
      const params = catalogSearchParams(values);
      const qs = params.toString();
      const response = await fetch(qs ? `/api/home-catalog?${qs}` : '/api/home-catalog');
      if (!response.ok) {
        throw new Error('Could not load products');
      }
      const data = (await response.json()) as {
        products: HomeCatalogProductDto[];
        hasFilters: boolean;
      };
      setProducts(data.products);
      setHasFilters(data.hasFilters);
    } catch {
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-12 gap-8">
      <HomeCatalogFilters
        query={query}
        categoryId={categoryId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sort={sort}
        hasFilters={hasFilters}
        categories={categories}
        onApplyFilters={fetchCatalog}
      />

      <section className="col-span-12 md:col-span-8" aria-busy={loading}>
        {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
        {loading && products.length > 0 ? (
          <p className="mb-4 text-sm text-stone-500">Updating results…</p>
        ) : null}
        {products.length === 0 ? (
          <p className="text-sm text-stone-500">
            {loading ? (
              'Loading…'
            ) : hasFilters ? (
              'No products match this search.'
            ) : (
              <>
                No products yet.{' '}
                <Link href="/products/new" className="text-green-800 underline">
                  Create the first one
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-3">
            {products.map((product) => (
              <li
                key={product.id}
                className="overflow-hidden rounded-lg border border-stone-300 bg-white hover:border-green-800"
              >
                <Link href={`/products/${product.friendlyId}`} className="block">
                  <div className="aspect-[4/3] bg-stone-100">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4 pb-2">
                    <h2 className="text-lg leading-snug">{product.name}</h2>
                    <p className="mt-1 text-xs text-stone-500">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
                  <p className="mt-1 text-sm text-green-800">{formatPrice(product.price)}</p>
                  <WishlistButton productId={product.id} initialWishlisted={product.wishlisted} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
