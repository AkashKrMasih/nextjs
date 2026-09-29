import { HomeCatalogClient } from '@/app/components/HomeCatalogClient';
import {
  type HomeCatalogSearchParams,
  loadHomeCatalog,
} from '@/app/home/load-home-catalog';
import { serializeHomeCatalogProduct } from '@/lib/home-catalog-serialize';

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

  const initialProducts = products.map((product) =>
    serializeHomeCatalogProduct(product, wishlistedIds)
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <HomeCatalogClient
        initialProducts={initialProducts}
        initialHasFilters={hasFilters}
        query={query}
        categoryId={categoryId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sort={sort}
        categories={categories}
      />
    </main>
  );
}
