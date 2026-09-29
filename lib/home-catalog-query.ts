export type HomeCatalogSearchParams = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
};

export type HomeCatalogFilterValues = {
  q: string;
  category: string;
  min: string;
  max: string;
  sort: string;
};

export type HomeCatalogSort = 'newest' | 'price' | 'title';

export type ParsedHomeCatalogFilters = {
  query: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: HomeCatalogSort;
  hasFilters: boolean;
};

function numberParam(value: string | undefined | null) {
  if (value == null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseHomeCatalogSort(value: string | undefined | null): HomeCatalogSort {
  if (value === 'price' || value === 'title') return value;
  return 'newest';
}

export function parseHomeCatalogFilters(input: HomeCatalogSearchParams): ParsedHomeCatalogFilters {
  const query = input.q?.trim() ?? '';
  const categoryId = numberParam(input.category);
  const minPrice = numberParam(input.min);
  const maxPrice = numberParam(input.max);
  const sort = parseHomeCatalogSort(input.sort);
  const hasFilters = Boolean(query || categoryId || minPrice != null || maxPrice != null);

  return { query, categoryId, minPrice, maxPrice, sort, hasFilters };
}

export function homeCatalogProductOrderBy(sort: HomeCatalogSort) {
  if (sort === 'price') return { price: 'asc' as const };
  if (sort === 'title') return { name: 'asc' as const };
  return { createdAt: 'desc' as const };
}

export function homeCatalogProductWhere(filters: ParsedHomeCatalogFilters) {
  const { query, categoryId, minPrice, maxPrice } = filters;

  return {
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
            { name: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
}

export const homeCatalogProductInclude = {
  images: { orderBy: { isPrimary: 'desc' as const } },
  variants: { include: { inventory: true } },
};

export function productStock(product: {
  variants: { inventory: { quantity: number } | null }[];
}) {
  return product.variants.reduce((sum, variant) => sum + (variant.inventory?.quantity ?? 0), 0);
}
