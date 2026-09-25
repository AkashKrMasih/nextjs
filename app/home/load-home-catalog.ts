import { prisma } from '@/lib/prisma';
import { getWishlistedProductIds } from '@/app/actions/wishlist';

function numberParam(value: string | undefined) {
  if (value == null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export async function loadHomeCatalog(
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>
) {
  const { q: rawQuery, category, min, max } = await searchParams;
  const query = rawQuery?.trim() ?? '';
  const categoryId = numberParam(category);
  const minPrice = numberParam(min);
  const maxPrice = numberParam(max);
  const hasFilters = Boolean(query || categoryId || minPrice != null || maxPrice != null);

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
      orderBy: { createdAt: 'desc' },
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
    hasFilters,
    categories,
    products,
    wishlistedIds,
  };
}

export function productStock(product: { variants: { inventory: { quantity: number } | null }[] }) {
  return product.variants.reduce((sum, variant) => sum + (variant.inventory?.quantity ?? 0), 0);
}
