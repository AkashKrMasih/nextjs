import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/money';
import Link from 'next/link';

function numberParam(value: string | undefined) {
  if (value == null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const { q: rawQuery, category, min, max } = await searchParams;
  const query = rawQuery?.trim() ?? '';
  const categoryId = numberParam(category);
  const minPrice = numberParam(min);
  const maxPrice = numberParam(max);
  const hasFilters = Boolean(query || categoryId || minPrice != null || maxPrice != null);

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(minPrice != null || maxPrice != null
          ? {
              price: {
                ...(minPrice != null ? { gte: minPrice } : {}),
                ...(maxPrice != null ? { lte: maxPrice } : {}),
              },
            }
          : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        variants: { include: { inventory: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <form action="/" className="mb-8 space-y-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by title or description"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-stone-600">
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
          <label className="flex w-32 flex-col gap-1 text-sm text-stone-600">
            Min price
            <input
              type="number"
              name="min"
              min="0"
              step="0.01"
              defaultValue={minPrice ?? ''}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
            />
          </label>
          <label className="flex w-32 flex-col gap-1 text-sm text-stone-600">
            Max price
            <input
              type="number"
              name="max"
              min="0"
              step="0.01"
              defaultValue={maxPrice ?? ''}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            Search
          </button>
          {hasFilters ? (
            <Link href="/" className="py-2 text-sm text-stone-500 hover:text-stone-900">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const stock = product.variants.reduce(
              (sum, variant) => sum + (variant.inventory?.quantity ?? 0),
              0
            );
            return (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="block overflow-hidden rounded-lg border border-stone-300 bg-white hover:border-green-800"
                >
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
                  <div className="p-4">
                    <h2 className="text-lg leading-snug">{product.name}</h2>
                    <p className="mt-1 text-sm text-green-800">{formatPrice(product.price)}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
