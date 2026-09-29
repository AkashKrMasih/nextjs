import { prisma } from '@/lib/prisma';
import { getWishlistedProductIds } from '@/app/wishlist/actions';
import {
  homeCatalogProductInclude,
  homeCatalogProductOrderBy,
  homeCatalogProductWhere,
  parseHomeCatalogFilters,
  type HomeCatalogSearchParams,
  type HomeCatalogSort,
} from '@/lib/home-catalog-query';

export type { HomeCatalogSearchParams, HomeCatalogSort };
export { productStock } from '@/lib/home-catalog-query';

export async function loadHomeCatalog(searchParams: Promise<HomeCatalogSearchParams>) {
  const raw = await searchParams;
  const filters = parseHomeCatalogFilters(raw);

  const [categories, products, wishlistedIds] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: homeCatalogProductWhere(filters),
      orderBy: homeCatalogProductOrderBy(filters.sort),
      include: homeCatalogProductInclude,
    }),
    getWishlistedProductIds(),
  ]);

  return {
    query: filters.query,
    categoryId: filters.categoryId,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    hasFilters: filters.hasFilters,
    categories,
    products,
    wishlistedIds,
  };
}
