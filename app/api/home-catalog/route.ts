import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  homeCatalogProductInclude,
  homeCatalogProductOrderBy,
  homeCatalogProductWhere,
  parseHomeCatalogFilters,
  type HomeCatalogSearchParams,
} from '@/lib/home-catalog-query';
import { serializeHomeCatalogProduct } from '@/lib/home-catalog-serialize';
import { getWishlistedProductIds } from '@/app/wishlist/actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input: HomeCatalogSearchParams = {
    q: searchParams.get('q') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    min: searchParams.get('min') ?? undefined,
    max: searchParams.get('max') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  };

  const filters = parseHomeCatalogFilters(input);

  const [products, wishlistedIds] = await Promise.all([
    prisma.product.findMany({
      where: homeCatalogProductWhere(filters),
      orderBy: homeCatalogProductOrderBy(filters.sort),
      include: homeCatalogProductInclude,
    }),
    getWishlistedProductIds(),
  ]);

  return NextResponse.json({
    hasFilters: filters.hasFilters,
    products: products.map((product) => serializeHomeCatalogProduct(product, wishlistedIds)),
  });
}
