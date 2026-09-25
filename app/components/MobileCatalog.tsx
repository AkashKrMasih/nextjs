import Link from 'next/link';
import { formatPrice } from '@/lib/money';
import { WishlistButton } from '@/app/components/WishlistButton';
import { chooseDesktopHome } from '@/app/home/home-layout.actions';
import { loadHomeCatalog, productStock } from '@/app/home/load-home-catalog';

const fieldClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800';

export async function MobileCatalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const catalog = await loadHomeCatalog(searchParams);

  return (
    <main className="mx-auto max-w-md px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl text-stone-900">Shop</h1>
        <form action={chooseDesktopHome}>
          <button type="submit" className="text-sm text-green-800">
            Desktop version
          </button>
        </form>
      </div>

      <form action="/" className="mb-5 space-y-3">
        <input
          type="search"
          name="q"
          defaultValue={catalog.query}
          placeholder="Search"
          className={fieldClass}
        />
        <label className="block text-sm text-stone-600">
          Category
          <select
            name="category"
            defaultValue={catalog.categoryId ? String(catalog.categoryId) : ''}
            className={`${fieldClass} mt-1`}
          >
            <option value="">All categories</option>
            {catalog.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-stone-600">
            Min
            <input
              type="number"
              name="min"
              min="0"
              step="0.01"
              defaultValue={catalog.minPrice ?? ''}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-sm text-stone-600">
            Max
            <input
              type="number"
              name="max"
              min="0"
              step="0.01"
              defaultValue={catalog.maxPrice ?? ''}
              className={`${fieldClass} mt-1`}
            />
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-green-800 py-3 text-base font-medium text-white"
        >
          Search
        </button>
        {catalog.hasFilters ? (
          <Link href="/" className="block text-center text-sm text-stone-500">
            Clear
          </Link>
        ) : null}
      </form>

      {catalog.products.length === 0 ? (
        <p className="text-sm text-stone-500">
          {catalog.hasFilters ? 'No products match this search.' : 'No products yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {catalog.products.map((product) => {
            const stock = productStock(product);
            const image = product.images[0]?.url;
            return (
              <li key={product.id} className="overflow-hidden rounded-xl border border-stone-300 bg-white">
                <Link href={`/products/${product.friendlyId}`} className="flex gap-3 p-3">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-stone-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base leading-snug text-stone-900">{product.name}</h2>
                    <p className="mt-1 text-xs text-stone-500">
                      {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                    </p>
                    {product.priceOnRequest ? (
                      <p className="mt-2 text-sm font-medium text-green-800">Price on request</p>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-green-800">{formatPrice(product.price)}</p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center justify-end gap-3 border-t border-stone-200 px-3 py-2">
                  {product.priceOnRequest ? (
                    <Link
                      href={`/products/${product.friendlyId}/price-request`}
                      className="mr-auto rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white"
                    >
                      Price Request
                    </Link>
                  ) : null}
                  <WishlistButton
                    productId={product.id}
                    initialWishlisted={catalog.wishlistedIds.has(product.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
