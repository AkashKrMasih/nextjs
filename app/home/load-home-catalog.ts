import { prisma } from '@/lib/prisma';
import { getWishlistedProductIds } from '@/app/wishlist/actions';

function numberParam(value: string | undefined) {
  if (value == null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export type HomeCatalogSearchParams = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
};

export type HomeCatalogSort = 'newest' | 'price' | 'title';

function parseSort(value: string | undefined): HomeCatalogSort {
  if (value === 'price' || value === 'title') return value;
  return 'newest';
}

export async function loadHomeCatalog(searchParams: Promise<HomeCatalogSearchParams>) {
  const { q: rawQuery, category, min, max, sort: rawSort } = await searchParams;
  const query = rawQuery?.trim() ?? '';
  const categoryId = numberParam(category);
  const minPrice = numberParam(min);
  const maxPrice = numberParam(max);
  const sort = parseSort(rawSort);
  const hasFilters = Boolean(query || categoryId || minPrice != null || maxPrice != null);

  const productOrderBy =
    sort === 'price'
      ? { price: 'asc' as const }
      : sort === 'title'
        ? { name: 'asc' as const }
        : { createdAt: 'desc' as const };

  const [categories, products, wishlistedIds] = await Promise.all([
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
      orderBy: productOrderBy,
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        variants: { include: { inventory: true } },
      },
    }),
    getWishlistedProductIds(),
  ]);

  return {
    query,
    categoryId,
    minPrice,
    maxPrice,
    sort,
    hasFilters,
    categories,
    products,
    wishlistedIds,
  };
}

export function productStock(product: { variants: { inventory: { quantity: number } | null }[] }) {
  return product.variants.reduce((sum, variant) => sum + (variant.inventory?.quantity ?? 0), 0);
}
