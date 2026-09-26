import {formatPrice} from '@/lib/money';
import Link from 'next/link';
import {WishlistButton} from '@/app/components/WishlistButton';
import {loadHomeCatalog, productStock} from '@/app/home/load-home-catalog';

export async function HomeCatalog({
                                    searchParams,
                                  }: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const {
          query,
          categoryId,
          minPrice,
          maxPrice,
          hasFilters,
          categories,
          products,
          wishlistedIds,
        } = await loadHomeCatalog(searchParams);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-12 gap-8">
        <form action="/" className="contents">
          {/* Search: col-12, own row */}
          <div className="col-span-12">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by title or description"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
            />
          </div>

          {/* Filters: col-4 */}
          <aside className="col-span-12 md:col-span-4">
            <div className="space-y-4 rounded-lg border border-stone-300 bg-white p-4">
              <label className="flex flex-col gap-1 text-sm text-stone-600">
                Category
                <select
                  name="category"
                  defaultValue={categoryId ? String(categoryId) : ''}
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex w-full flex-col gap-1 text-sm text-stone-600">
                  Min price
                  <input
                    type="number"
                    name="min"
                    min="0"
                    step="0.01"
                    defaultValue={minPrice ?? ''}
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
                  />
                </label>
                <label className="flex w-full flex-col gap-1 text-sm text-stone-600">
                  Max price
                  <input
                    type="number"
                    name="max"
                    min="0"
                    step="0.01"
                    defaultValue={maxPrice ?? ''}
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
                  />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
                >
                  Search
                </button>
                {hasFilters ? (
                  <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
                    Clear
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        </form>

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
            <ul className="grid gap-6 sm:grid-cols-2">
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
                      {product.priceOnRequest ? (
                        <Link
                          href={`/products/${product.friendlyId}/price-request`}
                          className="mt-2 inline-block rounded-md bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900"
                        >
                          Price Request
                        </Link>
                      ) : (
                        <p className="mt-1 text-sm text-green-800">{formatPrice(product.price)}</p>
                      )}
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