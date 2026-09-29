import {formatPrice} from '@/lib/money';
import Link from 'next/link';
import {HomeCatalogFilters} from '@/app/components/HomeCatalogFilters';
import {WishlistButton} from '@/app/components/WishlistButton';
import {
  type HomeCatalogSearchParams,
  loadHomeCatalog,
  productStock,
} from '@/app/home/load-home-catalog';

export async function HomeCatalog({
                                    searchParams,
                                  }: {
  searchParams: Promise<HomeCatalogSearchParams>;
}) {
  const {
          query,
          categoryId,
          minPrice,
          maxPrice,
          sort,
          hasFilters,
          categories,
          products,
          wishlistedIds,
        } = await loadHomeCatalog(searchParams);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-12 gap-8">
        <HomeCatalogFilters
          query={query}
          categoryId={categoryId}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          hasFilters={hasFilters}
          categories={categories}
        />

        {/* Products: col-8 */}
        <section className="col-span-12 md:col-span-8">
          {products.length === 0 ? (
            <p className="text-sm text-stone-500">
              {hasFilters ? (
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
              {products.map((product) => {
                const stock = productStock(product);
                return (
                  <li key={product.id}
                      className="overflow-hidden rounded-lg border border-stone-300 bg-white hover:border-green-800">
                    <Link href={`/products/${product.friendlyId}`} className="block">
                      <div className="aspect-[4/3] bg-stone-100">
                        {product.images[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
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
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </p>
                      </div>
                    </Link>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
                      <p className="mt-1 text-sm text-green-800">{formatPrice(product.price)}</p>
                      <WishlistButton
                        productId={product.id}
                        initialWishlisted={wishlistedIds.has(product.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}